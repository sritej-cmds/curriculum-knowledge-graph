import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { Card, SectionHeading, Badge, Button, LoadingState, ErrorState, EmptyState } from "../components/ui";
import { AddTopicPrerequisiteModal } from "../components/AddTopicPrerequisiteModal";
import { getTopicPrerequisites, getTopicPrerequisiteChain, getTopicDownstream } from "../api/curriculum";
import { useApi } from "../hooks/useApi";
import { normalizeTopicList } from "../lib/normalize";
import { ArrowLeft, ArrowRight, Plus, Info } from "lucide-react";

function TopicChip({ topic, onOpen, tone = "neutral" }) {
  return (
    <button
      onClick={() => onOpen(topic.id)}
      disabled={!topic.id}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left hover:border-accent hover:bg-accent-soft transition-colors disabled:opacity-60 disabled:cursor-default w-full"
    >
      <div className="w-2 h-2 rounded-full bg-accent flex-none" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink font-medium truncate">{topic.name || topic.id || "Unnamed topic"}</p>
        {topic.id && <p className="text-xs text-ink-faint font-mono">{topic.id}</p>}
      </div>
    </button>
  );
}

function TopicColumn({ title, description, state, emptyLabel, onOpen }) {
  return (
    <Card className="p-4 flex-1 min-w-0">
      <p className="text-sm font-semibold text-ink mb-0.5">{title}</p>
      <p className="text-xs text-ink-faint mb-3">{description}</p>
      {state.status === "loading" && <LoadingState label="Loading…" />}
      {state.status === "error" && !state.notAvailable && (
        <ErrorState message={state.error} onRetry={state.refetch} />
      )}
      {state.notAvailable && (
        <p className="text-xs text-warning bg-warning-soft border border-warning/20 rounded-lg px-2.5 py-2">
          Needs backend endpoint: {state.notAvailable}
        </p>
      )}
      {state.status === "success" && (
        <div className="flex flex-col gap-1.5">
          {normalizeTopicList(state.data).length === 0 && (
            <p className="text-sm text-ink-faint py-3 text-center">{emptyLabel}</p>
          )}
          {normalizeTopicList(state.data).map((t, i) => (
            <TopicChip key={t.id || i} topic={t} onOpen={onOpen} />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function TopicDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [prereqOpen, setPrereqOpen] = useState(false);

  const prereqs = useApi(() => getTopicPrerequisites(topicId), [topicId]);
  const chain = useApi(() => getTopicPrerequisiteChain(topicId), [topicId]);
  const downstream = useApi(() => getTopicDownstream(topicId), [topicId]);

  const chainList = chain.status === "success" ? normalizeTopicList(chain.data) : [];

  function openTopic(id) {
    if (id) navigate(`/topics/${encodeURIComponent(id)}`);
  }

  return (
    <div>
      <Topbar
        title={topicId}
        subtitle="Topic detail"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/topics")}>
            <ArrowLeft size={14} /> Topics
          </Button>
        }
      />

      <div className="p-6 max-w-[1100px] mx-auto flex flex-col gap-6">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Badge tone="accent">{topicId}</Badge>
              <p className="text-xs text-ink-faint mt-2.5 max-w-md flex items-start gap-1.5">
                <Info size={13} className="mt-0.5 flex-none" />
                Name, unit, and description aren't returned by the prerequisite/chain/downstream
                endpoints. A <code className="font-mono">GET /topics/&#123;topic_id&#125;</code>{" "}
                endpoint would let this page show them directly.
              </p>
            </div>
            <Button onClick={() => setPrereqOpen(true)}>
              <Plus size={14} /> Add prerequisite
            </Button>
          </div>
        </Card>

        {/* Prerequisite explorer — the signature "thread" visualization,
            reused from the curriculum tree and the graph page. */}
        <Card className="p-5">
          <SectionHeading
            eyebrow="Foundation → this topic → downstream"
            title="Prerequisite chain"
            description="From GET /topics/{id}/prerequisite-chain."
          />
          {chain.status === "loading" && <LoadingState label="Tracing the chain…" />}
          {chain.status === "error" && !chain.notAvailable && (
            <ErrorState message={chain.error} onRetry={chain.refetch} />
          )}
          {chain.notAvailable && (
            <p className="text-xs text-warning bg-warning-soft border border-warning/20 rounded-lg px-2.5 py-2">
              Needs backend endpoint: {chain.notAvailable}
            </p>
          )}
          {chain.status === "success" && (
            <div className="thread-line pl-8 py-1">
              {chainList.length === 0 ? (
                <div className="relative flex items-center gap-3 py-1.5">
                  <div className="thread-node absolute -left-8" />
                  <p className="text-sm text-ink-faint">No prerequisite chain returned — this topic may have no prerequisites.</p>
                </div>
              ) : (
                chainList.map((t, i) => (
                  <div key={t.id || i} className="relative flex items-center gap-3 py-1.5">
                    <div className="thread-node absolute -left-8" />
                    <button
                      onClick={() => openTopic(t.id)}
                      disabled={!t.id}
                      className="text-sm text-ink hover:text-accent font-medium disabled:cursor-default text-left"
                    >
                      {t.name || t.id}
                    </button>
                    {t.id && <span className="text-xs text-ink-faint font-mono">{t.id}</span>}
                  </div>
                ))
              )}
              <div className="relative flex items-center gap-3 py-1.5">
                <div className="thread-node absolute -left-8 border-4" />
                <span className="text-sm font-semibold text-ink">{topicId}</span>
                <Badge tone="accent">selected</Badge>
              </div>
            </div>
          )}
        </Card>

        {/* Direct prerequisites + downstream, side by side */}
        <div className="flex flex-col md:flex-row gap-6">
          <TopicColumn
            title="Direct prerequisites"
            description="GET /topics/{id}/prerequisites"
            state={prereqs}
            emptyLabel="No direct prerequisites."
            onOpen={openTopic}
          />
          <div className="hidden md:flex items-center justify-center px-1">
            <ArrowRight size={16} className="text-ink-faint" />
          </div>
          <TopicColumn
            title="Downstream topics"
            description="GET /topics/{id}/downstream"
            state={downstream}
            emptyLabel="No topics depend on this one yet."
            onOpen={openTopic}
          />
        </div>
      </div>

      <AddTopicPrerequisiteModal
        open={prereqOpen}
        onClose={() => setPrereqOpen(false)}
        defaultTargetId={topicId}
        onCreated={() => {
          prereqs.refetch();
          chain.refetch();
        }}
      />
    </div>
  );
}
