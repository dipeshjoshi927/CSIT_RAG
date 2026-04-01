# 1. IMPORTS
import os
from pathlib import Path
from threading import Lock
from tiktoken import get_encoding
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq

load_dotenv()

# 2. CONSTANTS
BASE_DIR = Path(__file__).resolve().parent.parent
PDF_DIR = BASE_DIR / "pdfs"
CHROMA_DIR = BASE_DIR / "chroma_db"
ENCODING = get_encoding("cl100k_base")  # tokenizer for truncation

# 3. PDF PROCESSING
def load_pdfs():
    """Load all PDFs from the pdfs/ directory"""
    documents = []
    for pdf_path in PDF_DIR.rglob("*.pdf"):
        try:
            docs = PyPDFLoader(str(pdf_path)).load()
        except Exception:
            docs = PyMuPDFLoader(str(pdf_path)).load()
        documents.extend(docs)
    return documents

def split_pdfs(documents, chunk_size=1000, chunk_overlap=100):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return splitter.split_documents(documents)

# 4. EMBEDDINGS
def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="intfloat/e5-large-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )

# 5. VECTORSTORE LOADER
def load_vectorstore():
    if not CHROMA_DIR.exists():
        raise FileNotFoundError("Chroma DB not found. Build it first.")
    return Chroma(
        persist_directory=str(CHROMA_DIR),
        embedding_function=get_embeddings()
    )

# 6. UTILITY: CONTEXT TRUNCATION
def truncate_context(text, max_tokens=1500):
    tokens = ENCODING.encode(text)
    if len(tokens) > max_tokens:
        tokens = tokens[:max_tokens]
    return ENCODING.decode(tokens, errors='ignore')

# 7. ADVANCED RAG PIPELINE
class RAGPipeline:
    def __init__(self, retriever, llm, max_context_tokens=1500):
        self.retriever = retriever
        self.llm = llm
        self.history = []
        self.max_context_tokens = max_context_tokens

    def _build_prompt(self, question, context, history_text=None):
        # Check if the question is a greeting or unrelated query
        greeting_keywords = ["hi", "hello", "hey", "how are you", "good morning", "good evening"]
        if any(greeting in question.lower() for greeting in greeting_keywords):
            prompt = f"You are a friendly assistant. Respond warmly and politely to greetings.\n\nQuestion:\n{question}\nAnswer with a friendly greeting or response."
            return prompt, True  # Return prompt and is_greeting=True

        # Check if no relevant documents were found
        if not context or len(context) == 0:
            prompt = f"""You are a helpful assistant. The user is asking a question, but I don't have any relevant documents in my knowledge base to answer it.

Question: {question}

Please respond by:
1. Apologizing that you don't have specific information about this topic in your knowledge base
2. Suggesting that the knowledge base may need to be updated with relevant documents
3. Offering to help with general questions or asking if they'd like to add documents about this topic
Keep the response brief and friendly."""
            return prompt, True  # Treat as greeting-like (no sources)

        # Otherwise, generate the structured context for questions
        structured_context = "\n\n".join(f"Document {i+1}: {doc.page_content}" 
                                        for i, doc in enumerate(context))
        structured_context = truncate_context(structured_context, self.max_context_tokens)

        prompt = "You are a helpful assistant with expertise in the provided documents.\n"
        if history_text:
            prompt += f"Conversation history:\n{history_text}\n\n"
        prompt += f"Relevant context from documents:\n{structured_context}\n\n"
        prompt += f"User question: {question}\n\n"
        prompt += """Instructions:
- Answer based ONLY on the provided context
- If the question requires multiple pieces of information, combine them from different sources
- If the context doesn't contain enough information, state what you know and what is missing
- Be thorough but concise (max 3-4 sentences for simple questions, up to 6 sentences for complex ones)
- If asked about comparisons, list differences clearly
- If asked about a process or steps, enumerate them clearly"""
        return prompt, False  # Return prompt and is_greeting=False

    def _build_sources(self, docs):
        """Build a minimal list of sources showing only document name and page (max 2)."""
        sources = []
        # Limit to maximum 2 sources
        for i, doc in enumerate(docs[:2]):
            meta = getattr(doc, "metadata", {}) or {}
            raw_source = meta.get("source") or meta.get("file_path") or ""
            page = meta.get("page") or meta.get("page_number")
            
            # Extract PDF filename from path - only show the name
            pdf_name = "Document"
            if raw_source:
                pdf_name = os.path.basename(raw_source)
                # Remove extension
                pdf_name = os.path.splitext(pdf_name)[0]
            
            sources.append(
                {
                    "pdf_name": pdf_name,
                    "page": page,
                }
            )
        return sources

    def query(self, question: str):
        """
        Basic query without history.
        Returns a dict with `answer`, `sources`, and `is_greeting` flag.
        """
        docs = self.retriever.invoke(f"query: {question}")
        prompt, is_greeting = self._build_prompt(question, docs)
        response = self.llm.invoke(prompt)
        # Handle both string and AIMessage responses
        if hasattr(response, 'content'):
            answer = response.content
        else:
            answer = str(response)
        self.history.append({"question": question, "answer": answer})
        return {
            "answer": answer,
            "sources": [] if is_greeting else self._build_sources(docs),
            "is_greeting": is_greeting,
        }

    def query_with_history(self, question: str, history_text: str):
        """
        Query using the conversation history.
        Returns a dict with `answer`, `sources`, and `is_greeting` flag.
        """
        docs = self.retriever.invoke(f"query: {question}")
        prompt, is_greeting = self._build_prompt(question, docs, history_text)
        response = self.llm.invoke(prompt)
        # Handle both string and AIMessage responses
        if hasattr(response, 'content'):
            answer = response.content
        else:
            answer = str(response)
        return {
            "answer": answer,
            "sources": [] if is_greeting else self._build_sources(docs),
            "is_greeting": is_greeting,
        }

# 8. SINGLETON RAG ENGINE FOR DJANGO
class RAGEngine:
    _instance = None
    _lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        print("🚀 Initializing GROQ + Chroma RAG Engine...")
        self.vectorstore = load_vectorstore()
        # Use MMR (Maximum Marginal Relevance) for better diversity in results
        self.retriever = self.vectorstore.as_retriever(
            search_type="mmr",  # Maximum Marginal Relevance - better for complex queries
            search_kwargs={"k": 8, "fetch_k": 15}  # Get more candidates, return top 8
        )

        # Using GROQ LLM
        self.llm = ChatGroq(
            groq_api_key=os.getenv("GROQ_API_KEY"),
            model_name="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=512
        )

        self.pipeline = RAGPipeline(retriever=self.retriever, llm=self.llm)

    def query(self, question: str):
        return self.pipeline.query(question)

    def query_with_history(self, question: str, history_text: str):
        return self.pipeline.query_with_history(question, history_text)
