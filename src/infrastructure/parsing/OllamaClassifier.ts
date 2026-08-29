import { z } from "zod";
import type { RawBillingRow } from "./BillingRegexParser";

export type Classification = {
  transactionType: "EXPENSE" | "INCOME" | "INVESTMENT";
  confidence: "high" | "low";
};

export type ClassificationResult = {
  row: RawBillingRow;
  classification: Classification;
};

const ClassificationItemSchema = z.object({
  index: z.number(),
  transactionType: z.enum(["EXPENSE", "INCOME", "INVESTMENT"]),
  confidence: z.enum(["high", "low"]),
});

const OllamaResponseSchema = z.object({
  classifications: z.array(ClassificationItemSchema),
});

const SYSTEM_PROMPT = `You are a Brazilian bank transaction classifier.
Given a JSON array of transactions, classify each one.
Return a JSON object with a "classifications" array.
Each element must have:
- "index": the index of the transaction (0-based)
- "transactionType": one of "EXPENSE", "INCOME", "INVESTMENT"
- "confidence": "high" or "low"

Rules:
- Payments received, estorno, reembolso, pagamento recebido → INCOME (isCredit=true is a strong signal)
- Investment transactions (CDB, tesouro, fundos, ações, FII) → INVESTMENT
- Everything else → EXPENSE
- If unsure, use confidence "low"`;

function fallbackClassification(rows: RawBillingRow[]): ClassificationResult[] {
  return rows.map((row) => ({
    row,
    classification: {
      transactionType: row.isCredit ? "INCOME" : "EXPENSE",
      confidence: "low",
    },
  }));
}

export async function classifyRows(
  rows: RawBillingRow[],
  ollamaBaseUrl: string = "http://localhost:11434",
  model: string = "llama3",
): Promise<ClassificationResult[]> {
  if (rows.length === 0) return [];

  const userContent = JSON.stringify(
    rows.map((row, index) => ({
      index,
      description: row.description,
      amount: row.amount,
      isCredit: row.isCredit,
    })),
  );

  let rawJson: unknown;
  try {
    const response = await fetch(`${ollamaBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      return fallbackClassification(rows);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackClassification(rows);
    }
    rawJson = JSON.parse(content);
  } catch {
    return fallbackClassification(rows);
  }

  const parsed = OllamaResponseSchema.safeParse(rawJson);
  if (!parsed.success) {
    return fallbackClassification(rows);
  }

  const classificationMap = new Map(parsed.data.classifications.map((c) => [c.index, c]));

  return rows.map((row, index) => {
    const item = classificationMap.get(index);
    if (!item) {
      return {
        row,
        classification: {
          transactionType: row.isCredit ? "INCOME" : "EXPENSE",
          confidence: "low" as const,
        },
      };
    }
    return {
      row,
      classification: {
        transactionType: item.transactionType,
        confidence: item.confidence,
      },
    };
  });
}
