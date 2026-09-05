import type { NextRequest } from "next/server";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCardPurchase } = createRepositories();
    const purchase = await creditCardPurchase.findPurchaseById(params.id);
    if (!purchase) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ purchase });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCardPurchase } = createRepositories();
    await creditCardPurchase.deletePurchase(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { description, totalAmount, purchaseDate, categoryId, creditCardId } = body;

    if (typeof totalAmount !== "number" || !purchaseDate) {
      return Response.json({ error: "totalAmount and purchaseDate are required" }, { status: 400 });
    }

    const { creditCardPurchase } = createRepositories();

    const [existingPurchase, installments] = await Promise.all([
      creditCardPurchase.findPurchaseById(params.id),
      creditCardPurchase.findByPurchaseId(params.id),
    ]);
    if (!existingPurchase) return Response.json({ error: "Not found" }, { status: 404 });

    const isSplit = new Set(installments.map((i) => i.personId)).size > 1;
    const totalChanged =
      Math.round(totalAmount * 100) !== Math.round(existingPurchase.totalAmount * 100);
    if (isSplit && totalChanged) {
      return Response.json(
        { error: "Editing the total amount of a split purchase is not supported yet" },
        { status: 409 },
      );
    }

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
