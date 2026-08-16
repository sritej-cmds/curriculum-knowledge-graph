import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextInput } from "./Field";
import { Button } from "./ui";
import { ArrowRight } from "lucide-react";

export function TopicLookup({ label = "Jump to a topic", placeholder = "e.g. PY_027" }) {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  function go(e) {
    e.preventDefault();
    if (!value.trim()) return;
    navigate(`/topics/${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={go} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="text-sm font-medium text-ink block mb-1.5">{label}</label>
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="font-mono"
        />
      </div>
      <Button type="submit" variant="secondary">
        Go <ArrowRight size={14} />
      </Button>
    </form>
  );
}
