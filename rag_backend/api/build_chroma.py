from rag_engine import (
    process_all_pdfs,
    split_documents,
    get_embeddings
)

from langchain_community.vectorstores import Chroma
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CHROMA_DIR = f"../chroma_db"

print("📄 Loading PDFs...")
docs = process_all_pdfs()

print("✂️ Splitting documents...")
chunks = split_documents(docs)

print("🧠 Creating embeddings...")
embeddings = get_embeddings()

print("💾 Building ChromaDB...")
Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory=str(CHROMA_DIR)
).persist()

print("✅ Vectorstore created successfully")
