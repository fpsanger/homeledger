import type { BillingItem } from "../../domain/entities/BillingItem";
import { classifyBillingRow } from "./classifyBillingRow";

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

type ParsedRow = { description: string; amount: number; dd: number; mm: number };

function parseBradescoRow(cols: string[]): ParsedRow | null {
  if (cols.length < 4) return null;

  const dateStr = cols[0];
  const description = cols[1].trim();

  // Two formats: combined "44,30" in cols[3], or split int;dec in cols[4];cols[5]
  let amount: number;
  if (cols[3]?.includes(",")) {
    amount = parseFloat(cols[3].replace(",", "."));
  } else if (cols[4] && cols[5]) {
    amount = parseAmount(cols[4], cols[5]);
  } else {
    return null;
  }

  if (!dateStr.match(/^\d{2}\/\d{2}$/)) return null;
  if (SKIP_DESCRIPTIONS.some((s) => description.startsWith(s))) return null;
  if (!Number.isFinite(amount) || amount === 0) return null;

  const [dd, mm] = dateStr.split("/").map(Number);
  return { description, amount, dd, mm };
}

function locateDataStart(lines: string[], sectionStart: number): number {
  // Find column header after section start
  const colHeaderIdx = lines.findIndex(
    (l, i) => i > sectionStart && l.startsWith("Data;Histórico"),
  );
  return colHeaderIdx !== -1 ? colHeaderIdx + 1 : sectionStart + 2;
}

function buildBradescoItem(
  parsed: ParsedRow,
  headerDate: { year: number; month: number } | null,
): BillingItem | null {
  const isCredit = parsed.amount < 0;
  const absAmount = Math.abs(parsed.amount);
  const year = headerDate ? resolveYear(parsed.mm, headerDate.year, headerDate.month) : 2000;
  const date = new Date(Date.UTC(year, parsed.mm - 1, parsed.dd));

  const installMatch = parsed.description.match(INSTALLMENT_RE);
  return classifyBillingRow({
    description: parsed.description,
    absAmount,
    date,
    isCredit,
    installment: installMatch
      ? {
          description: installMatch[1].trim(),
          installmentNumber: parseInt(installMatch[2], 10),
          totalInstallments: parseInt(installMatch[3], 10),
        }
      : null,
  });
}

export function parseBradescoCsv(csvText: string): BillingItem[] {
  if (!csvText.trim()) return [];

  const lines = csvText.split(/\r\n|\r|\n/).map((l) => l.trim());

  const headerLine = lines.find((l) => l.startsWith("Data:")) ?? "";
  const headerDate = extractHeaderYear(headerLine);

  const sectionStart = lines.findIndex((l) => l.includes(";;; "));
  if (sectionStart === -1) return [];

  const dataStart = locateDataStart(lines, sectionStart);
  const items: BillingItem[] = [];

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.startsWith("Total da fatura")) break;

    const parsed = parseBradescoRow(line.split(";"));
    if (!parsed) continue;

    const item = buildBradescoItem(parsed, headerDate);
    if (item) items.push(item);
  }

  return items;
}
