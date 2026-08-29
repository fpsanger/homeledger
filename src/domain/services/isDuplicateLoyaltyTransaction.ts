const DUPLICATE_WINDOW_DAYS = 30;

export type LoyaltyDuplicateCandidate = {
  id: string;
  type: string;
  points: number;
  personId: string | null;
  date: Date | string;
  description: string | null;
};

function withinDays(a: Date | string, dateStr: string): boolean {
  const aDate = a instanceof Date ? a : new Date(a);
  const b = new Date(dateStr);
  const diff = Math.abs(aDate.getTime() - b.getTime());
  return diff <= DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function findDuplicateLoyaltyTransaction<T extends LoyaltyDuplicateCandidate>(
  existing: T[],
  type: string,
  points: number | null,
  personId: string | null,
  date: string | null,
): T | null {
  if (points === null || date === null) return null;

  const matches = existing.filter(
    (t) =>
      t.type === type && t.points === points && t.personId === personId && withinDays(t.date, date),
  );
  if (matches.length === 0) return null;

  const targetMs = new Date(date).getTime();
  return matches.reduce((closest, t) => {
    const dA = Math.abs(new Date(t.date).getTime() - targetMs);
    const dB = Math.abs(new Date(closest.date).getTime() - targetMs);
    return dA < dB ? t : closest;
  });
}
