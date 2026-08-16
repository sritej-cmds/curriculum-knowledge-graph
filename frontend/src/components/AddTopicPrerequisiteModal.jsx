import { useState } from "react";
import { Modal } from "./Modal";
import { Field, TextInput } from "./Field";
import { Button } from "./ui";
import { createTopicPrerequisite } from "../api/curriculum";
import { useToast } from "./Toast";
import { logActivity } from "../lib/activityLog";
import { ApiError } from "../api/client";
import { ArrowDown, Loader2 } from "lucide-react";

export function AddTopicPrerequisiteModal({ open, onClose, defaultTargetId = "", onCreated }) {
  const [prereq, setPrereq] = useState("");
  const [target, setTarget] = useState(defaultTargetId);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  function validate() {
    const e = {};
    if (!prereq.trim()) e.prereq = "Required.";
    if (!target.trim()) e.target = "Required.";
    if (prereq.trim() && target.trim() && prereq.trim() === target.trim()) {
      e.target = "A topic can't be its own prerequisite.";
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
      await createTopicPrerequisite({
        prerequisite_topic_id: prereq.trim(),
        target_topic_id: target.trim(),
      });
      logActivity({
        type: "topic_prerequisite_created",
        label: `Linked ${prereq.trim()} → ${target.trim()}`,
        detail: "Topic prerequisite",
      });
      toast.success("Prerequisite added", `${prereq.trim()} is now a prerequisite of ${target.trim()}.`);
      onCreated?.();
      handleClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't create this prerequisite. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setPrereq("");
    setTarget(defaultTargetId);
    setErrors({});
    setFormError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add topic prerequisite"
      description="Enter the topic IDs to link. The prerequisite must be completed before the target."
    >
      <form onSubmit={handleSubmit}>
        <Field label="Prerequisite topic" required error={errors.prereq} hint="Topic ID, e.g. PY_001">
          <TextInput
            value={prereq}
            onChange={(e) => setPrereq(e.target.value)}
            placeholder="PY_001"
            autoFocus
            className="font-mono"
          />
        </Field>

        <div className="flex justify-center py-1">
          <ArrowDown size={16} className="text-ink-faint" />
        </div>

        <Field label="Target topic" required error={errors.target} hint="Topic ID, e.g. PY_027">
          <TextInput
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="PY_027"
            className="font-mono"
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
            {submitting ? "Adding…" : "Add prerequisite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
