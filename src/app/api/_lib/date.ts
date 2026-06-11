export function parseDateUTC(dateStr: string): Date {
  const [datePart] = dateStr.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
