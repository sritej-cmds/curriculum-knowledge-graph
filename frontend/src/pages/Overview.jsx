import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { Card, SectionHeading, Button, Badge, LoadingState, ErrorState } from "../components/ui";
import { AddTopicModal } from "../components/AddTopicModal";
import { AddTopicPrerequisiteModal } from "../components/AddTopicPrerequisiteModal";
import { AddCoursePrerequisiteModal } from "../components/AddCoursePrerequisiteModal";
import { useApi } from "../hooks/useApi";
import { getTopicCentrality,getOverviewStats } from "../api/curriculum";
import { useActivity } from "../hooks/useActivity";
import {
  Plus,
  Waypoints,
  Layers,
  BookOpen,
  GitBranch,
  ArrowUpRight,
  Network,
  Clock,
} from "lucide-react";

const STAT_DEFS = [
  { key: "semesters", label: "Total semesters", icon: Layers },
  { key: "courses", label: "Total courses", icon: BookOpen },
  { key: "topics", label: "Total topics", icon: GitBranch },
  { key: "relationships", label: "Prerequisite relationships", icon: Waypoints },
];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Overview() {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // "topic" | "topic-prereq" | "course-prereq" | null
  const centrality = useApi(getTopicCentrality, []);
  const stats = useApi(getOverviewStats, []);
  const activity = useActivity();

  const topCentral = Array.isArray(centrality.data?.most_foundational)
  ? centrality.data.most_foundational.slice(0, 5)
  : null;
  return (
    <div>
      <Topbar title="Overview" subtitle="Curriculum knowledge graph at a glance" />

      <div className="p-6 max-w-[1200px] mx-auto flex flex-col gap-6">
        {/* Overview statistics */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {STAT_DEFS.map(({ key, label, icon: Icon }) => (
    <Card key={key} className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
          <Icon size={16} />
        </div>
      </div>

      {stats.status === "loading" && (
        <p className="font-display text-2xl font-semibold text-ink-faint">
          …
        </p>
      )}

      {stats.status === "error" && (
        <p className="font-display text-2xl font-semibold text-red-500">
          —
        </p>
      )}

      {stats.status === "success" && (
        <p className="font-display text-2xl font-semibold text-ink">
          {stats.data?.[key] ?? 0}
        </p>
      )}

      <p className="text-xs text-ink-soft mt-0.5">
        {label}
      </p>

      {stats.status === "error" && (
        <p className="text-[11px] text-red-400 mt-2">
          {stats.error}
        </p>
      )}
    </Card>
  ))}
</div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <Card className="p-5 lg:col-span-1">
            <SectionHeading title="Quick actions" />
            <div className="flex flex-col gap-2">
              <Button variant="secondary" className="justify-start" onClick={() => setModal("topic")}>
                <Plus size={15} /> Add topic
              </Button>
              <Button variant="secondary" className="justify-start" onClick={() => setModal("topic-prereq")}>
                <Plus size={15} /> Add topic prerequisite
              </Button>
              <Button variant="secondary" className="justify-start" onClick={() => setModal("course-prereq")}>
                <Plus size={15} /> Add course prerequisite
              </Button>
              <Button variant="secondary" className="justify-start" onClick={() => navigate("/graph")}>
                <Network size={15} /> Explore knowledge graph
              </Button>
            </div>
          </Card>

          {/* Recent activity — this session only, clearly labeled */}
          <Card className="p-5 lg:col-span-2">
            <SectionHeading
              title="Recent activity"
              description="Changes made in this session. A backend activity log endpoint would extend this to full history."
            />
            {activity.length === 0 ? (
              <p className="text-sm text-ink-faint py-6 text-center">
                Nothing yet — actions you take will show up here.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border -mx-1">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-1 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-accent-soft text-accent flex items-center justify-center flex-none">
                      <GitBranch size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink truncate">{a.label}</p>
                      <p className="text-xs text-ink-faint">{a.detail}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ink-faint flex-none">
                      <Clock size={11} />
                      {timeAgo(a.at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Most connected topics — real data from GET /topics/centrality */}
        <Card className="p-5">
          <SectionHeading
            title="Most connected topics"
            description="From GET /topics/centrality — topics with the most prerequisite relationships."
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate("/graph")}>
                Open graph <ArrowUpRight size={13} />
              </Button>
            }
          />
          {centrality.status === "loading" && <LoadingState label="Loading centrality data…" />}
          {centrality.status === "error" && (
            <ErrorState message={centrality.error} onRetry={centrality.refetch} />
          )}
          {centrality.status === "success" && (!topCentral || topCentral.length === 0) && (
            <p className="text-sm text-ink-faint py-6 text-center">No centrality data returned yet.</p>
          )}
          {centrality.status === "success" && topCentral && topCentral.length > 0 && (
            <ul className="flex flex-col divide-y divide-border">
              {topCentral.map((t, i) => {
                const id = t.topic_id || t.id;
                const name = t.name || t.topic_name;
                const score = t.centrality ?? t.score ?? t.degree;
                return (
                  <li key={id || i} className="flex items-center gap-3 py-2.5">
                    <span className="text-xs text-ink-faint font-mono w-5">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <button
                        className="text-sm text-ink font-medium hover:text-accent truncate block text-left"
                        onClick={() => id && navigate(`/topics/${encodeURIComponent(id)}`)}
                      >
                        {name || id || "Untitled topic"}
                      </button>
                      {id && <Badge tone="neutral">{id}</Badge>}
                    </div>
                    {score !== undefined && (
                      <span className="text-xs text-ink-soft flex-none">score {String(score)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <AddTopicModal open={modal === "topic"} onClose={() => setModal(null)} />
      <AddTopicPrerequisiteModal open={modal === "topic-prereq"} onClose={() => setModal(null)} />
      <AddCoursePrerequisiteModal open={modal === "course-prereq"} onClose={() => setModal(null)} />
    </div>
  );
}
