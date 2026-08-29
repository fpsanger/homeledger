import type { NextRequest } from "next/server";
import { deleteCategoryUseCase } from "../../../../application/use-cases/DeleteCategoryUseCase";
import { updateCategoryUseCase } from "../../../../application/use-cases/UpdateCategoryUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    const { category } = createRepositories();
    const result = await updateCategoryUseCase(
      {
        id: params.id,
        name: body.name,
        parentId: body.parentId ?? null,
        householdId: "default",
      },
      category,
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { category } = createRepositories();
    await deleteCategoryUseCase(params.id, category);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
