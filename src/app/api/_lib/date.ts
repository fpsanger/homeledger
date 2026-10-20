const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export type ParsedYearMonth = { value?: { year: number; month: number }; error?: string };

/** Parses a "YYYY-MM" request field. Returns an empty result when the field is absent. */
export function parseYearMonth(raw: unknown, field: string): ParsedYearMonth {
  if (raw === undefined || raw === null || raw === "") return {};
  const match = typeof raw === "string" ? YEAR_MONTH_PATTERN.exec(raw) : null;
  if (!match) return { error: `${field} must be in YYYY-MM format` };
  const month = Number(match[2]);
  if (month < 1 || month > 12) return { error: `${field} must be in YYYY-MM format` };
  return { value: { year: Number(match[1]), month } };
}

export function parseDateUTC(dateStr: string): Date {
  const [datePart] = dateStr.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
