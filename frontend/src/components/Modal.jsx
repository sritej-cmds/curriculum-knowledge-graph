import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, description, children, width = "480px" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-surface border border-border rounded-xl shadow-lg w-full mt-16 sm:mt-0 animate-in"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <h3 id="modal-title" className="font-display text-base font-semibold text-ink">
              {title}
            </h3>
            {description && <p className="text-sm text-ink-soft mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-faint hover:text-ink hover:bg-surface-alt rounded-md p-1 flex-none"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
