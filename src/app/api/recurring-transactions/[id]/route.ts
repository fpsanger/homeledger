import type { NextRequest } from "next/server";
import { updateRecurringTransactionUseCase } from "../../../../application/use-cases/UpdateRecurringTransactionUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.description !== undefined) updates.description = body.description;
    if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
    if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod;
    if (body.frequency !== undefined) updates.frequency = body.frequency;

    const { recurring } = createRepositories();
    const result = await updateRecurringTransactionUseCase(
      {
        id: params.id,
        newId: crypto.randomUUID(),
        updates,
        today: new Date(),
      },
      recurring,
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { recurring } = createRepositories();
    await recurring.delete(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
