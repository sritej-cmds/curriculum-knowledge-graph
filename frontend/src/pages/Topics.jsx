import { useState } from "react";
import { Topbar } from "../components/Topbar";
import { Card, SectionHeading, EndpointNeededState, Button } from "../components/ui";
import { TopicLookup } from "../components/TopicLookup";
import { AddTopicModal } from "../components/AddTopicModal";
import { listTopicsForCourse } from "../api/curriculum";
import { useApi } from "../hooks/useApi";
import { Plus } from "lucide-react";

export default function Topics() {
  const [addOpen, setAddOpen] = useState(false);
  // Calling with no course filter to surface the "not available" state
  // in a way that documents what's missing, without pretending a course
  // was selected.
  const topics = useApi(() => listTopicsForCourse("(any course)"), []);

  return (
    <div>
      <Topbar
        title="Topics"
        subtitle="Every topic across the curriculum"
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add topic
          </Button>
        }
      />

      <div className="p-6 max-w-[1200px] mx-auto flex flex-col gap-6">
        <Card className="p-5">
          <SectionHeading
            title="All topics"
            description="A searchable, filterable table of every topic — ID, name, unit, and course."
          />
          {topics.notAvailable && (
            <EndpointNeededState
              endpointDescription="GET /topics (or GET /courses/{course_code}/topics) — list topics"
              onRetry={topics.refetch}
            />
          )}
        </Card>

        <Card className="p-5">
          <SectionHeading
            title="Open a topic directly"
            description="Enter a known topic ID to view its full detail — prerequisites, chain, and downstream topics."
          />
          <TopicLookup />
        </Card>
      </div>

      <AddTopicModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
