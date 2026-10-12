// Toast notification system providing toast.success(msg) and toast.error(msg)
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

// Component to render floating toast notifications
function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(t.id)}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

// Provider component wrapping the app with toast state
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Remove a toast by its unique id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Add a toast and auto-dismiss after 4 seconds
  const addToast = useCallback((type, message) => {
    if (!message) return;
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto remove after 4000ms
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Helper methods for success and error
  const toast = {
    success: useCallback((msg) => addToast('success', msg), [addToast]),
    error: useCallback((msg) => addToast('error', msg), [addToast])
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook for components to access toast.success() and toast.error()
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
