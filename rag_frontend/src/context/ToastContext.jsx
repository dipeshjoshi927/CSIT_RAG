import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: () => {} };
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'success' ? 'bg-green-500' :
            'bg-[#1e3a5f]'
          }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};
