import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Network,
  BookOpen,
  ListTree,
  GitBranch,
  Waypoints,
  Circle,
  Settings,
} from "lucide-react";
import { useHealth } from "../hooks/useHealth";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/curriculum", label: "Curriculum", icon: ListTree },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/topics", label: "Topics", icon: GitBranch },
  { to: "/prerequisites", label: "Prerequisites", icon: Waypoints },
  { to: "/graph", label: "Knowledge Graph", icon: Network },
];

export function Sidebar() {
  const { status } = useHealth();

  return (
    <aside className="w-[248px] flex-none border-r border-border bg-surface flex flex-col h-svh sticky top-0">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border flex-none">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-none">
          <Waypoints size={16} className="text-white" strokeWidth={2.25} />
        </div>
        <span className="font-display font-semibold text-[15px] text-ink">Curricula</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-ink-soft hover:bg-surface-alt hover:text-ink"
              }`
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-none border-t border-border p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg text-xs text-ink-soft">
          <Circle
            size={8}
            className={
              status === "online"
                ? "fill-success text-success"
                : status === "offline"
                ? "fill-danger text-danger"
                : "fill-warning text-warning"
            }
          />
          {status === "online" && "API connected"}
          {status === "offline" && "API unreachable"}
          {status === "checking" && "Checking API…"}
        </div>

        <button className="flex items-center gap-2.5 h-11 px-2.5 rounded-lg hover:bg-surface-alt text-left transition-colors">
          <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xs font-semibold flex-none">
            FA
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">Faculty account</p>
            <p className="text-xs text-ink-faint truncate">Manage profile</p>
          </div>
          <Settings size={14} className="text-ink-faint flex-none" />
        </button>
      </div>
    </aside>
  );
}
