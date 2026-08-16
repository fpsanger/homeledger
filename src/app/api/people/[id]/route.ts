import type { NextRequest } from "next/server";
import { deletePersonUseCase } from "../../../../application/use-cases/DeletePersonUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { person } = createRepositories();
    await deletePersonUseCase(params.id, person);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
