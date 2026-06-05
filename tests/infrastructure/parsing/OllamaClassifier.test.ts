import { classifyRows, ClassificationResult } from "../../../src/infrastructure/parsing/OllamaClassifier"
import { RawBillingRow } from "../../../src/infrastructure/parsing/BillingRegexParser"

function makeRow(overrides: Partial<RawBillingRow> = {}): RawBillingRow {
  return {
    description: "Supermercado",
    amount: 100,
    date: new Date("2024-01-15"),
    rawText: "15/01 Supermercado R$ 100,00",
    isCredit: false,
    bank: "itau",
    ...overrides,
  }
}

function mockFetchSuccess(classifications: { index: number; transactionType: string; confidence: string }[]) {
  return jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({ classifications }),
          },
        },
      ],
    }),
  } as unknown as Response)
}

describe("OllamaClassifier", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  // Test 1: Empty rows → returns [] without calling fetch
  it("returns empty array for empty input without calling fetch", async () => {
    const fetchSpy = jest.spyOn(global, "fetch")
    const result = await classifyRows([])
    expect(result).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  // Test 2: Single expense row → calls Ollama, returns EXPENSE classification
  it("classifies a single expense row as EXPENSE", async () => {
    const row = makeRow({ description: "Supermercado", isCredit: false })
    mockFetchSuccess([{ index: 0, transactionType: "EXPENSE", confidence: "high" }])

    const result = await classifyRows([row])
    expect(result).toHaveLength(1)
    expect(result[0].classification.transactionType).toBe("EXPENSE")
    expect(result[0].classification.confidence).toBe("high")
    expect(result[0].row).toBe(row)
  })

  // Test 3: Single credit row → Ollama returns INCOME
  it("classifies a credit row as INCOME when Ollama says so", async () => {
    const row = makeRow({ description: "Pagamento recebido", isCredit: true })
    mockFetchSuccess([{ index: 0, transactionType: "INCOME", confidence: "high" }])

    const result = await classifyRows([row])
    expect(result[0].classification.transactionType).toBe("INCOME")
    expect(result[0].classification.confidence).toBe("high")
  })

  // Test 4: Batch: multiple rows in one fetch call
  it("sends all rows in a single fetch call and returns all classifications", async () => {
    const rows = [
      makeRow({ description: "Supermercado", isCredit: false }),
      makeRow({ description: "Estorno", isCredit: true }),
      makeRow({ description: "CDB Investimento", isCredit: false }),
    ]
    const fetchSpy = mockFetchSuccess([
      { index: 0, transactionType: "EXPENSE", confidence: "high" },
      { index: 1, transactionType: "INCOME", confidence: "high" },
      { index: 2, transactionType: "INVESTMENT", confidence: "high" },
    ])

    const result = await classifyRows(rows)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(result).toHaveLength(3)
    expect(result[0].classification.transactionType).toBe("EXPENSE")
    expect(result[1].classification.transactionType).toBe("INCOME")
    expect(result[2].classification.transactionType).toBe("INVESTMENT")
  })

  // Test 5: Fetch throws (ECONNREFUSED) → fallback: isCredit=false → EXPENSE
  it("falls back to EXPENSE when fetch throws and isCredit is false", async () => {
    const row = makeRow({ isCredit: false })
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("ECONNREFUSED"))

    const result = await classifyRows([row])
    expect(result[0].classification.transactionType).toBe("EXPENSE")
    expect(result[0].classification.confidence).toBe("low")
  })

  // Test 6: Fetch throws → fallback: isCredit=true → INCOME
  it("falls back to INCOME when fetch throws and isCredit is true", async () => {
    const row = makeRow({ isCredit: true })
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("ECONNREFUSED"))

    const result = await classifyRows([row])
    expect(result[0].classification.transactionType).toBe("INCOME")
    expect(result[0].classification.confidence).toBe("low")
  })

  // Test 7: Non-200 response → fallback classification
  it("falls back when Ollama returns non-200 response", async () => {
    const row = makeRow({ isCredit: false })
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response)

    const result = await classifyRows([row])
    expect(result[0].classification.transactionType).toBe("EXPENSE")
    expect(result[0].classification.confidence).toBe("low")
  })

  // Test 8: Ollama returns invalid JSON → fallback
  it("falls back when Ollama returns invalid JSON", async () => {
    const row = makeRow({ isCredit: true })
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => { throw new SyntaxError("invalid json") },
    } as unknown as Response)

    const result = await classifyRows([row])
    expect(result[0].classification.transactionType).toBe("INCOME")
    expect(result[0].classification.confidence).toBe("low")
  })

  // Test 9: Ollama returns JSON missing "classifications" field → fallback (zod validation fails)
  it("falls back when Ollama response is missing classifications field", async () => {
    const row = makeRow({ isCredit: false })
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ results: [] }), // missing "classifications"
            },
          },
        ],
      }),
    } as unknown as Response)

    const result = await classifyRows([row])
    expect(result[0].classification.transactionType).toBe("EXPENSE")
    expect(result[0].classification.confidence).toBe("low")
  })

  // Test 10: Custom ollamaBaseUrl used in fetch URL
  it("uses custom ollamaBaseUrl in the fetch call", async () => {
    const row = makeRow({ isCredit: false })
    const fetchSpy = mockFetchSuccess([{ index: 0, transactionType: "EXPENSE", confidence: "high" }])

    await classifyRows([row], "http://custom-host:9999")
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://custom-host:9999/v1/chat/completions",
      expect.any(Object),
    )
  })

  // Test 11: Custom model sent in request body
  it("sends custom model in request body", async () => {
    const row = makeRow({ isCredit: false })
    const fetchSpy = mockFetchSuccess([{ index: 0, transactionType: "EXPENSE", confidence: "high" }])

    await classifyRows([row], undefined, "mistral")
    const callArgs = fetchSpy.mock.calls[0]
    const body = JSON.parse(callArgs[1]?.body as string)
    expect(body.model).toBe("mistral")
  })
})
