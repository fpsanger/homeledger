import { NextRequest } from "next/server";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { amount, description } = body;

    if (typeof amount !== "number")
      return new Response(JSON.stringify({ error: "amount must be a number" }), { status: 400 });

    const { creditCardPurchase } = createRepositories();
    await creditCardPurchase.updateInstallment(params.id, {
      amount,
      description: description ?? "",
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCardPurchase } = createRepositories();
    await creditCardPurchase.deleteInstallment(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
