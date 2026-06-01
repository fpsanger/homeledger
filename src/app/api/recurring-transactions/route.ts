import { NextRequest } from "next/server";
import { createRecurringTransactionUseCase } from "../../../application/use-cases/CreateRecurringTransactionUseCase";
import type { RecurringTransactionRecord } from "../../../domain/repositories/IRecurringTransactionRepository";
import type { TransactionRecord } from "../../../domain/repositories/ITransactionRepository";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

const VALID_TYPES: RecurringTransactionRecord["type"][] = ["INCOME", "EXPENSE"];
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
    if (!VALID_TYPES.includes(body.type))
      return Response.json({ error: "type must be INCOME or EXPENSE" }, { status: 400 });
    if (typeof body.amount !== "number")
      return Response.json({ error: "amount must be a number" }, { status: 400 });
    if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return Response.json({ error: "invalid paymentMethod" }, { status: 400 });
    }
    if (!body.startDate) return Response.json({ error: "startDate is required" }, { status: 400 });

    const { recurring } = createRepositories();
    const result = await createRecurringTransactionUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        type: body.type,
        amount: body.amount,
        description: body.description ?? "",
        paymentMethod: body.paymentMethod,
        categoryId: body.categoryId ?? null,
        frequency: "MONTHLY",
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
      recurring,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
