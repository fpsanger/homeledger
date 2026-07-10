import { NextRequest } from "next/server";
import { createCreditCardRefundUseCase } from "../../../application/use-cases/CreateCreditCardRefundUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.personId) return Response.json({ error: "personId is required" }, { status: 400 });
    if (!body.creditCardId)
      return Response.json({ error: "creditCardId is required" }, { status: 400 });
    if (typeof body.amount !== "number")
      return Response.json({ error: "amount must be a number" }, { status: 400 });
    if (!body.refundDate)
      return Response.json({ error: "refundDate is required" }, { status: 400 });

    const { creditCardRefund, creditCard } = createRepositories();
    const refund = await createCreditCardRefundUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        creditCardId: body.creditCardId,
        description: body.description ?? "",
        amount: body.amount,
        refundDate: new Date(body.refundDate),
        categoryId: body.categoryId ?? null,
        source: body.source === "IMPORT" ? "IMPORT" : "MANUAL",
      },
      creditCardRefund,
      creditCard,
    );
    return Response.json(refund, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
