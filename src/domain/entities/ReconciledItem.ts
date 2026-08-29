import type { BillingItem } from "./BillingItem";

export type CategorySource = "rule" | "history" | "ai";

export type ReconciledItem = {
  billingItem: BillingItem;
  status: "matched" | "missing";
  matchedRecordId?: string;
  categoryId?: string;
  categorySource?: CategorySource;
};
