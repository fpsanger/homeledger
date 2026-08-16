import type { NextRequest } from "next/server";
import { createLoyaltyProgramUseCase } from "../../../../application/use-cases/loyalty/CreateLoyaltyProgramUseCase";
import { listLoyaltyProgramsUseCase } from "../../../../application/use-cases/loyalty/ListLoyaltyProgramsUseCase";
import type { LoyaltyProgramType } from "../../../../domain/entities/LoyaltyProgram";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

const VALID_TYPES: LoyaltyProgramType[] = ["AIRLINE", "HOTEL", "BANK", "OTHER"];

export async function GET() {
  try {
    const { loyaltyProgram } = createRepositories();
    const programs = await listLoyaltyProgramsUseCase(loyaltyProgram);
    return Response.json({ programs });
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
    if (!VALID_TYPES.includes(body.type)) {
      return Response.json(
        { error: "type must be one of AIRLINE, HOTEL, BANK, OTHER" },
        { status: 400 },
      );
    }
    if (typeof body.color !== "string" || !body.color.trim()) {
      return Response.json({ error: "color is required" }, { status: 400 });
    }
    const { loyaltyProgram } = createRepositories();
    const result = await createLoyaltyProgramUseCase(
      { id: crypto.randomUUID(), name: body.name, type: body.type, color: body.color },
      loyaltyProgram,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
