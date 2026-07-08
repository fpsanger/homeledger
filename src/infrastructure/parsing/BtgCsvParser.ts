import type { BillingItem } from "../../domain/entities/BillingItem";
import {
  createInstallmentBillingItem,
  createTransactionBillingItem,
  createRefundBillingItem,
} from "../../domain/entities/BillingItem";

const MONTH_MAP: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

const INSTALLMENT_RE = /^(.*?)\s*\((\d+)\/(\d+)\)\s*$/;

function parseAmount(raw: string): number {
  // "R$ 4,887.92" or "R$ 13.90" — BTG uses period as decimal
  const cleaned = raw.replace(/[R$\s]/g, "").replace(/,/g, "");
  return parseFloat(cleaned);
}

function extractBillingYear(lines: string[]): { year: number; month: number } | null {
  for (const line of lines) {
    // Matches "Junho/2026" anywhere in the line
    const m = line.match(/(\w+)\/(\d{4})/);
    if (!m) continue;
    const month = MONTH_MAP[m[1].toLowerCase()];
    if (!month) continue;
    return { month, year: parseInt(m[2], 10) };
  }
  return null;
}

function resolveYear(txMonth: number, billingMonth: number, billingYear: number): number {
  // Transactions in months after the billing month belong to the previous year
  // e.g. billing June 2026, tx in March → March 2026; tx in November → November 2025
  if (txMonth > billingMonth) return billingYear - 1;
  return billingYear;
}

export function parseBtgCsv(csvText: string): BillingItem[] {
  if (!csvText.trim()) return [];

  const lines = csvText.split(/\r\n|\r|\n/);

  const billingDate = extractBillingYear(lines);

  const sectionIdx = lines.findIndex((l) => l.includes("Total de compras e despesas"));
  if (sectionIdx === -1) return [];

  // Skip the "Total de compras e despesas" row and the column header row
  const dataStart = sectionIdx + 2;

  const items: BillingItem[] = [];

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",");
    // Expect at least 8 cols: empty, date, description, empty, amount, type, authCode, card
    if (cols.length < 8) continue;

    const dateStr = cols[1]?.trim();
    const description = cols[2]?.trim();
    const rawAmount = cols[4]?.trim();
    const purchaseType = cols[5]?.trim();

    if (!dateStr?.match(/^\d{2}\/\d{2}$/)) continue;
    if (!description || !rawAmount) continue;

    const amount = parseAmount(rawAmount);
    if (!Number.isFinite(amount) || amount === 0) continue;

    const isCredit = amount < 0;
    const absAmount = Math.abs(amount);

    const [dd, mm] = dateStr.split("/").map(Number);
    let year = new Date().getFullYear();
    if (billingDate) {
      year = resolveYear(mm, billingDate.month, billingDate.year);
    }
    const date = new Date(Date.UTC(year, mm - 1, dd));

    try {
      const installMatch = description.match(INSTALLMENT_RE);
      const isInstallmentType = purchaseType === "Parcela sem juros";

      if (installMatch && isInstallmentType) {
        const desc = installMatch[1].trim();
        const installmentNumber = parseInt(installMatch[2], 10);
        const totalInstallments = parseInt(installMatch[3], 10);
        items.push(
          createInstallmentBillingItem({
            description: desc,
            amount: absAmount,
            date,
            installmentNumber,
            totalInstallments,
          }),
        );
      } else if (isCredit) {
        items.push(createRefundBillingItem({ description, amount: absAmount, date }));
      } else {
        const transactionType = purchaseType === "Compra internacional" ? "EXPENSE" : "EXPENSE";
        items.push(
          createTransactionBillingItem({ description, amount: absAmount, date, transactionType }),
        );
      }
    } catch {
      // skip invalid rows
    }
  }

  return items;
}
