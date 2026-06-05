import { parseStatementUseCase } from "../../../src/application/use-cases/ParseStatementUseCase";
import type { IStatementParser } from "../../../src/domain/repositories/IStatementParser";
import type { BillingItem } from "../../../src/domain/entities/BillingItem";

const makeMockParser = (
  overrides: Partial<IStatementParser> = {},
): IStatementParser => ({
  parse: async () => [],
  ...overrides,
});

describe("parseStatementUseCase", () => {
  it("throws when pdfText is empty string", async () => {
    const parser = makeMockParser();
    await expect(
      parseStatementUseCase(parser, "", "credit-card"),
    ).rejects.toThrow("PDF text is empty");
  });

  it("throws when pdfText is whitespace-only", async () => {
    const parser = makeMockParser();
    await expect(
      parseStatementUseCase(parser, "   \n\t  ", "credit-card"),
    ).rejects.toThrow("PDF text is empty");
  });

  it("throws when statementType is invalid", async () => {
    const parser = makeMockParser();
    await expect(
      parseStatementUseCase(parser, "Valid PDF text", "invalid-type" as any),
    ).rejects.toThrow("Invalid statement type");
  });

  it("delegates to parser.parse for valid credit-card statement", async () => {
    const mockItems: BillingItem[] = [
      {
        kind: "transaction",
        description: "Purchase",
        amount: 100,
        date: new Date(),
        transactionType: "EXPENSE",
      },
    ];

    const parseSpy = jest.fn().mockResolvedValue(mockItems);
    const parser = makeMockParser({ parse: parseSpy });

    const result = await parseStatementUseCase(
      parser,
      "PDF text content",
      "credit-card",
    );

    expect(parseSpy).toHaveBeenCalledWith("PDF text content", "credit-card");
    expect(result).toEqual(mockItems);
  });

  it("delegates to parser.parse for valid debit statement", async () => {
    const mockItems: BillingItem[] = [
      {
        kind: "transaction",
        description: "Transfer",
        amount: 50,
        date: new Date(),
        transactionType: "EXPENSE",
      },
    ];

    const parseSpy = jest.fn().mockResolvedValue(mockItems);
    const parser = makeMockParser({ parse: parseSpy });

    const result = await parseStatementUseCase(
      parser,
      "PDF text content",
      "debit",
    );

    expect(parseSpy).toHaveBeenCalledWith("PDF text content", "debit");
    expect(result).toEqual(mockItems);
  });

  it("propagates parser errors", async () => {
    const parserError = new Error("Parser failed");
    const parseSpy = jest.fn().mockRejectedValue(parserError);
    const parser = makeMockParser({ parse: parseSpy });

    await expect(
      parseStatementUseCase(parser, "PDF text content", "credit-card"),
    ).rejects.toThrow("Parser failed");
  });
});
