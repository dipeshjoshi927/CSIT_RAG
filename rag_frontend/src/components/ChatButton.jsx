import { IoChatbubblesOutline } from "react-icons/io5";

const ChatButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-[#1e3a5f] to-[#044a8f] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-110"
      aria-label="Open chat"
    >
      <IoChatbubblesOutline size={24} />
    </button>
  );
};

export default ChatButton;
