export const PENDING_HREF = "/pending-transactions";

/** Number of Shortcut purchases waiting for review, shown next to the nav link. */
export function PendingCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      role="status"
      aria-label={`${count} compras para revisar`}
      className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground"
    >
      {count}
    </span>
  );
}
