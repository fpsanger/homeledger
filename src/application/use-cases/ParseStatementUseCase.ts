import type { BillingItem } from "../../domain/entities/BillingItem";
import type { IStatementParser } from "../../domain/repositories/IStatementParser";

export async function parseStatementUseCase(
  parser: IStatementParser,
  pdfText: string,
  statementType: "credit-card" | "debit",
): Promise<BillingItem[]> {
  // Validate pdfText is not empty
  if (!pdfText || pdfText.trim() === "") {
    throw new Error("PDF text is empty");
  }

  // Validate statementType is valid
  if (statementType !== "credit-card" && statementType !== "debit") {
    throw new Error("Invalid statement type");
  }

  // Delegate to parser
  return parser.parse(pdfText, statementType);
}
