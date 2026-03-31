import { useState } from "react";
import { Link } from "react-router-dom";
import { IoChatbubblesOutline, IoLogOutOutline, IoPersonOutline } from "react-icons/io5";

const Navbar = ({ user, onLogout, onOpenChat }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a5f] to-[#044a8f] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-xl font-bold text-gray-800">
              ChatBot
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-[#1e3a5f] font-medium">
              Home
            </Link>
            <button 
              onClick={onOpenChat}
              className="flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] font-medium"
            >
              <IoChatbubblesOutline />
              Chat
            </button>
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <IoPersonOutline />
                  <span className="font-medium">{user.username}</span>
                </div>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600 font-medium"
                >
                  <IoLogOutOutline />
                  Logout
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-[#1e3a5f] font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <button 
                onClick={() => {
                  onOpenChat();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] font-medium py-2"
              >
                <IoChatbubblesOutline />
                Chat
              </button>
              {user && (
                <button 
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600 font-medium py-2"
                >
                  <IoLogOutOutline />
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
