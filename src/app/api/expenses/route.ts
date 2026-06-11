import { NextRequest } from "next/server";
import { createExpenseUseCase } from "../../../application/use-cases/CreateExpenseUseCase";
import type { TransactionRecord } from "../../../domain/repositories/ITransactionRepository";
import { parseDateUTC } from "../_lib/date";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

const VALID_PAYMENT_METHODS: TransactionRecord["paymentMethod"][] = [
  "CASH",
  "DEBIT_CARD",
  "CREDIT_CARD",
  "PIX",
  "BANK_TRANSFER",
  "BOLETO",
  "ACCOUNT_DEBIT",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.personId) return Response.json({ error: "personId is required" }, { status: 400 });
    if (typeof body.amount !== "number")
      return Response.json({ error: "amount must be a number" }, { status: 400 });
    if (!body.date) return Response.json({ error: "date is required" }, { status: 400 });
    if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return Response.json({ error: "invalid paymentMethod" }, { status: 400 });
    }

    const { transaction, category } = createRepositories();
    const result = await createExpenseUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        amount: body.amount,
        date: parseDateUTC(body.date),
        description: body.description ?? "",
        paymentMethod: body.paymentMethod,
        categoryId: body.categoryId ?? null,
      },
      transaction,
      category,
    );
    return Response.json({ ...result.record, isDuplicate: result.isDuplicate }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
