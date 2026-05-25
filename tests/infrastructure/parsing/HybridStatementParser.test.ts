import { createHybridStatementParser } from "../../../src/infrastructure/parsing/HybridStatementParser"
import * as BillingRegexParser from "../../../src/infrastructure/parsing/BillingRegexParser"
import * as OllamaClassifier from "../../../src/infrastructure/parsing/OllamaClassifier"
import type { RawBillingRow } from "../../../src/infrastructure/parsing/BillingRegexParser"
import type { ClassificationResult } from "../../../src/infrastructure/parsing/OllamaClassifier"

const makeRow = (overrides: Partial<RawBillingRow> = {}): RawBillingRow => ({
  description: "Test transaction",
  amount: 100,
  date: new Date("2024-01-15"),
  rawText: "raw",
  isCredit: false,
  bank: "itau",
  ...overrides,
})

const makeClassificationResult = (
  row: RawBillingRow,
  transactionType: "EXPENSE" | "INCOME" | "INVESTMENT" = "EXPENSE",
): ClassificationResult => ({
  row,
  classification: { transactionType, confidence: "high" },
})

describe("HybridStatementParser", () => {
  let parseBillingTextSpy: jest.SpyInstance
  let classifyRowsSpy: jest.SpyInstance

  beforeEach(() => {
    parseBillingTextSpy = jest.spyOn(BillingRegexParser, "parseBillingText")
    classifyRowsSpy = jest.spyOn(OllamaClassifier, "classifyRows")
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("returns [] when parseBillingText returns 0 rows", async () => {
    parseBillingTextSpy.mockReturnValue({ rows: [], bank: "unknown" })

    const parser = createHybridStatementParser()
    const result = await parser.parse("", "credit-card")

    expect(result).toEqual([])
    expect(classifyRowsSpy).not.toHaveBeenCalled()
  })

  it("maps single expense row to TransactionBillingItem with EXPENSE", async () => {
    const row = makeRow({ isCredit: false })
    parseBillingTextSpy.mockReturnValue({ rows: [row], bank: "itau" })
    classifyRowsSpy.mockResolvedValue([makeClassificationResult(row, "EXPENSE")])

    const parser = createHybridStatementParser()
    const result = await parser.parse("some text", "credit-card")

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      kind: "transaction",
      description: row.description,
      amount: row.amount,
      transactionType: "EXPENSE",
    })
  })

  it("maps single income row to TransactionBillingItem with INCOME", async () => {
    const row = makeRow({ isCredit: true, description: "Estorno compra" })
    parseBillingTextSpy.mockReturnValue({ rows: [row], bank: "itau" })
    classifyRowsSpy.mockResolvedValue([makeClassificationResult(row, "INCOME")])

    const parser = createHybridStatementParser()
    const result = await parser.parse("some text", "credit-card")

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ kind: "transaction", transactionType: "INCOME" })
  })

  it("maps installment row to InstallmentBillingItem", async () => {
    const row = makeRow({ installmentNumber: 2, totalInstallments: 6, description: "TV Samsung" })
    parseBillingTextSpy.mockReturnValue({ rows: [row], bank: "itau" })
    classifyRowsSpy.mockResolvedValue([makeClassificationResult(row, "EXPENSE")])

    const parser = createHybridStatementParser()
    const result = await parser.parse("some text", "credit-card")

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      kind: "installment",
      installmentNumber: 2,
      totalInstallments: 6,
    })
  })

  it("handles mixed rows (expense + installment + income) in order", async () => {
    const expenseRow = makeRow({ description: "Supermercado" })
    const installmentRow = makeRow({ description: "Notebook", installmentNumber: 1, totalInstallments: 12 })
    const incomeRow = makeRow({ description: "Reembolso", isCredit: true })

    parseBillingTextSpy.mockReturnValue({
      rows: [expenseRow, installmentRow, incomeRow],
      bank: "itau",
    })
    classifyRowsSpy.mockResolvedValue([
      makeClassificationResult(expenseRow, "EXPENSE"),
      makeClassificationResult(installmentRow, "EXPENSE"),
      makeClassificationResult(incomeRow, "INCOME"),
    ])

    const parser = createHybridStatementParser()
    const result = await parser.parse("some text", "credit-card")

    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ kind: "transaction", transactionType: "EXPENSE" })
    expect(result[1]).toMatchObject({ kind: "installment", installmentNumber: 1, totalInstallments: 12 })
    expect(result[2]).toMatchObject({ kind: "transaction", transactionType: "INCOME" })
  })

  it("skips row with invalid data (factory throws) and returns the rest", async () => {
    const badRow = makeRow({ description: "", amount: -50 }) // will throw (empty desc + negative amount)
    const goodRow = makeRow({ description: "Valid purchase" })

    parseBillingTextSpy.mockReturnValue({ rows: [badRow, goodRow], bank: "itau" })
    classifyRowsSpy.mockResolvedValue([
      makeClassificationResult(badRow, "EXPENSE"),
      makeClassificationResult(goodRow, "EXPENSE"),
    ])

    const parser = createHybridStatementParser()
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    const result = await parser.parse("some text", "credit-card")

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ description: "Valid purchase" })
    expect(warnSpy).toHaveBeenCalled()
  })

  it("passes custom config (ollamaBaseUrl, model, hintBank) to dependencies", async () => {
    const row = makeRow()
    parseBillingTextSpy.mockReturnValue({ rows: [row], bank: "bradesco" })
    classifyRowsSpy.mockResolvedValue([makeClassificationResult(row, "EXPENSE")])

    const parser = createHybridStatementParser({
      ollamaBaseUrl: "http://custom:9999",
      model: "mistral",
      hintBank: "bradesco",
    })
    await parser.parse("some text", "credit-card")

    expect(parseBillingTextSpy).toHaveBeenCalledWith("some text", "bradesco")
    expect(classifyRowsSpy).toHaveBeenCalledWith(
      expect.any(Array),
      "http://custom:9999",
      "mistral",
    )
  })

  it("statementType is accepted but does not change parsing behavior", async () => {
    const row = makeRow()
    parseBillingTextSpy.mockReturnValue({ rows: [row], bank: "itau" })
    classifyRowsSpy.mockResolvedValue([makeClassificationResult(row, "EXPENSE")])

    const parser = createHybridStatementParser()

    const creditResult = await parser.parse("text", "credit-card")
    const debitResult = await parser.parse("text", "debit")

    expect(creditResult).toHaveLength(1)
    expect(debitResult).toHaveLength(1)
    expect(creditResult[0]).toMatchObject({ kind: "transaction" })
    expect(debitResult[0]).toMatchObject({ kind: "transaction" })
  })
})
