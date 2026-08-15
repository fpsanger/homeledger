import type { BillingItem } from "../../domain/entities/BillingItem";
import {
  createInstallmentBillingItem,
  createRefundBillingItem,
  createTransactionBillingItem,
} from "../../domain/entities/BillingItem";
import type { IStatementParser } from "../../domain/repositories/IStatementParser";
import { parseBillingText, type SupportedBank } from "./BillingRegexParser";
import { type ClassificationResult, classifyRows } from "./OllamaClassifier";

export type HybridParserConfig = {
  ollamaBaseUrl?: string;
  model?: string;
  hintBank?: SupportedBank;
};

export function createHybridStatementParser(config?: HybridParserConfig): IStatementParser {
  return {
    async parse(_pdfText: string, _statementType: "credit-card" | "debit"): Promise<BillingItem[]> {
      const statement = parseBillingText(_pdfText, config?.hintBank);

      if (statement.rows.length === 0) return [];

      const results: ClassificationResult[] = await classifyRows(
        statement.rows,
        config?.ollamaBaseUrl,
        config?.model,
      );

      const items: BillingItem[] = [];

      for (const result of results) {
        try {
          const { row, classification } = result;

          if (row.installmentNumber != null && row.totalInstallments != null) {
            items.push(
              createInstallmentBillingItem({
                description: row.description,
                amount: row.amount,
                date: row.date,
                installmentNumber: row.installmentNumber,
                totalInstallments: row.totalInstallments,
              }),
            );
          } else if (_statementType === "credit-card" && row.isCredit) {
            items.push(
              createRefundBillingItem({
                description: row.description,
                amount: row.amount,
                date: row.date,
              }),
            );
          } else {
            items.push(
              createTransactionBillingItem({
                description: row.description,
                amount: row.amount,
                date: row.date,
                transactionType: classification.transactionType,
              }),
            );
          }
        } catch (err) {
          console.warn(
            `HybridStatementParser: skipping invalid row - ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      return items;
    },
  };
}
