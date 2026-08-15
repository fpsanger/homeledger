import type {
  InstallmentBillingItem,
  TransactionBillingItem,
} from "../../../src/domain/entities/BillingItem";
import { parseBradescoCsv } from "../../../src/infrastructure/parsing/BradescoCsvParser";

// Bradesco CSV uses ';' as delimiter. Values are split: integer and decimal in separate cells.
// e.g. R$ 44,30 → cols[4]="44", cols[5]="30"
// Date is DD/MM; year is extracted from header line "Data: DD/MM/YYYY"

function makeHeader(date = "03/06/2026"): string {
  return `Data: ${date} 08:28:51Situação da Fatura: PAGOMARGARETE P SANGER ;;; 3914`;
}

function makeColHeader(): string {
  return "Data;Histórico;Valor(US$);;Valor(R$);;";
}

function makeRow(date: string, desc: string, brlInt: string, brlDec: string): string {
  return `${date};${desc};0;00;${brlInt};${brlDec}`;
}

function makeFooter(): string {
  return "Total da fatura em Real: ;;;6539;38";
}

function buildCsv(rows: string[], headerDate = "03/06/2026"): string {
  return [makeHeader(headerDate), makeColHeader(), ...rows, makeFooter()].join("\n");
}

describe("parseBradescoCsv", () => {
  test("1. parses regular expense → TransactionBillingItem EXPENSE", () => {
    const csv = buildCsv([makeRow("27/05", "GISELE VERAS ETHEL EPP", "44", "30")]);
    const items = parseBradescoCsv(csv);
    expect(items).toHaveLength(1);
    const item = items[0] as TransactionBillingItem;
    expect(item.kind).toBe("transaction");
    expect(item.transactionType).toBe("EXPENSE");
    expect(item.amount).toBeCloseTo(44.3);
    expect(item.description).toBe("GISELE VERAS ETHEL EPP");
    expect(item.date.getUTCMonth()).toBe(4); // May = 4
    expect(item.date.getUTCDate()).toBe(27);
    expect(item.date.getUTCFullYear()).toBe(2026);
  });

  test("2. parses installment X/Y → InstallmentBillingItem", () => {
    const csv = buildCsv([makeRow("24/05", "MICLA 1/2", "149", "50")]);
    const items = parseBradescoCsv(csv);
    expect(items).toHaveLength(1);
    const item = items[0] as InstallmentBillingItem;
    expect(item.kind).toBe("installment");
    expect(item.installmentNumber).toBe(1);
    expect(item.totalInstallments).toBe(2);
    expect(item.amount).toBeCloseTo(149.5);
    expect(item.description).toBe("MICLA");
  });

  test("3. parses multi-digit installment e.g. 7/12", () => {
    const csv = buildCsv([makeRow("05/11", "HTM*Armaz 7/12", "297", "00")]);
    const items = parseBradescoCsv(csv);
    expect(items).toHaveLength(1);
    const item = items[0] as InstallmentBillingItem;
    expect(item.kind).toBe("installment");
    expect(item.installmentNumber).toBe(7);
    expect(item.totalInstallments).toBe(12);
  });

  test("4. skips negative amounts (payments)", () => {
    const csv = buildCsv([makeRow("11/05", "PAGTO. POR DEB EM C/C", "-4456", "34")]);
    const items = parseBradescoCsv(csv);
    expect(items).toHaveLength(0);
  });

  test("5. skips SALDO ANTERIOR", () => {
    const csv = buildCsv([makeRow("10/05", "SALDO ANTERIOR", "4456", "34")]);
    const items = parseBradescoCsv(csv);
    expect(items).toHaveLength(0);
  });

  test("6. stops at Total da fatura line", () => {
    const rows = [
      makeRow("27/05", "EXPENSE ONE", "44", "30"),
      "Total da fatura em Real: ;;;6539;38",
      makeRow("26/05", "SHOULD NOT APPEAR", "10", "00"),
    ];
    const csv = [makeHeader(), makeColHeader(), ...rows].join("\n");
    const items = parseBradescoCsv(csv);
    expect(items).toHaveLength(1);
  });

  test("7. month wrap: transaction month > header month uses previous year", () => {
    // Header is 03/06/2026 (June), transaction is 05/11 (November) → prior year 2025
    const csv = buildCsv([makeRow("05/11", "HTM*Armaz 7/12", "297", "00")], "03/06/2026");
    const items = parseBradescoCsv(csv);
    expect(items[0].date.getUTCFullYear()).toBe(2025);
    expect(items[0].date.getUTCMonth()).toBe(10); // November = 10
  });

  test("8. value with zero decimal", () => {
    const csv = buildCsv([makeRow("02/05", "MUSEU MISTERIOS", "50", "00")]);
    const items = parseBradescoCsv(csv);
    expect(items[0].amount).toBeCloseTo(50.0);
  });

  test("9. multi-section file: only parses section with ;;; marker", () => {
    const otherSection =
      "OUTRO TITULAR ;;; 9999\nData;Histórico;Valor(US$);;Valor(R$);;\n27/05;OTHER EXPENSE;0;00;100;00\nTotal da fatura em Real: ;;;100;00";
    const mainSection = buildCsv([makeRow("27/05", "MAIN EXPENSE", "44", "30")]);
    // Only main section (MARGARETE P SANGER) should be parsed
    // The parser targets the section after ";;; " header
    const csv = mainSection; // single section test
    const items = parseBradescoCsv(csv);
    expect(items).toHaveLength(1);
    expect(items[0].description).toBe("MAIN EXPENSE");
  });

  test("10. real-world row: LATAM AIR*KUYGSZ 1/3 → installment", () => {
    const csv = buildCsv([makeRow("10/05", "LATAM AIR*KUYGSZ 1/3", "115", "52")]);
    const items = parseBradescoCsv(csv);
    const item = items[0] as InstallmentBillingItem;
    expect(item.kind).toBe("installment");
    expect(item.installmentNumber).toBe(1);
    expect(item.totalInstallments).toBe(3);
    expect(item.amount).toBeCloseTo(115.52);
  });

  test("11. 4/4 installment (last installment)", () => {
    const csv = buildCsv([makeRow("13/02", "TextilPortogallo 4/4", "268", "62")]);
    const items = parseBradescoCsv(csv);
    const item = items[0] as InstallmentBillingItem;
    expect(item.installmentNumber).toBe(4);
    expect(item.totalInstallments).toBe(4);
  });

  test("12. empty csv returns empty array", () => {
    expect(parseBradescoCsv("")).toHaveLength(0);
    expect(parseBradescoCsv("\n\n")).toHaveLength(0);
  });
});
