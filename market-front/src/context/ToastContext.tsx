"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  remove: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, show, remove }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="region" aria-label="알림">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg ${
              t.type === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : t.type === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-[var(--market-border)] bg-[var(--market-surface)] text-[var(--market-text)]"
            }`}
          >
            <span className="text-sm">{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="ml-2 text-[var(--market-text-muted)] hover:text-[var(--market-text)]"
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
