import type { BillingItem } from "../../domain/entities/BillingItem";
import {
  createInstallmentBillingItem,
  createTransactionBillingItem,
  createRefundBillingItem,
} from "../../domain/entities/BillingItem";

const SKIP_DESCRIPTIONS = ["SALDO ANTERIOR", "PAGTO. POR DEB EM C/C"];
const INSTALLMENT_RE = /^(.*?)\s+(\d+)\/(\d+)\s*$/;

function parseAmount(intPart: string, decPart: string): number {
  const int = parseInt(intPart.replace(/[^\d-]/g, ""), 10);
  const dec = parseInt(decPart.replace(/\D/g, ""), 10) || 0;
  if (!Number.isFinite(int)) return Number.NaN;
  const sign = int < 0 ? -1 : 1;
  return int + (sign * dec) / 100;
}

function extractHeaderYear(headerLine: string): { year: number; month: number } | null {
  const m = headerLine.match(/Data:\s*(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return { year: parseInt(m[3], 10), month: parseInt(m[2], 10) };
}

function resolveYear(txMonth: number, headerYear: number, headerMonth: number): number {
  return txMonth > headerMonth ? headerYear - 1 : headerYear;
}

export function parseBradescoCsv(csvText: string): BillingItem[] {
  if (!csvText.trim()) return [];

  const lines = csvText.split(/\r\n|\r|\n/).map((l) => l.trim());

  const headerLine = lines.find((l) => l.startsWith("Data:")) ?? "";
  const headerDate = extractHeaderYear(headerLine);

  const sectionStart = lines.findIndex((l) => l.includes(";;; "));
  if (sectionStart === -1) return [];

  // Find column header after section start
  const colHeaderIdx = lines.findIndex(
    (l, i) => i > sectionStart && l.startsWith("Data;Histórico"),
  );
  const dataStart = colHeaderIdx !== -1 ? colHeaderIdx + 1 : sectionStart + 2;

  const items: BillingItem[] = [];

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.startsWith("Total da fatura")) break;

    const cols = line.split(";");
    if (cols.length < 4) continue;

    const dateStr = cols[0];
    const description = cols[1].trim();

    // Two formats: combined "44,30" in cols[3], or split int;dec in cols[4];cols[5]
    let amount: number;
    if (cols[3]?.includes(",")) {
      amount = parseFloat(cols[3].replace(",", "."));
    } else if (cols[4] && cols[5]) {
      amount = parseAmount(cols[4], cols[5]);
    } else {
      continue;
    }

    if (!dateStr.match(/^\d{2}\/\d{2}$/)) continue;
    if (SKIP_DESCRIPTIONS.some((s) => description.startsWith(s))) continue;

    if (!Number.isFinite(amount) || amount === 0) continue;

    const isCredit = amount < 0;
    const absAmount = Math.abs(amount);

    const [dd, mm] = dateStr.split("/").map(Number);
    let year = 2000;
    if (headerDate) {
      year = resolveYear(mm, headerDate.year, headerDate.month);
    }
    const date = new Date(Date.UTC(year, mm - 1, dd));

    try {
      const installMatch = description.match(INSTALLMENT_RE);
      if (installMatch) {
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
        items.push(
          createTransactionBillingItem({
            description,
            amount: absAmount,
            date,
            transactionType: "EXPENSE",
          }),
        );
      }
    } catch {
      // skip invalid rows
    }
  }

  return items;
}
