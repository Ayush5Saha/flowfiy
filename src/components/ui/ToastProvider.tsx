"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Toast item ────────────────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-card border-green-500/30",
    icon: <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />,
  },
  error: {
    bg: "bg-card border-destructive/40",
    icon: <XCircle className="w-4 h-4 text-destructive shrink-0" />,
  },
  info: {
    bg: "bg-card border-border",
    icon: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const { bg, icon } = TOAST_STYLES[toast.type];

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg
        text-sm max-w-xs min-w-[240px] transition-all duration-300
        ${bg}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      {icon}
      <span className="flex-1 text-foreground">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-0.5 text-muted-foreground hover:text-foreground transition-colors rounded"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
