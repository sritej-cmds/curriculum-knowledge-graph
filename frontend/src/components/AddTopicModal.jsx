import { useState } from "react";
import { Modal } from "./Modal";
import { Field, TextInput, TextArea } from "./Field";
import { Button } from "./ui";
import { createTopic } from "../api/curriculum";
import { useToast } from "./Toast";
import { logActivity } from "../lib/activityLog";
import { ApiError } from "../api/client";
import { Loader2, Sparkles } from "lucide-react";

const emptyForm = { course_code: "", name: "", unit: "", description: "" };

export function AddTopicModal({ open, onClose, defaultCourseCode = "", onCreated }) {
  const [form, setForm] = useState({ ...emptyForm, course_code: defaultCourseCode });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [createdId, setCreatedId] = useState(null);
  const toast = useToast();

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const e = {};
    if (!form.course_code.trim()) e.course_code = "Course code is required.";
    if (!form.name.trim()) e.name = "Topic name is required.";
    if (form.unit !== "" && (isNaN(Number(form.unit)) || Number(form.unit) < 1)) {
      e.unit = "Unit must be a positive number.";
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
      const result = await createTopic({
        course_code: form.course_code.trim(),
        name: form.name.trim(),
        unit: form.unit === "" ? undefined : Number(form.unit),
        description: form.description.trim(),
      });
      const newId = result?.topic_id || result?.id || null;
      setCreatedId(newId);
      logActivity({
        type: "topic_created",
        label: `Added topic "${form.name.trim()}"`,
        detail: newId ? `ID ${newId}` : form.course_code,
      });
      toast.success(
        "Topic added",
        newId ? `Assigned ID ${newId}` : "The topic was created."
      );
      onCreated?.(result);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't create the topic. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setForm({ ...emptyForm, course_code: defaultCourseCode });
    setErrors({});
    setFormError(null);
    setCreatedId(null);
    onClose();
  }

  if (createdId) {
    return (
      <Modal open={open} onClose={handleClose} title="Topic added" width="420px">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-11 h-11 rounded-full bg-success-soft border border-success/20 flex items-center justify-center text-success">
            <Sparkles size={20} />
          </div>
          <p className="text-sm text-ink-soft">
            The backend generated an ID for this topic:
          </p>
          <code className="text-base font-semibold text-ink bg-surface-alt border border-border rounded-lg px-3 py-1.5">
            {createdId}
          </code>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" onClick={() => setCreatedId(null)}>
            Add another
          </Button>
          <Button onClick={handleClose}>Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add topic" description="The backend assigns the topic ID automatically.">
      <form onSubmit={handleSubmit}>
        <Field label="Course code" required error={errors.course_code} hint="e.g. UE25CS151A">
          <TextInput
            value={form.course_code}
            onChange={(e) => set("course_code", e.target.value)}
            placeholder="UE25CS151A"
            autoFocus={!defaultCourseCode}
          />
        </Field>
        <Field label="Topic name" required error={errors.name}>
          <TextInput
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Decorators"
            autoFocus={!!defaultCourseCode}
          />
        </Field>
        <Field label="Unit" error={errors.unit} hint="Which unit this topic belongs to">
          <TextInput
            type="number"
            min="1"
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="4"
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description of what this topic covers…"
          />
        </Field>

        {formError && (
          <p className="text-sm text-danger bg-danger-soft border border-danger/20 rounded-lg px-3 py-2 mt-2">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Adding…" : "Add topic"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
