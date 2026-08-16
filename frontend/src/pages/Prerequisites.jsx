import { useState } from "react";
import { Topbar } from "../components/Topbar";
import { Card, SectionHeading, Button } from "../components/ui";
import { Field, TextInput } from "../components/Field";
import { createTopicPrerequisite, createCoursePrerequisite } from "../api/curriculum";
import { useToast } from "../components/Toast";
import { logActivity } from "../lib/activityLog";
import { ApiError } from "../api/client";
import { ArrowDown, Loader2, Waypoints, BookOpen } from "lucide-react";

function InlinePrereqForm({ kind, onSubmitted }) {
  const isTopic = kind === "topic";
  const [prereq, setPrereq] = useState("");
  const [target, setTarget] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  function validate() {
    const e = {};
    if (!prereq.trim()) e.prereq = "Required.";
    if (!target.trim()) e.target = "Required.";
    if (prereq.trim() && target.trim() && prereq.trim().toLowerCase() === target.trim().toLowerCase()) {
      e.target = isTopic ? "A topic can't be its own prerequisite." : "A course can't be its own prerequisite.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isTopic) {
        await createTopicPrerequisite({ prerequisite_topic_id: prereq.trim(), target_topic_id: target.trim() });
      } else {
        await createCoursePrerequisite({ prerequisite_course_code: prereq.trim(), target_course_code: target.trim() });
      }
      logActivity({
        type: isTopic ? "topic_prerequisite_created" : "course_prerequisite_created",
        label: `Linked ${prereq.trim()} → ${target.trim()}`,
        detail: isTopic ? "Topic prerequisite" : "Course prerequisite",
      });
      toast.success("Prerequisite added", `${prereq.trim()} is now a prerequisite of ${target.trim()}.`);
      setPrereq("");
      setTarget("");
      onSubmitted?.();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't create this prerequisite. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm">
      <Field
        label={isTopic ? "Prerequisite topic" : "Prerequisite course"}
        required
        error={errors.prereq}
        hint={isTopic ? "Topic ID, e.g. PY_001" : "Course code"}
      >
        <TextInput
          value={prereq}
          onChange={(e) => setPrereq(e.target.value)}
          placeholder={isTopic ? "PY_001" : "UE25CS151A"}
          className="font-mono"
        />
      </Field>
      <div className="flex justify-center py-1">
        <ArrowDown size={16} className="text-ink-faint" />
      </div>
      <Field
        label={isTopic ? "Target topic" : "Target course"}
        required
        error={errors.target}
        hint={isTopic ? "Topic ID, e.g. PY_027" : "Course code"}
      >
        <TextInput
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder={isTopic ? "PY_027" : "UE25CS251A"}
          className="font-mono"
        />
      </Field>

      {formError && (
        <p className="text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2 mt-2">
          {formError}
        </p>
      )}

      <Button type="submit" className="mt-4 w-full" disabled={submitting}>
        {submitting && <Loader2 size={14} className="animate-spin" />}
        {submitting ? "Adding…" : `Add ${isTopic ? "topic" : "course"} prerequisite`}
      </Button>
    </form>
  );
}

export default function Prerequisites() {
  const [tab, setTab] = useState("topic");

  return (
    <div>
      <Topbar title="Prerequisites" subtitle="Link topics and courses in prerequisite order" />

      <div className="p-6 max-w-[720px] mx-auto flex flex-col gap-6">
        <Card className="p-1.5 flex gap-1">
          <button
            onClick={() => setTab("topic")}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-colors ${
              tab === "topic" ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface-alt"
            }`}
          >
            <Waypoints size={15} /> Topic prerequisites
          </button>
          <button
            onClick={() => setTab("course")}
            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-colors ${
              tab === "course" ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface-alt"
            }`}
          >
            <BookOpen size={15} /> Course prerequisites
          </button>
        </Card>

        <Card className="p-5">
          <SectionHeading
            title={tab === "topic" ? "Add a topic prerequisite" : "Add a course prerequisite"}
            description={
              tab === "topic"
                ? "The prerequisite topic must be completed before the target topic."
                : "The prerequisite course must be completed before the target course."
            }
          />
          <InlinePrereqForm kind={tab} />
        </Card>

        <Card className="p-5 bg-surface-alt border-dashed">
          <p className="text-xs text-ink-soft leading-relaxed">
            The backend validates for missing IDs, self-prerequisites, duplicates, and cycles — any
            of those come back here as a plain-language message instead of a raw error.
          </p>
        </Card>
      </div>
    </div>
  );
}
