import type { BillingItem } from "../entities/BillingItem";

export interface IStatementParser {
  parse(pdfText: string, statementType: "credit-card" | "debit"): Promise<BillingItem[]>;
}
