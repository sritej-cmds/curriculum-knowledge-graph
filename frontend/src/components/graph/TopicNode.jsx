import { Handle, Position } from "@xyflow/react";
import { Loader2 } from "lucide-react";

export function TopicNode({ data }) {
  const { id, name, state, loading } = data;

  const toneClasses = {
    selected: "border-accent ring-2 ring-accent-ring bg-accent-soft",
    connected: "border-accent-ring bg-surface",
    dim: "border-border bg-surface opacity-50",
    default: "border-border bg-surface",
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2 min-w-[140px] max-w-[190px] shadow-sm cursor-pointer transition-all ${
        toneClasses[state] || toneClasses.default
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-accent !w-1.5 !h-1.5 !border-0" />
      <div className="flex items-center gap-1.5">
        <p className="text-[13px] font-medium text-ink truncate flex-1">{name || id}</p>
        {loading && <Loader2 size={11} className="animate-spin text-accent flex-none" />}
      </div>
      <p className="text-[10px] font-mono text-ink-faint truncate">{id}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-accent !w-1.5 !h-1.5 !border-0" />
    </div>
  );
}
