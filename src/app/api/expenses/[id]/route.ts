import { NextRequest } from "next/server";
import { deleteTransactionUseCase } from "../../../../application/use-cases/DeleteTransactionUseCase";
import { updateExpenseUseCase } from "../../../../application/use-cases/UpdateExpenseUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

const VALID_PAYMENT_METHODS = ["CASH", "DEBIT_CARD", "CREDIT_CARD", "PIX", "BANK_TRANSFER", "BOLETO", "ACCOUNT_DEBIT"] as const;
type PaymentMethod = typeof VALID_PAYMENT_METHODS[number];

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { personId, amount, date, paymentMethod, categoryId = null, description = "" } = body;

    if (!personId) return new Response(JSON.stringify({ error: "personId is required" }), { status: 400 });
    if (typeof amount !== "number") return new Response(JSON.stringify({ error: "amount must be a number" }), { status: 400 });
    if (!date) return new Response(JSON.stringify({ error: "date is required" }), { status: 400 });
    if (!paymentMethod) return new Response(JSON.stringify({ error: "paymentMethod is required" }), { status: 400 });

    const { transaction, category } = createRepositories();
    await updateExpenseUseCase(
      { id: params.id, personId, amount, date: new Date(date), paymentMethod: paymentMethod as PaymentMethod, categoryId, description },
      transaction,
      category,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { transaction } = createRepositories();
    await deleteTransactionUseCase(params.id, transaction);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
