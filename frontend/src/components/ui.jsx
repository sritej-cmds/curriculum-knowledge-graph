import { AlertTriangle, Inbox, Loader2, PlugZap, RotateCw } from "lucide-react";

export function Card({ className = "", children, as: As = "div", ...rest }) {
  return (
    <As
      className={`bg-surface border border-border rounded-xl ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}

export function Button({ variant = "primary", size = "md", className = "", children, ...rest }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-[15px]",
  };
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover",
    secondary: "bg-surface border border-border text-ink hover:bg-surface-alt hover:border-border-strong",
    ghost: "text-ink-soft hover:bg-surface-alt hover:text-ink",
    danger: "bg-danger text-white hover:opacity-90",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Badge({ tone = "neutral", className = "", children }) {
  const tones = {
    neutral: "bg-surface-alt text-ink-soft border-border",
    accent: "bg-accent-soft text-accent border-accent-ring",
    success: "bg-success-soft text-success border-success/20",
    danger: "bg-danger-soft text-danger border-danger/20",
    warning: "bg-warning-soft text-warning border-warning/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium font-mono ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        {eyebrow && (
          <div className="text-xs font-medium tracking-wide uppercase text-ink-faint mb-1">{eyebrow}</div>
        )}
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="text-sm text-ink-soft mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-faint">
      <Loader2 className="animate-spin" size={22} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="w-11 h-11 rounded-full bg-surface-alt border border-border flex items-center justify-center text-ink-faint">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="text-sm text-ink-soft mt-1 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="w-11 h-11 rounded-full bg-danger-soft border border-danger/20 flex items-center justify-center text-danger">
        <AlertTriangle size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Couldn't load this</p>
        {message && <p className="text-sm text-ink-soft mt-1 max-w-sm">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCw size={14} /> Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Shown whenever a page needs a backend endpoint that doesn't exist
 * yet. Deliberately distinct from ErrorState — this isn't a failure,
 * it's a documented gap the backend team can close.
 */
export function EndpointNeededState({ endpointDescription, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <div className="w-11 h-11 rounded-full bg-warning-soft border border-warning/20 flex items-center justify-center text-warning">
        <PlugZap size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">Backend endpoint needed</p>
        <p className="text-sm text-ink-soft mt-1 max-w-md">
          This view needs a read endpoint the backend doesn't expose yet:
        </p>
        <code className="inline-block mt-2 text-xs bg-surface-alt border border-border rounded-md px-2 py-1 text-ink-soft">
          {endpointDescription}
        </code>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCw size={14} /> Check again
        </Button>
      )}
    </div>
  );
}
