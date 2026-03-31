import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import "./styles/chat.css";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import ChatButton from "./components/ChatButton";
import ChatPage from "./pages/ChatPage";
import Auth from "./components/Auth";
import { getUser } from "./api/chatApi";

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('auth_token');
    return token ? { token } : null;
  });
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      const response = await getUser();
      const userData = response.data.user || response.data;
      setUser({ ...userData, token });
    } catch (error) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (userData, token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('username', userData.username);
    }
    setUser({ ...userData, token });
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    setUser(null);
    setIsChatOpen(false);
  };

  const toggleChat = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setIsChatOpen(prev => !prev);
  };

  const closeChat = () => setIsChatOpen(false);

  // Simple landing page
  const LandingPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-[#1e3a5f] to-[#044a8f] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
          <span className="text-white text-3xl">💬</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
          AI Chat Assistant
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Get instant answers to your questions powered by RAG technology. 
          Sign in to start chatting with our AI assistant.
        </p>
        <button 
          onClick={toggleChat}
          className="btn-primary px-8 py-4 text-lg"
        >
          Start Chatting
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar 
            user={user} 
            onLogout={handleLogout} 
            onOpenChat={toggleChat}
          />
          
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={
              user ? (
                <ChatPage onClose={closeChat} />
              ) : (
                <div className="pt-20 flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Please sign in to use the chat</p>
                    <button onClick={() => setShowAuth(true)} className="btn-primary">
                      Sign In
                    </button>
                  </div>
                </div>
              )
            } />
          </Routes>
          
          {!isChatOpen && <ChatButton onClick={toggleChat} user={user} />}
          
          {isChatOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
                <ChatPage onClose={closeChat} />
              </div>
            </div>
          )}

          {showAuth && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <Auth 
                onAuth={handleAuth} 
                onClose={() => setShowAuth(false)} 
              />
            </div>
          )}
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
