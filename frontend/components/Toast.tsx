"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (title: string, type?: ToastType, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((title: string, type: ToastType = 'success', message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between p-3.5 rounded-lg border shadow-lg transition-all duration-200 animate-in slide-in-from-bottom-5 ${
              t.type === 'success'
                ? 'bg-slate-900 border-emerald-500 text-white'
                : t.type === 'warning'
                ? 'bg-slate-900 border-amber-500 text-white'
                : t.type === 'error'
                ? 'bg-slate-900 border-red-500 text-white'
                : 'bg-slate-900 border-blue-500 text-white'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />}
              {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />}
              {t.type === 'error' && <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />}
              
              <div>
                <p className="text-xs font-bold leading-tight">{t.title}</p>
                {t.message && <p className="text-[11px] text-slate-300 mt-0.5">{t.message}</p>}
              </div>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white transition-colors p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      toast: (title: string, type: ToastType = 'success', message?: string) => {
        console.log(`[Toast ${type.toUpperCase()}] ${title} ${message || ''}`);
      }
    };
  }
  return context;
}
