import { useSyncExternalStore } from "react";
import { getActivity, subscribeActivity } from "../lib/activityLog";

// Stable empty-array reference for the server snapshot — a fresh `[]`
// literal here would cause the same "getSnapshot should be cached"
// loop that the activity log cache fixes on the client side.
const EMPTY = [];

export function useActivity() {
  return useSyncExternalStore(subscribeActivity, getActivity, () => EMPTY);
}
