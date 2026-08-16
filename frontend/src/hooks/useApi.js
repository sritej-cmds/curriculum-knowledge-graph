import { useCallback, useEffect, useRef, useState } from "react";
import { EndpointNotAvailableError, ApiError } from "../api/client";

/**
 * Runs an async fetcher and exposes { data, status, error, notAvailable, refetch }.
 * status is one of "idle" | "loading" | "success" | "error".
 *
 * `deps` re-runs the fetch when they change (mirrors useEffect deps).
 * Pass `enabled: false` to skip fetching (e.g. until a required param exists).
 */
export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ status: "idle", data: null, error: null, notAvailable: null });
  const requestId = useRef(0);

  const run = useCallback(() => {
    if (!enabled) {
      setState({ status: "idle", data: null, error: null, notAvailable: null });
      return;
    }
    const id = ++requestId.current;
    setState((s) => ({ ...s, status: "loading", error: null }));
    Promise.resolve()
      .then(fetcher)
      .then((data) => {
        if (id !== requestId.current) return;
        setState({ status: "success", data, error: null, notAvailable: null });
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        if (err instanceof EndpointNotAvailableError) {
          setState({ status: "error", data: null, error: null, notAvailable: err.endpointDescription });
        } else if (err instanceof ApiError) {
          setState({ status: "error", data: null, error: err.message, notAvailable: null });
        } else {
          setState({ status: "error", data: null, error: "Something went wrong.", notAvailable: null });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, refetch: run };
}
