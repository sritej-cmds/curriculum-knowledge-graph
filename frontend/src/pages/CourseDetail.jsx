import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { Card, SectionHeading, EndpointNeededState, Button, Badge } from "../components/ui";
import { AddCoursePrerequisiteModal } from "../components/AddCoursePrerequisiteModal";
import { AddTopicModal } from "../components/AddTopicModal";
import { getCourse } from "../api/curriculum";
import { useApi } from "../hooks/useApi";
import { ArrowLeft, Plus } from "lucide-react";

export default function CourseDetail() {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  const [prereqOpen, setPrereqOpen] = useState(false);
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const course = useApi(() => getCourse(courseCode), [courseCode]);

  return (
    <div>
      <Topbar
        title={courseCode}
        subtitle="Course detail"
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate("/courses")}>
            <ArrowLeft size={14} /> Courses
          </Button>
        }
      />

      <div className="p-6 max-w-[1000px] mx-auto flex flex-col gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Badge tone="accent">{courseCode}</Badge>
          </div>
          <SectionHeading
            title="Course overview"
            description="Name, semester, topics, and prerequisites for this course."
          />
          {course.notAvailable && (
            <EndpointNeededState endpointDescription={course.notAvailable} onRetry={course.refetch} />
          )}
        </Card>

        <Card className="p-5">
          <SectionHeading
            title="Actions"
            description="These actions call the real backend even while course detail is pending."
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setAddTopicOpen(true)}>
              <Plus size={14} /> Add topic to this course
            </Button>
            <Button variant="secondary" onClick={() => setPrereqOpen(true)}>
              <Plus size={14} /> Add course prerequisite
            </Button>
          </div>
        </Card>
      </div>

      <AddTopicModal open={addTopicOpen} onClose={() => setAddTopicOpen(false)} defaultCourseCode={courseCode} />
      <AddCoursePrerequisiteModal
        open={prereqOpen}
        onClose={() => setPrereqOpen(false)}
        defaultTargetCode={courseCode}
      />
    </div>
  );
}
