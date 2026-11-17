import { useEffect, useState } from "react";

const PENDING_CHANGED_EVENT = "pending-transactions:changed";

/** Tells every `usePendingCount` on the page that a purchase was confirmed or discarded. */
export function notifyPendingChanged() {
  window.dispatchEvent(new Event(PENDING_CHANGED_EVENT));
}

/** How many purchases reported by a Shortcut still wait for review; refreshes with `refreshKey`. */
export function usePendingCount(refreshKey: string): number {
  const [count, setCount] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey only triggers a refetch
  useEffect(() => {
    let active = true;
    const refresh = () => {
      fetch("/api/pending-transactions")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (active && data) setCount(data.pending?.length ?? 0);
        })
        .catch(() => {});
    };

    refresh();
    window.addEventListener(PENDING_CHANGED_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(PENDING_CHANGED_EVENT, refresh);
    };
  }, [refreshKey]);

  return count;
}
