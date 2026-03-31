import { useState } from 'react';
import { FaRobot, FaUser, FaCopy, FaCheck } from 'react-icons/fa';

const Message = ({ role, content, isGreeting, sources }) => {
  const [copied, setCopied] = useState(false);
  const isBot = role === 'assistant';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-gradient-to-br from-[#1e3a5f] to-[#044a8f]' : 'bg-gray-600'}`}>
        {isBot ? <FaRobot className="text-white text-sm" /> : <FaUser className="text-white text-sm" />}
      </div>
      <div className={`max-w-[75%] ${isBot ? 'items-start' : 'items-end'} flex flex-col`}>
        <div className={`px-4 py-2.5 rounded-2xl ${isBot ? 'bg-white text-gray-800 rounded-tl-sm shadow-md' : 'bg-[#1e3a5f] text-white rounded-tr-sm shadow-md'}`}>
          {isGreeting && <p className="text-sm font-medium mb-2">👋 Hello! I'm your AI assistant. How can I help you today?</p>}
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
        <div className={`flex items-center gap-2 mt-1 ${isBot ? 'self-start' : 'self-end'}`}>
          <button onClick={copyToClipboard} className="p-1 text-gray-400 hover:text-[#1e3a5f] transition-colors" aria-label="Copy message">
            {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
          </button>
        </div>
        {sources && sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {sources.map((source, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
              >
                <span className="font-medium">📄 {source.pdf_name || 'Document'}</span>
                {source.page && <span className="text-gray-500">• {source.page}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
