import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, tone: "success", ...toast }]);
      setTimeout(() => dismiss(id), toast.duration ?? 5000);
    },
    [dismiss]
  );

  const api = {
    success: (title, description) => push({ tone: "success", title, description }),
    error: (title, description) => push({ tone: "error", title, description }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-[340px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-surface border border-border rounded-lg shadow-sm p-3.5 flex items-start gap-3 animate-in"
          >
            {t.tone === "success" ? (
              <CheckCircle2 size={18} className="text-success mt-0.5 flex-none" />
            ) : (
              <XCircle size={18} className="text-danger mt-0.5 flex-none" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.description && <p className="text-xs text-ink-soft mt-0.5">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-ink-faint hover:text-ink-soft flex-none"
              aria-label="Dismiss"
            >
              <X size={14} />
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
