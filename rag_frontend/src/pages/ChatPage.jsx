import { useState, useEffect, useCallback } from "react";
import ChatBox from "../components/ChatBox";
import { getConversations, getConversation, chat } from "../api/chatApi";
import { IoClose, IoTrashOutline } from "react-icons/io5";

const ChatPage = ({ onClose }) => {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const isOverlay = typeof onClose === "function";

  // Load conversations
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingConversations(true);
      try {
        const res = await getConversations();
        if (!cancelled) setConversations(res.data ?? []);
      } catch (err) {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    getConversation(conversationId)
      .then((res) => {
        if (!cancelled) setMessages(res.data?.messages ?? []);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => { cancelled = true; };
  }, [conversationId]);

  const reloadConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      setConversations(res.data ?? []);
    } catch (err) {
      setConversations([]);
    }
  }, []);

  const handleSendMessage = useCallback(async (inputMessage) => {
    if (!inputMessage.trim()) return;
    
    setIsTyping(true);
    
    try {
      const res = await chat({
        message: inputMessage,
        conversation_id: conversationId,
        new_chat: !conversationId
      });
      
      const { conversation_id, assistant_message } = res.data;
      
      // Update conversation ID if it's a new conversation
      if (!conversationId && conversation_id) {
        setConversationId(conversation_id);
      }
      
      // Add user message and assistant response
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: inputMessage },
        assistant_message
      ]);
      
      // Reload conversations to update the list
      reloadConversations();
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage = err.response?.data?.error || 'Sorry, I encountered an error. Please try again.';
      setMessages(prev => [
        ...prev,
        { role: 'user', content: inputMessage },
        { role: 'assistant', content: errorMessage }
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [conversationId, reloadConversations]);

  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
  };

  const selectConversation = (id) => {
    setConversationId(id);
  };

  return (
    <div className={`flex h-full ${isOverlay ? 'h-[80vh]' : 'min-h-[calc(100vh-64px)]'}`}>
      {/* Sidebar - Conversations */}
      {!isOverlay && (
        <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={startNewChat}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loadingConversations ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg mb-1 text-sm transition-colors ${
                    conversationId === conv.id
                      ? 'bg-[#1e3a5f] text-white'
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="truncate font-medium">
                    {conv.title || 'New Chat'}
                  </div>
                  <div className="text-xs opacity-70 truncate">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#044a8f] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <div>
              <h3 className="text-white font-bold">AI Chat Assistant</h3>
              <p className="text-white/70 text-xs">Powered by RAG</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="New Chat"
            >
              <IoTrashOutline className="text-lg" />
            </button>
            {isOverlay && (
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <IoClose className="text-xl" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ChatBox
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
