import type { BillingMonth } from "../../../domain/services/InstallmentPurchase";
import { parseYearMonth } from "./date";

export type ParsedBillingMonth = { value?: BillingMonth; error?: string };

/** Parses an optional "YYYY-MM" request field into a billing month. */
export function parseBillingMonth(raw: unknown): ParsedBillingMonth {
  return parseYearMonth(raw, "billingMonth");
}
