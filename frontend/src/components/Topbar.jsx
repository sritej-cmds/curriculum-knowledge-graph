import { Search, Circle } from "lucide-react";
import { useHealth } from "../hooks/useHealth";

export function Topbar({ title, subtitle, search, onSearchChange, searchPlaceholder = "Search…", actions }) {
  const { status } = useHealth();

  return (
    <header className="h-16 flex-none border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10 flex items-center gap-4 px-6">
      <div className="min-w-0 flex-none">
        <h1 className="font-display text-[17px] font-semibold text-ink leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-ink-faint truncate">{subtitle}</p>}
      </div>

      {onSearchChange && (
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 rounded-lg border border-border bg-surface-alt pl-9 pr-3 text-sm placeholder:text-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring focus:bg-surface transition-colors"
            />
          </div>
        </div>
      )}

      <div className="flex-1" />

      {actions}

      <div
        className="hidden sm:flex items-center gap-1.5 text-xs text-ink-soft border border-border rounded-full pl-2 pr-2.5 h-7"
        title={status === "online" ? "Connected to FastAPI backend" : "Backend unreachable"}
      >
        <Circle
          size={7}
          className={
            status === "online"
              ? "fill-success text-success"
              : status === "offline"
              ? "fill-danger text-danger"
              : "fill-warning text-warning"
          }
        />
        {status === "online" ? "Online" : status === "offline" ? "Offline" : "Checking"}
      </div>

      <div className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-semibold flex-none">
        FA
      </div>
    </header>
  );
}
