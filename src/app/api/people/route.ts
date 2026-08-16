import type { NextRequest } from "next/server";
import { createPersonUseCase } from "../../../application/use-cases/CreatePersonUseCase";
import { listPeopleUseCase } from "../../../application/use-cases/ListPeopleUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET() {
  try {
    const { person } = createRepositories();
    const people = await listPeopleUseCase(person);
    return Response.json({ people });
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
    const { person } = createRepositories();
    const result = await createPersonUseCase({ id: crypto.randomUUID(), name: body.name }, person);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
