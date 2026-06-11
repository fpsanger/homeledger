import { NextRequest } from "next/server";
import { updateLoyaltyTransactionUseCase } from "../../../../../application/use-cases/loyalty/UpdateLoyaltyTransactionUseCase";
import { deleteLoyaltyTransactionUseCase } from "../../../../../application/use-cases/loyalty/DeleteLoyaltyTransactionUseCase";
import { parseDateUTC } from "../../../_lib/date";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { loyaltyTransaction } = createRepositories();
    const result = await updateLoyaltyTransactionUseCase(
      {
        id,
        points: body.points,
        date: body.date ? parseDateUTC(body.date) : undefined,
        description: body.description,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? parseDateUTC(body.expiresAt) : null) : undefined,
        costBrl: body.costBrl,
        valueBrl: body.valueBrl,
      },
      loyaltyTransaction,
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { loyaltyTransaction } = createRepositories();
    await deleteLoyaltyTransactionUseCase(id, loyaltyTransaction);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
