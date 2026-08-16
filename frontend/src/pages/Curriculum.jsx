import { useState } from "react";
import { Topbar } from "../components/Topbar";
import { Card, SectionHeading, EndpointNeededState, Button } from "../components/ui";
import { TopicLookup } from "../components/TopicLookup";
import { AddTopicModal } from "../components/AddTopicModal";
import { listSemesters } from "../api/curriculum";
import { useApi } from "../hooks/useApi";
import { Plus } from "lucide-react";

export default function Curriculum() {
  const [addOpen, setAddOpen] = useState(false);
  const semesters = useApi(listSemesters, []);

  return (
    <div>
      <Topbar
        title="Curriculum"
        subtitle="Semester → Course → Topic hierarchy"
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add topic
          </Button>
        }
      />

      <div className="p-6 max-w-[1200px] mx-auto flex flex-col gap-6">
        <Card className="p-5">
          <SectionHeading
            eyebrow="Semester → Course → Topic"
            title="Full curriculum tree"
            description="This view renders every semester, its courses, and their topics as an expandable tree."
          />
          {semesters.notAvailable && (
            <EndpointNeededState endpointDescription={semesters.notAvailable} onRetry={semesters.refetch} />
          )}
        </Card>

        <Card className="p-5">
          <SectionHeading
            title="Look up a topic directly"
            description="While the hierarchy endpoint is pending, you can still open any topic by its ID."
          />
          <TopicLookup />
        </Card>
      </div>

      <AddTopicModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
