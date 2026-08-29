import type {
  InstallmentBillingItem,
  TransactionBillingItem,
} from "../../../src/domain/entities/BillingItem";
import { parseBtgCsv } from "../../../src/infrastructure/parsing/BtgCsvParser";

// BTG CSV uses ',' as delimiter.
// Billing month/year extracted from header line "Junho/2026".
// Transaction data starts after "Total de compras e despesas" row + column header row.
// Columns: [0]=empty, [1]=DD/MM date, [2]=description, [3]=empty, [4]=R$ amount, [5]=purchase type, [6]=auth, [7]=card

const COLUMN_HEADER = ",Data,Descrição,,Valor,Tipo de compra,Código de autorização,Final Cartão";

function makeHeader(month = "Junho", year = "2026"): string {
  return `,Fatura Cartão de Crédito,,,,,,${month}/${year}`;
}

function makeSectionHeader(total = "R$ 100.00"): string {
  return `,Total de compras e despesas,,,${total},,,`;
}

function makeRow(
  date: string,
  description: string,
  amount: string,
  purchaseType = "Compra à vista",
  authCode = "ABC123",
  card = "7606",
): string {
  return `,${date},${description},,${amount},${purchaseType},${authCode},${card}`;
}

function buildCsv(rows: string[], month = "Junho", year = "2026"): string {
  return [makeHeader(month, year), makeSectionHeader(), COLUMN_HEADER, ...rows].join("\n");
}

describe("parseBtgCsv", () => {
  test("1. parses regular expense → TransactionBillingItem EXPENSE", () => {
    const csv = buildCsv([makeRow("14/05", "Sabesp", "R$ 868.68")]);
    const items = parseBtgCsv(csv);
    expect(items).toHaveLength(1);
    const item = items[0] as TransactionBillingItem;
    expect(item.kind).toBe("transaction");
    expect(item.transactionType).toBe("EXPENSE");
    expect(item.amount).toBeCloseTo(868.68);
    expect(item.description).toBe("Sabesp");
    expect(item.date.getUTCFullYear()).toBe(2026);
    expect(item.date.getUTCMonth()).toBe(4); // May = 4
    expect(item.date.getUTCDate()).toBe(14);
  });

  test("2. parses installment with (X/Y) → InstallmentBillingItem", () => {
    const csv = buildCsv([
      makeRow("09/06", "Amazon Prime (12/12)", "R$ 13.90", "Parcela sem juros"),
    ]);
    const items = parseBtgCsv(csv);
    expect(items).toHaveLength(1);
    const item = items[0] as InstallmentBillingItem;
    expect(item.kind).toBe("installment");
    expect(item.description).toBe("Amazon Prime");
    expect(item.installmentNumber).toBe(12);
    expect(item.totalInstallments).toBe(12);
    expect(item.amount).toBeCloseTo(13.9);
    expect(item.date.getUTCMonth()).toBe(5); // June = 5
  });

  test("3. parses international purchase → TransactionBillingItem EXPENSE", () => {
    const csv = buildCsv([makeRow("16/05", "Openai", "R$ 107.39", "Compra internacional")]);
    const items = parseBtgCsv(csv);
    expect(items).toHaveLength(1);
    const item = items[0] as TransactionBillingItem;
    expect(item.kind).toBe("transaction");
    expect(item.transactionType).toBe("EXPENSE");
    expect(item.amount).toBeCloseTo(107.39);
  });

  test("4. resolves year correctly — tx month after billing month → previous year", () => {
    // Billing month = June 2026; tx in November → Nov 2025
    const csv = buildCsv([makeRow("15/11", "Some Shop", "R$ 50.00")], "Junho", "2026");
    const items = parseBtgCsv(csv);
    expect(items).toHaveLength(1);
    expect(items[0].date.getUTCFullYear()).toBe(2025);
    expect(items[0].date.getUTCMonth()).toBe(10); // November = 10
  });

  test("5. parses multiple rows", () => {
    const csv = buildCsv([
      makeRow("01/05", "Spotify", "R$ 40.90"),
      makeRow("13/05", "Netflix", "R$ 59.90"),
      makeRow("24/03", "Mercado Livre (3/3)", "R$ 277.33", "Parcela sem juros"),
    ]);
    const items = parseBtgCsv(csv);
    expect(items).toHaveLength(3);
    expect(items[0].description).toBe("Spotify");
    expect(items[1].description).toBe("Netflix");
    expect((items[2] as InstallmentBillingItem).kind).toBe("installment");
    expect(items[2].description).toBe("Mercado Livre");
    expect(items[2].date.getUTCMonth()).toBe(2); // March = 2
    expect(items[2].date.getUTCFullYear()).toBe(2026);
  });

  test("6. skips rows with invalid date format", () => {
    const csv = buildCsv([
      makeRow("not-a-date", "Something", "R$ 10.00"),
      makeRow("01/05", "Valid", "R$ 10.00"),
    ]);
    const items = parseBtgCsv(csv);
    expect(items).toHaveLength(1);
    expect(items[0].description).toBe("Valid");
  });

  test("7. returns empty array when section header missing", () => {
    const csv = `,Fatura Cartão de Crédito,,,,,Junho/2026\n,Data,Desc,,Valor\n,01/05,Foo,,R$ 10.00`;
    expect(parseBtgCsv(csv)).toHaveLength(0);
  });

  test("8. returns empty array for empty input", () => {
    expect(parseBtgCsv("")).toHaveLength(0);
    expect(parseBtgCsv("   ")).toHaveLength(0);
  });

  test("9. parses amount with leading space after R$", () => {
    const csv = buildCsv([makeRow("31/05", "Hubla Anajords", "R$ 898.50")]);
    const items = parseBtgCsv(csv);
    expect(items).toHaveLength(1);
    expect(items[0].amount).toBeCloseTo(898.5);
    expect(items[0].description).toBe("Hubla Anajords");
  });
});
