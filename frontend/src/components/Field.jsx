export function Field({ label, hint, error, required, children }) {
  return (
    <label className="block mb-4 last:mb-0">
      <span className="text-sm font-medium text-ink flex items-center gap-1">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <span className="text-xs text-ink-faint mt-1 block">{hint}</span>}
      {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
    </label>
  );
}

const inputBase =
  "w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring transition-colors";

export function TextInput({ className = "", ...rest }) {
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function TextArea({ className = "", ...rest }) {
  return <textarea className={`${inputBase} h-auto py-2 min-h-[88px] resize-y ${className}`} {...rest} />;
}

export function Select({ className = "", children, ...rest }) {
  return (
    <select className={`${inputBase} ${className}`} {...rest}>
      {children}
    </select>
  );
}
