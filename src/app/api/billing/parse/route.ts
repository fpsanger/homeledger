import { NextRequest, NextResponse } from "next/server";
import { parseStatementUseCase } from "../../../../application/use-cases/ParseStatementUseCase";

export const runtime = "nodejs";
import { reconcileStatementUseCase } from "../../../../application/use-cases/ReconcileStatementUseCase";
import { createHybridStatementParser } from "../../../../infrastructure/parsing/HybridStatementParser";
import { parseC6Csv } from "../../../../infrastructure/parsing/C6CsvParser";
import { parseBradescoCsv } from "../../../../infrastructure/parsing/BradescoCsvParser";
import { parseBtgCsv } from "../../../../infrastructure/parsing/BtgCsvParser";
import { parseBillingText, type SupportedBank } from "../../../../infrastructure/parsing/BillingRegexParser";
import type { BillingItem } from "../../../../domain/entities/BillingItem";
import { createRepositories } from "../../_lib/repositories";
import { InvalidBillingItemError } from "../../../../domain/errors";

function isCSVFile(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/csv"
  );
}

function isPDFFile(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(".pdf") ||
    file.type === "application/pdf"
  );
}

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
    const ollamaModel = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: "Missing required field: file" }, { status: 400 });
    }
    if (!isCSVFile(file) && !isPDFFile(file)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or CSV file." },
        { status: 400 },
      );
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

    const buffer = Buffer.from(await file.arrayBuffer());

    let items: BillingItem[];

    let detectedBank = bank ?? "unknown";
    if (isCSVFile(file)) {
      const isBtg = detectedBank === "btg";
      const isBradesco = detectedBank === "bradesco";
      const encoding = "utf-8";
      const csvText = new TextDecoder(encoding).decode(buffer);
      items = isBtg ? parseBtgCsv(csvText) : isBradesco ? parseBradescoCsv(csvText) : parseC6Csv(csvText);
    } else {
      let text: string;
      try {
        const { extractText, getDocumentProxy } = await import("unpdf");
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text: extracted } = await extractText(pdf, { mergePages: true });
        // unpdf collapses lines into spaces; restore line breaks before each date
        text = extracted.replace(/(?<!\n)(\d{2}\/\d{2}\/\d{4})/g, "\n$1").trim();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/password|encrypt/i.test(msg)) {
          return NextResponse.json(
            { error: "PDF is password-protected. Please remove the password before uploading." },
            { status: 422 },
          );
        }
        throw err;
      }

      const statement = parseBillingText(text, bank as SupportedBank | undefined);
      detectedBank = statement.bank !== "unknown" ? statement.bank : (bank ?? "unknown");

      const parser = createHybridStatementParser({
        hintBank: statement.bank,
        ollamaBaseUrl,
        model: ollamaModel,
      });

      try {
        items = await parseStatementUseCase(parser, text, statementType);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("PDF text is empty")) {
          return NextResponse.json({ error: "PDF text is empty or unreadable" }, { status: 422 });
        }
        throw err;
      }
    }

    const filteredItems = items.filter((item) => {
      const d = item.date;
      return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
    });

    const { creditCardPurchase, transaction } = createRepositories();

    const reconciledItems = await reconcileStatementUseCase(
      creditCardPurchase,
      transaction,
      filteredItems,
      personId,
      year,
      month,
      creditCardId ?? undefined,
    );

    return NextResponse.json({ items: reconciledItems, detectedBank });
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
