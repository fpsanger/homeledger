import type { NextRequest } from "next/server";
import { createCategoryUseCase } from "../../../application/use-cases/CreateCategoryUseCase";
import { listCategoriesUseCase } from "../../../application/use-cases/ListCategoriesUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET() {
  try {
    const { category } = createRepositories();
    const categories = await listCategoriesUseCase(category);
    return Response.json({ categories });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }
    const { category } = createRepositories();
    const result = await createCategoryUseCase(
      {
        id: crypto.randomUUID(),
        name: body.name,
        parentId: body.parentId ?? null,
        householdId: "default",
      },
      category,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
