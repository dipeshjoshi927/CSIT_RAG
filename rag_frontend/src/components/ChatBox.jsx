import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaStop } from 'react-icons/fa';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

const ChatBox = ({ messages, isTyping, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#1e3a5f] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">💬</span>
            </div>
            <h4 className="text-gray-700 font-semibold">Welcome to AI Chat Assistant</h4>
            <p className="text-gray-500 text-sm mt-1">Ask me anything!</p>
          </div>
        ) : (
          messages.map((msg, idx) => <Message key={idx} {...msg} />)
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-gray-800 placeholder-gray-500"
          />
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2.5 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-[#1e3a5f]'}`}
            title={isRecording ? 'Stop recording' : 'Record'}
          >
            {isRecording ? <FaStop /> : <FaMicrophone />}
          </button>
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-[#1e3a5f] text-white rounded-full hover:bg-[#044a8f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
