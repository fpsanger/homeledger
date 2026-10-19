/**
 * "YYYY-MM" of the bill where installment 1 of a purchase landed, given that installment
 * `installmentNumber` appears on the statement for `year`/`month`.
 */
export function statementBillingMonth(year: number, month: number, installmentNumber = 1): string {
  const absolute = year * 12 + (month - 1) - (installmentNumber - 1);
  const firstYear = Math.floor(absolute / 12);
  const firstMonth = (absolute % 12) + 1;
  return `${firstYear}-${String(firstMonth).padStart(2, "0")}`;
}
