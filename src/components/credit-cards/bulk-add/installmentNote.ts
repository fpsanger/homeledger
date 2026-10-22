import { splitInstallmentCents, toCents } from "../../transactions/unifiedTransactionForm/billing";

/** Grouped pt-BR currency, so notes read like the figures on the bill. */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * How a purchase splits, in one line: "3× R$ 33,33 · última R$ 33,34". Rounding is stated, not
 * hidden. A single installment needs no note.
 */
export function describeInstallmentSplit(
  amount: string,
  numberOfInstallments: string,
): string | null {
  const count = parseInt(numberOfInstallments, 10);
  const totalCents = toCents(amount);
  if (!count || count < 2 || totalCents <= 0) return null;

  const { baseCents, lastCents } = splitInstallmentCents(totalCents, count);
  const base = `${count}× ${formatBRL(baseCents)}`;
  return lastCents === baseCents ? base : `${base} · última ${formatBRL(lastCents)}`;
}
