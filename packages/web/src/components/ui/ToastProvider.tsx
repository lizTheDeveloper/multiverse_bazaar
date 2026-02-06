import React, { useState, useCallback, ReactNode } from 'react';
import { ToastContext, Toast, ToastOptions } from '@/hooks/useToast';
import { ToastContainer } from './Toast';

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

let toastId = 0;

const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    toastId += 1;
    return `toast-${toastId}-${Date.now()}`;
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = generateId();
      const newToast: Toast = {
        id,
        message,
        variant: options?.variant || 'info',
        title: options?.title,
        duration: options?.duration ?? 5000,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Limit number of toasts
        return updated.slice(-maxToasts);
      });

      return id;
    },
    [generateId, maxToasts]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) => {
      return toast(message, { variant: 'success', title, duration });
    },
    [toast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) => {
      return toast(message, { variant: 'error', title, duration });
    },
    [toast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => {
      return toast(message, { variant: 'info', title, duration });
    },
    [toast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) => {
      return toast(message, { variant: 'warning', title, duration });
    },
    [toast]
  );

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    toast,
    success,
    error,
    info,
    warning,
    remove,
    clear,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
