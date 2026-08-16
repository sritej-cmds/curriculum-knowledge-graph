import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Topbar } from "../components/Topbar";
import { Button, EmptyState } from "../components/ui";
import { TextInput } from "../components/Field";
import { TopicNode } from "../components/graph/TopicNode";
import {
  getTopic,
  getTopicPrerequisites,
  getTopicDownstream,
} from "../api/curriculum";
import { normalizeTopic, normalizeTopicList } from "../lib/normalize";
import { useToast } from "../components/Toast";
import { ApiError } from "../api/client";
import { Network, RotateCcw, ExternalLink, Loader2 } from "lucide-react";

const nodeTypes = { topic: TopicNode };

function layout(nodesById) {
  const byLayer = new Map();
  for (const n of Object.values(nodesById)) {
    if (!byLayer.has(n.layer)) byLayer.set(n.layer, []);
    byLayer.get(n.layer).push(n);
  }
  const layers = [...byLayer.keys()].sort((a, b) => a - b);
  const positioned = [];
  for (const layer of layers) {
    const row = byLayer.get(layer).sort((a, b) => a.id.localeCompare(b.id));
    row.forEach((n, i) => {
      positioned.push({
        ...n,
        x: i * 210 - ((row.length - 1) * 210) / 2,
        y: layer * 130,
      });
    });
  }
  return positioned;
}

function GraphInner() {
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [selected, setSelected] = useState(null);
  const nodesById = useRef({}); // id -> { id, name, layer }
  const edgeSet = useRef(new Set()); // "source->target"
  const expanded = useRef(new Set());

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const render = useCallback(() => {
    const positioned = layout(nodesById.current);
    setNodes(
      positioned.map((n) => ({
        id: n.id,
        type: "topic",
        position: { x: n.x, y: n.y },
        data: {
          id: n.id,
          name: n.name,
          loading: n.loading,
          state: selected
            ? n.id === selected
              ? "selected"
              : edgeSet.current.has(`${selected}->${n.id}`) || edgeSet.current.has(`${n.id}->${selected}`)
              ? "connected"
              : "dim"
            : "default",
        },
      }))
    );
    setEdges(
      [...edgeSet.current].map((key) => {
        const [source, target] = key.split("->");
        const isConnected = selected && (source === selected || target === selected);
        return {
          id: key,
          source,
          target,
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#4338CA", width: 16, height: 16 },
          style: {
            stroke: "#4338CA",
            strokeWidth: isConnected ? 2 : 1,
            opacity: selected ? (isConnected ? 1 : 0.25) : 0.7,
          },
        };
      })
    );
  }, [selected, setEdges, setNodes]);

  function addNode(id, name, layerHint) {
    if (!id) return;
    if (!nodesById.current[id]) {
      nodesById.current[id] = { id, name: name || null, layer: layerHint ?? 0 };
    } else if (name && !nodesById.current[id].name) {
      nodesById.current[id].name = name;
    }
  }

  function addEdge(prereqId, targetId) {
    if (!prereqId || !targetId) return;
    edgeSet.current.add(`${prereqId}->${targetId}`);
  }

  async function expandNode(id) {
    if (expanded.current.has(id)) return;
    expanded.current.add(id);
    const centerLayer = nodesById.current[id]?.layer ?? 0;

    nodesById.current[id] = { ...nodesById.current[id], loading: true };
    render();

    try {
      const [prereqRes, downstreamRes] = await Promise.allSettled([
        getTopicPrerequisites(id),
        getTopicDownstream(id),
      ]);

      if (prereqRes.status === "fulfilled") {
        for (const t of normalizeTopicList(prereqRes.value)) {
          if (!t.id) continue;
          addNode(t.id, t.name, centerLayer - 1);
          addEdge(t.id, id);
        }
      }
      if (downstreamRes.status === "fulfilled") {
        for (const t of normalizeTopicList(downstreamRes.value)) {
          if (!t.id) continue;
          addNode(t.id, t.name, centerLayer + 1);
          addEdge(id, t.id);
        }
      }
      if (prereqRes.status === "rejected" && downstreamRes.status === "rejected") {
        toast.error("Couldn't expand this topic", "Both prerequisite and downstream lookups failed.");
      }
    } finally {
      if (nodesById.current[id]) nodesById.current[id].loading = false;
      render();
    }
  }

  async function handleSearch(e) {
  e.preventDefault();
  const id = query.trim();
  if (!id) return;

  setLoadingRoot(true);
  nodesById.current = {};
  edgeSet.current = new Set();
  expanded.current = new Set();

  try {
    const topic = await getTopic(id);
    const normalized = normalizeTopic(topic);

    addNode(id, normalized.name, 0);
    setSelected(id);

    await expandNode(id);
  } catch (err) {
    toast.error(
      "Couldn't load that topic",
      err instanceof ApiError ? err.message : undefined
    );
  } finally {
    setLoadingRoot(false);
  }
}
  function handleReset() {
    nodesById.current = {};
    edgeSet.current = new Set();
    expanded.current = new Set();
    setSelected(null);
    setQuery("");
    setNodes([]);
    setEdges([]);
  }

  function onNodeClick(_, node) {
    setSelected(node.id);
    expandNode(node.id);
  }

  const hasGraph = Object.keys(nodesById.current).length > 0;

  useMemo(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <div className="flex flex-col h-svh">
      <Topbar
        title="Knowledge graph"
        subtitle="Explore topic prerequisite relationships"
        actions={
          <div className="flex items-center gap-2">
            {selected && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/topics/${encodeURIComponent(selected)}`)}
              >
                <ExternalLink size={13} /> Open {selected}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw size={13} /> Reset
            </Button>
          </div>
        }
      />

      <div className="px-6 py-3 border-b border-border bg-surface flex-none">
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a topic ID to start exploring, e.g. PY_027"
            className="font-mono"
          />
          <Button type="submit" disabled={loadingRoot}>
            {loadingRoot ? <Loader2 size={14} className="animate-spin" /> : <Network size={14} />}
            Explore
          </Button>
        </form>
        <p className="text-xs text-ink-faint mt-2">
          Click a node to expand its prerequisites and downstream topics and highlight its connections.
          Built from GET /topics/&#123;id&#125;/prerequisites and GET /topics/&#123;id&#125;/downstream —
          there's no bulk graph endpoint yet, so the graph grows as you explore.
        </p>
      </div>

      <div className="flex-1 relative xy-flow-scope">
        {!hasGraph ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={Network}
              title="Start exploring"
              description="Enter a topic ID above to build the graph outward from that topic."
            />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#D0D5DD" gap={20} />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor="#C7CCF7"
              maskColor="rgba(246,247,249,0.6)"
              style={{ border: "1px solid #E3E6EB" }}
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

export default function KnowledgeGraph() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  );
}
