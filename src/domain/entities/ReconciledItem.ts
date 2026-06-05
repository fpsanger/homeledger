import type { BillingItem } from "./BillingItem";

export type ReconciledItem = {
  billingItem: BillingItem;
  status: "matched" | "missing";
  matchedRecordId?: string;
  categoryId?: string;
};
