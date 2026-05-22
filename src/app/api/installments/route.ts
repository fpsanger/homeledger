import { NextRequest } from "next/server";
import { createInstallmentPurchaseUseCase } from "../../../application/use-cases/CreateInstallmentPurchaseUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.personId) return Response.json({ error: "personId is required" }, { status: 400 });
    if (typeof body.totalAmount !== "number") return Response.json({ error: "totalAmount must be a number" }, { status: 400 });
    if (typeof body.numberOfInstallments !== "number" || body.numberOfInstallments < 1) {
      return Response.json({ error: "numberOfInstallments must be a positive integer" }, { status: 400 });
    }
    if (!body.purchaseDate) return Response.json({ error: "purchaseDate is required" }, { status: 400 });
    if (!body.creditCardId) return Response.json({ error: "creditCardId is required" }, { status: 400 });

    const { creditCardPurchase, creditCard } = createRepositories();
    const result = await createInstallmentPurchaseUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        totalAmount: body.totalAmount,
        numberOfInstallments: body.numberOfInstallments,
        purchaseDate: new Date(body.purchaseDate),
        description: body.description ?? "",
        categoryId: body.categoryId ?? null,
        creditCardId: body.creditCardId,
      },
      creditCardPurchase,
      creditCard,
    );
    return Response.json({ ...result.record, isDuplicate: result.isDuplicate }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
