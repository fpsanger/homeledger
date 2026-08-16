import type { BillingItem } from "../../domain/entities/BillingItem";
import { classifyBillingRow } from "./classifyBillingRow";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ";" && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

type ParsedRow = { description: string; amount: number; date: Date; parcelaStr: string };

function parseC6Row(cols: string[]): ParsedRow | null {
  if (cols.length < 9) return null;

  const dateStr = cols[0]; // DD/MM/YYYY
  const description = cols[4]; // Descrição
  const parcelaStr = cols[5]; // "X/Y" or "Única"
  const rawAmount = cols[8]; // Valor (em R$)

  const [day, month, year] = dateStr.split("/");
  if (!day || !month || !year) return null;

  const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));

  const amount = parseFloat(rawAmount);
  if (!Number.isFinite(amount) || amount === 0) return null;

  return { description, amount, date, parcelaStr };
}

export function parseC6Csv(csvText: string): BillingItem[] {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // need at least header + 1 data row
  if (lines.length < 2) return [];

  const items: BillingItem[] = [];

  for (const line of lines.slice(1)) {
    const parsed = parseC6Row(parseCsvLine(line));
    if (!parsed) continue;

    const absAmount = Math.abs(parsed.amount);
    const isCredit = parsed.amount < 0;

    const installmentMatch = parsed.parcelaStr.match(/^(\d+)\/(\d+)$/);
    const isSingleInstallment = parsed.parcelaStr === "Única";

    const item = classifyBillingRow({
      description: parsed.description,
      absAmount,
      date: parsed.date,
      isCredit,
      installment:
        installmentMatch || isSingleInstallment
          ? {
              description: parsed.description,
              installmentNumber: installmentMatch ? parseInt(installmentMatch[1], 10) : 1,
              totalInstallments: installmentMatch ? parseInt(installmentMatch[2], 10) : 1,
            }
          : null,
    });
    if (item) items.push(item);
  }

  return items;
}
