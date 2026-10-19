import type { BillingMonth } from "../../../domain/services/InstallmentPurchase";

const BILLING_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export type ParsedBillingMonth = { value?: BillingMonth; error?: string };

/** Parses an optional "YYYY-MM" request field into a billing month. */
export function parseBillingMonth(raw: unknown): ParsedBillingMonth {
  if (raw === undefined || raw === null || raw === "") return {};
  const match = typeof raw === "string" ? BILLING_MONTH_PATTERN.exec(raw) : null;
  if (!match) return { error: "billingMonth must be in YYYY-MM format" };
  const month = Number(match[2]);
  if (month < 1 || month > 12) return { error: "billingMonth must be in YYYY-MM format" };
  return { value: { year: Number(match[1]), month } };
}
