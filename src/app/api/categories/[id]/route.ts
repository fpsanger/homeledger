import { NextRequest } from "next/server";
import { deleteCategoryUseCase } from "../../../../application/use-cases/DeleteCategoryUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { category } = createRepositories();
    await deleteCategoryUseCase(params.id, category);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
