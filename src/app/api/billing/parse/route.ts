import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
import { parseStatementUseCase } from "../../../../application/use-cases/ParseStatementUseCase";
import { reconcileStatementUseCase } from "../../../../application/use-cases/ReconcileStatementUseCase";
import { createHybridStatementParser } from "../../../../infrastructure/parsing/HybridStatementParser";
import type { SupportedBank } from "../../../../infrastructure/parsing/BillingRegexParser";
import { createRepositories } from "../../_lib/repositories";
import { InvalidBillingItemError } from "../../../../domain/errors";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const statementType = formData.get("statementType") as string | null;
    const personId = formData.get("personId") as string | null;
    const yearStr = formData.get("year") as string | null;
    const monthStr = formData.get("month") as string | null;
    const creditCardId = formData.get("creditCardId") as string | null;
    const bank = formData.get("bank") as string | null;
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL ?? "llama3";

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "Missing required field: file" }, { status: 400 });
    }
    if (!statementType || (statementType !== "credit-card" && statementType !== "debit")) {
      return NextResponse.json(
        { error: "Missing or invalid field: statementType (must be 'credit-card' or 'debit')" },
        { status: 400 },
      );
    }
    if (!personId) {
      return NextResponse.json({ error: "Missing required field: personId" }, { status: 400 });
    }
    if (!yearStr || !monthStr) {
      return NextResponse.json({ error: "Missing required fields: year and month" }, { status: 400 });
    }
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (Number.isNaN(year) || Number.isNaN(month)) {
      return NextResponse.json({ error: "Invalid year or month: must be numbers" }, { status: 400 });
    }
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: "Month must be between 1 and 12" }, { status: 400 });
    }
    if (year < 2000) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    if (statementType === "credit-card" && !creditCardId) {
      return NextResponse.json(
        { error: "Missing required field: creditCardId (required when statementType is 'credit-card')" },
        { status: 400 },
      );
    }

    // Validate bank
    const allowedBanks = ["itau", "bradesco", "c6", "btg", "unknown"];
    if (bank && !allowedBanks.includes(bank)) {
      return NextResponse.json(
        { error: "Invalid bank. Must be one of: itau, bradesco, c6, btg, unknown" },
        { status: 400 },
      );
    }

    // Extract PDF text
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text } = await pdfParse(buffer);

    // Create parser and repos
    const parser = createHybridStatementParser({
      hintBank: bank as SupportedBank | undefined,
      ollamaBaseUrl,
      model: ollamaModel,
    });

    const { creditCardPurchase, transaction } = createRepositories();

    // Parse and reconcile
    let items;
    try {
      items = await parseStatementUseCase(parser, text, statementType);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("PDF text is empty")) {
        return NextResponse.json({ error: "PDF text is empty or unreadable" }, { status: 422 });
      }
      throw err;
    }

    const reconciledItems = await reconcileStatementUseCase(
      creditCardPurchase,
      transaction,
      items,
      personId,
      year,
      month,
      creditCardId ?? undefined,
    );

    return NextResponse.json(reconciledItems);
  } catch (err) {
    if (err instanceof InvalidBillingItemError) {
      return NextResponse.json(
        { error: "Invalid data in billing statement" },
        { status: 400 },
      );
    }
    console.error("Billing parse error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
