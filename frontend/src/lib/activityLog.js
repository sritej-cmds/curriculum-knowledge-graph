// A small client-side log of actions taken *in this session*. This is
// not backend data — it's just a UX convenience so the Overview page
// has something honest to show under "recent activity" until the
// backend exposes a real activity/audit endpoint.

const KEY = "curricula.session-activity";
const listeners = new Set();

function readFromStorage() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

// useSyncExternalStore requires getSnapshot() to return the SAME
// reference across calls until the underlying data actually changes —
// otherwise React sees a "new" value every render and loops forever.
// So we keep a single in-memory cache and only replace it (a new
// array reference) when the log is actually written to.
let cache = readFromStorage();

function write(entries) {
  cache = entries.slice(0, 20);
  sessionStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function logActivity(entry) {
  const entries = [{ ...entry, at: new Date().toISOString() }, ...cache];
  write(entries);
}

export function getActivity() {
  return cache;
}

export function subscribeActivity(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
