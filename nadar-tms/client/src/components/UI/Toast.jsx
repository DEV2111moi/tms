import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);

  const toast = useCallback((text) => {
    setMsg(text);
    setShow(true);
    setTimeout(() => setShow(false), 2000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {show && (
        <div className="toast-container">
          <div className="toast">{msg}</div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
