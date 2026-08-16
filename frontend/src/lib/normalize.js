// The brief doesn't pin down exact response shapes for the GET
// endpoints, only example request bodies for the POSTs. These helpers
// accept a handful of reasonable shapes (a bare array, or an object
// wrapping the array under a common key) and normalize each entry to
// { id, name, unit, description, raw } so the UI has one shape to
// render, while keeping the original payload available for debugging.

function pickArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const key of ["results", "topics", "prerequisites", "downstream", "chain", "data", "items"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

export function normalizeTopicList(data) {
  return pickArray(data).map((item) => normalizeTopic(item));
}

export function normalizeTopic(item) {
  if (typeof item === "string") {
    return { id: item, name: null, unit: null, description: null, raw: item };
  }
  if (item && typeof item === "object") {
    return {
      id: item.topic_id || item.id || item.prerequisite_topic_id || item.target_topic_id || null,
      name: item.name || item.topic_name || null,
      unit: item.unit ?? null,
      description: item.description ?? null,
      raw: item,
    };
  }
  return { id: null, name: null, unit: null, description: null, raw: item };
}
