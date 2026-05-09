import { NextRequest } from "next/server";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { creditCardPurchase } = createRepositories();
    await creditCardPurchase.deletePurchase(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { description, totalAmount, purchaseDate, categoryId, creditCardId } = body;

    if (typeof totalAmount !== "number" || !purchaseDate) {
      return Response.json({ error: "totalAmount and purchaseDate are required" }, { status: 400 });
    }

    const { creditCardPurchase } = createRepositories();
    await creditCardPurchase.updatePurchase(params.id, {
      description: description ?? "",
      totalAmount,
      purchaseDate: new Date(purchaseDate),
      categoryId: categoryId ?? null,
      creditCardId: creditCardId ?? null,
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
