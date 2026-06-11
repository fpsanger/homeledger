import { NextRequest } from "next/server";
import { createLoyaltyTransactionUseCase } from "../../../../application/use-cases/loyalty/CreateLoyaltyTransactionUseCase";
import { parseDateUTC } from "../../_lib/date";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";
import type { LoyaltyTransactionType } from "../../../../domain/entities/LoyaltyTransaction";

const VALID_TYPES: LoyaltyTransactionType[] = ["PURCHASE", "EARN", "BONUS", "REDEEM", "EXPIRE", "ADJUSTMENT"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.programId) {
      return Response.json({ error: "programId is required" }, { status: 400 });
    }
    if (!VALID_TYPES.includes(body.type)) {
      return Response.json({ error: `type must be one of ${VALID_TYPES.join(", ")}` }, { status: 400 });
    }
    if (typeof body.points !== "number") {
      return Response.json({ error: "points is required" }, { status: 400 });
    }
    if (!body.date) {
      return Response.json({ error: "date is required" }, { status: 400 });
    }
    const { loyaltyTransaction } = createRepositories();
    const result = await createLoyaltyTransactionUseCase(
      {
        id: crypto.randomUUID(),
        programId: body.programId,
        personId: body.personId ?? null,
        type: body.type,
        points: body.points,
        date: parseDateUTC(body.date),
        description: body.description ?? null,
        expiresAt: body.expiresAt ? parseDateUTC(body.expiresAt) : null,
        costBrl: body.costBrl ?? null,
        valueBrl: body.valueBrl ?? null,
      },
      loyaltyTransaction,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
