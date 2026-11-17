const INVALID_AMOUNT = "Amount must be a positive number";

function decimalSeparatorIndex(text: string): number {
  const lastDot = text.lastIndexOf(".");
  const lastComma = text.lastIndexOf(",");
  if (lastDot === -1 && lastComma === -1) return -1;
  // With both separators present, whichever comes last is the decimal one.
  if (lastDot !== -1 && lastComma !== -1) return Math.max(lastDot, lastComma);

  const at = Math.max(lastDot, lastComma);
  const separator = text[at];
  if (text.split(separator).length > 2) return -1;
  // pt-BR: a lone comma is always decimal. A lone dot is decimal only with 1-2 digits after it.
  if (separator === ",") return at;
  return text.length - at - 1 <= 2 ? at : -1;
}

function normalizeDecimalText(text: string): string {
  const decimalAt = decimalSeparatorIndex(text);
  if (decimalAt === -1) return text.replace(/[.,]/g, "");
  return `${text.slice(0, decimalAt).replace(/[.,]/g, "")}.${text.slice(decimalAt + 1)}`;
}

function toPositiveCents(value: number): number {
  if (!Number.isFinite(value)) throw new Error(INVALID_AMOUNT);
  const rounded = Math.round(value * 100) / 100;
  if (rounded <= 0) throw new Error(INVALID_AMOUNT);
  return rounded;
}

/**
 * Parses the amount an iOS Shortcut sends for a Wallet transaction, which may carry a currency
 * symbol and either pt-BR ("1.234,56") or en-US ("1,234.56") separators.
 */
export function parseShortcutAmount(raw: string | number): number {
  if (typeof raw === "number") return toPositiveCents(raw);
  // A minus anywhere ("-5,00", "R$ -5,00", "5,00-", "−5,00") means a refund, not a purchase.
  if (/[-−‒-―]/.test(raw)) throw new Error(INVALID_AMOUNT);

  const numeric = raw.replace(/[^\d.,]/g, "");
  if (!/\d/.test(numeric)) throw new Error(INVALID_AMOUNT);
  return toPositiveCents(Number(normalizeDecimalText(numeric)));
}
