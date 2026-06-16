'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type ToastKind = 'success' | 'danger' | 'info' | 'warning';
interface Toast { id: number; kind: ToastKind; message: string }
const ToastCtx = createContext<(kind: ToastKind, message: string) => void>(() => undefined);
export const useToast = (): ((kind: ToastKind, message: string) => void) => useContext(ToastCtx);

const ACCENT: Record<ToastKind, string> = {
  success: 'border-l-success-600', danger: 'border-l-danger-600',
  info: 'border-l-primary-600', warning: 'border-l-warning-600',
};

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'danger' ? 8000 : 5000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed inset-x-4 bottom-20 z-50 flex flex-col gap-2 md:inset-x-auto md:bottom-auto md:right-6 md:top-6 md:w-96">
        {toasts.map((t) => (
          <div key={t.id} className={`card border-l-4 ${ACCENT[t.kind]} rounded-l-none p-3 text-body-sm shadow-e2`} role="status">
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
