import { useEffect, useRef, useState } from "react";
import { checkHealth } from "../api/curriculum";

const POLL_MS = 20000;

/** Polls GET /health and reports a simple connection status for the UI chrome. */
export function useHealth() {
  const [status, setStatus] = useState("checking"); // "checking" | "online" | "offline"
  const [detail, setDetail] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let timer;

    async function check() {
      try {
        const data = await checkHealth();
        if (!mounted.current) return;
        setStatus("online");
        setDetail(data);
      } catch {
        if (!mounted.current) return;
        setStatus("offline");
        setDetail(null);
      } finally {
        if (mounted.current) timer = setTimeout(check, POLL_MS);
      }
    }

    check();
    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, []);

  return { status, detail };
}
