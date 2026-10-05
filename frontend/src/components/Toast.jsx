// Toast notifications and context provider with auto-hide timer
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

// Provide toast notification state and helper methods to child tree
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  // Show a notification banner and auto-dismiss after 3 seconds
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((current) => (current && current.message === message ? null : current));
    }, 3000);
  }, []);

  // Dismiss currently active toast notification immediately
  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <aside
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
        >
          <div
            className={`flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-green-700 text-white border-green-800'
            }`}
          >
            <div className="flex items-center space-x-2 mr-2">
              {toast.type === 'error' ? (
                <AlertCircle size={18} className="flex-shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="flex-shrink-0" />
              )}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={hideToast}
              className="p-1 rounded hover:bg-black/10 active:scale-95 transition"
            >
              <X size={16} />
            </button>
          </div>
        </aside>
      )}
    </ToastContext.Provider>
  );
};

// Custom React hook to trigger toast notifications easily
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: () => {}, hideToast: () => {} };
  }
  return context;
};

export default ToastProvider;
