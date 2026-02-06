import { createContext, useContext } from 'react';

export interface ToastOptions {
  variant?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  duration?: number;
}

export interface Toast extends ToastOptions {
  id: string;
  message: string;
}

export interface ToastContextType {
  toasts: Toast[];
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
