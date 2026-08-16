// Centralized API client.
//
// Every network call in this app goes through `request()` below.
// Change the backend location in one place by editing API_BASE
// (or by setting VITE_API_BASE in a .env file).

export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

/**
 * A normalized error shape so the UI never has to deal with raw
 * fetch/stack-trace output. `message` is always safe to show to a
 * faculty user.
 */
export class ApiError extends Error {
  constructor(message, { status, detail } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Thrown by endpoints in this API layer that are documented in the
 * project brief as "not yet available on the backend." The UI is
 * expected to catch this specifically and render a "backend endpoint
 * needed" state instead of inventing data.
 */
export class EndpointNotAvailableError extends Error {
  constructor(endpointDescription) {
    super(`Backend endpoint not available yet: ${endpointDescription}`);
    this.name = "EndpointNotAvailableError";
    this.endpointDescription = endpointDescription;
  }
}

function friendlyMessageFor(status, backendMessage) {
  // Map common backend validation errors to faculty-friendly copy.
  // Falls back to whatever the backend said, then to a generic message.
  const known = {
    "course not found": "Course not found. Check the course code and try again.",
    "topic not found": "Topic not found. Check the topic ID and try again.",
    "topic already exists": "A topic with this name already exists in this course.",
    "self prerequisite": "A topic cannot be its own prerequisite.",
    "prerequisite cycle": "This would create a prerequisite cycle — choose a different pair.",
    "cycle detected": "This would create a prerequisite cycle — choose a different pair.",
    "duplicate": "This prerequisite relationship already exists.",
    "already exists": "This relationship already exists.",
  };

  if (backendMessage) {
    const lower = backendMessage.toLowerCase();
    for (const key of Object.keys(known)) {
      if (lower.includes(key)) return known[key];
    }
    // Backend message exists but isn't one of our known patterns —
    // still safer than a stack trace, so surface it as-is.
    return backendMessage;
  }

  if (status === 404) return "That item couldn't be found.";
  if (status === 409) return "This conflicts with existing curriculum data.";
  if (status === 422) return "Some of the details entered aren't valid. Double-check the form.";
  if (status >= 500) return "The server ran into a problem. Try again in a moment.";
  return "Something went wrong. Please try again.";
}

async function request(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (networkErr) {
    throw new ApiError(
      "Can't reach the backend. Confirm the FastAPI server is running at " + API_BASE + ".",
      { status: 0 }
    );
  }

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const backendMessage =
      (payload && (payload.detail || payload.message || payload.error)) || null;
    throw new ApiError(friendlyMessageFor(response.status, typeof backendMessage === "string" ? backendMessage : null), {
      status: response.status,
      detail: payload,
    });
  }

  return payload;
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
};
