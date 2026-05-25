import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { parseStatementUseCase } from "../../../../application/use-cases/ParseStatementUseCase";
import { reconcileStatementUseCase } from "../../../../application/use-cases/ReconcileStatementUseCase";
import { createHybridStatementParser } from "../../../../infrastructure/parsing/HybridStatementParser";
import type { SupportedBank } from "../../../../infrastructure/parsing/BillingRegexParser";
import { createRepositories } from "../../_lib/repositories";

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
    const ollamaBaseUrl = (formData.get("ollamaBaseUrl") as string | null) ?? "http://localhost:11434";
    const model = (formData.get("model") as string | null) ?? "llama3";

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
    if (statementType === "credit-card" && !creditCardId) {
      return NextResponse.json(
        { error: "Missing required field: creditCardId (required when statementType is 'credit-card')" },
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
      model,
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
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
