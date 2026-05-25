import { NextRequest } from "next/server";
import { updateLoyaltyProgramUseCase } from "../../../../../application/use-cases/loyalty/UpdateLoyaltyProgramUseCase";
import { deleteLoyaltyProgramUseCase } from "../../../../../application/use-cases/loyalty/DeleteLoyaltyProgramUseCase";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { loyaltyProgram } = createRepositories();
    const result = await updateLoyaltyProgramUseCase({ id, ...body }, loyaltyProgram);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { loyaltyProgram, loyaltyTransaction } = createRepositories();
    await deleteLoyaltyProgramUseCase(id, loyaltyProgram, loyaltyTransaction);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
