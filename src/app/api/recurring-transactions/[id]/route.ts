import type { NextRequest } from "next/server";
import { updateRecurringTransactionUseCase } from "../../../../application/use-cases/UpdateRecurringTransactionUseCase";
import { NotFoundError } from "../../../../domain/errors";
import { parseYearMonth } from "../../_lib/date";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { recurring } = createRepositories();
    const rule = await recurring.findById(params.id);
    if (!rule) throw new NotFoundError("Recurring transaction not found");
    return Response.json(rule);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    const effectiveFrom = parseYearMonth(body.effectiveFrom, "effectiveFrom");
    if (effectiveFrom.error) {
      return Response.json({ error: effectiveFrom.error }, { status: 400 });
    }
    if (!effectiveFrom.value) {
      return Response.json({ error: "effectiveFrom is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (body.amount !== undefined) {
      if (typeof body.amount !== "number") {
        return Response.json({ error: "amount must be a number" }, { status: 400 });
      }
      updates.amount = body.amount;
    }
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
        effectiveFrom: effectiveFrom.value,
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
