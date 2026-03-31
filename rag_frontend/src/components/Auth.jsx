import { useState } from 'react';
import { login, signup } from '../api/chatApi';
import { FaUser, FaLock, FaEnvelope, FaSignInAlt, FaUserPlus, FaTimes } from 'react-icons/fa';

const Auth = ({ onAuth, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        const response = await login({ username: formData.username, password: formData.password });
        const token = response.data.token;
        const userData = response.data.user;
        if (token) {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('username', userData.username);
        }
        onAuth(userData, token);
      } else {
        await signup(formData);
        const loginResponse = await login({ username: formData.username, password: formData.password });
        const token = loginResponse.data.token;
        const userData = loginResponse.data.user;
        if (token) {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('username', userData.username);
        }
        onAuth(userData, token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes />
          </button>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#044a8f] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">AI</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'Sign in to continue chatting' : 'Sign up to start chatting'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 ml-1 block mb-2">Username</label>
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-gray-800"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="text-sm font-medium text-gray-700 ml-1 block mb-2">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-gray-800"
                  placeholder="Enter email"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 ml-1 block mb-2">Password</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-gray-800"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-[#1e3a5f] to-[#044a8f] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {isLogin ? <FaSignInAlt /> : <FaUserPlus />}
                {isLogin ? 'Sign In' : 'Sign Up'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-[#1e3a5f] hover:underline text-sm font-medium"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
