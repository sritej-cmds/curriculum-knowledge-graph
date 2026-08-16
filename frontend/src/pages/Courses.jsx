import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { Card, SectionHeading, EndpointNeededState, Button } from "../components/ui";
import { Field, TextInput } from "../components/Field";
import { AddCoursePrerequisiteModal } from "../components/AddCoursePrerequisiteModal";
import { listCourses } from "../api/curriculum";
import { useApi } from "../hooks/useApi";
import { Plus, ArrowRight } from "lucide-react";

export default function Courses() {
  const [prereqOpen, setPrereqOpen] = useState(false);
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const courses = useApi(listCourses, []);

  function openCourse(e) {
    e.preventDefault();
    if (code.trim()) navigate(`/courses/${encodeURIComponent(code.trim())}`);
  }

  return (
    <div>
      <Topbar
        title="Courses"
        subtitle="Browse and manage course-level prerequisites"
        actions={
          <Button size="sm" onClick={() => setPrereqOpen(true)}>
            <Plus size={14} /> Add course prerequisite
          </Button>
        }
      />

      <div className="p-6 max-w-[1200px] mx-auto flex flex-col gap-6">
        <Card className="p-5">
          <SectionHeading
            title="All courses"
            description="Course cards grouped by semester, with prerequisites and topic counts."
          />
          {courses.notAvailable && (
            <EndpointNeededState endpointDescription={courses.notAvailable} onRetry={courses.refetch} />
          )}
        </Card>

        <Card className="p-5">
          <SectionHeading
            title="Open a course directly"
            description="Enter a known course code to view its detail page."
          />
          <form onSubmit={openCourse} className="flex items-end gap-2 max-w-md">
            <div className="flex-1">
              <Field label="Course code">
                <TextInput
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="UE25CS151A"
                  className="font-mono"
                />
              </Field>
            </div>
            <Button type="submit" variant="secondary">
              Open <ArrowRight size={14} />
            </Button>
          </form>
        </Card>
      </div>

      <AddCoursePrerequisiteModal open={prereqOpen} onClose={() => setPrereqOpen(false)} />
    </div>
  );
}
