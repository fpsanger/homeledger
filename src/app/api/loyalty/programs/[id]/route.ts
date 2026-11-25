import type { NextRequest } from "next/server";
import { deleteLoyaltyProgramUseCase } from "../../../../../application/use-cases/loyalty/DeleteLoyaltyProgramUseCase";
import { updateLoyaltyProgramUseCase } from "../../../../../application/use-cases/loyalty/UpdateLoyaltyProgramUseCase";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";
import { pickReferenceFields, validateReferenceBody } from "../../_lib/referenceBody";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const referenceError = validateReferenceBody(body);
    if (referenceError) {
      return Response.json({ error: referenceError }, { status: 400 });
    }
    const { loyaltyProgram } = createRepositories();
    const result = await updateLoyaltyProgramUseCase(
      {
        id,
        name: body.name,
        type: body.type,
        color: body.color,
        ...pickReferenceFields(body),
      },
      loyaltyProgram,
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { loyaltyProgram, loyaltyTransaction } = createRepositories();
    await deleteLoyaltyProgramUseCase(id, loyaltyProgram, loyaltyTransaction);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
