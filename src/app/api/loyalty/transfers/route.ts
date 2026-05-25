import { NextRequest } from "next/server";
import { createLoyaltyTransferUseCase } from "../../../../application/use-cases/loyalty/CreateLoyaltyTransferUseCase";
import { listLoyaltyTransfersUseCase } from "../../../../application/use-cases/loyalty/ListLoyaltyTransfersUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function GET() {
  try {
    const { loyaltyTransfer } = createRepositories();
    const transfers = await listLoyaltyTransfersUseCase(loyaltyTransfer);
    return Response.json({ transfers });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.fromProgramId) return Response.json({ error: "fromProgramId is required" }, { status: 400 });
    if (!body.toProgramId) return Response.json({ error: "toProgramId is required" }, { status: 400 });
    if (body.fromProgramId === body.toProgramId) {
      return Response.json({ error: "fromProgramId and toProgramId must be different" }, { status: 400 });
    }
    if (typeof body.pointsSent !== "number" || body.pointsSent <= 0) {
      return Response.json({ error: "pointsSent must be a positive number" }, { status: 400 });
    }
    if (typeof body.pointsReceived !== "number" || body.pointsReceived < body.pointsSent) {
      return Response.json({ error: "pointsReceived must be >= pointsSent" }, { status: 400 });
    }
    if (!body.transferDate) return Response.json({ error: "transferDate is required" }, { status: 400 });

    const { loyaltyTransfer, loyaltyTransaction } = createRepositories();
    const result = await createLoyaltyTransferUseCase(
      {
        transferId: crypto.randomUUID(),
        outTxId: crypto.randomUUID(),
        inTxId: crypto.randomUUID(),
        fromProgramId: body.fromProgramId,
        toProgramId: body.toProgramId,
        pointsSent: body.pointsSent,
        pointsReceived: body.pointsReceived,
        costBrl: body.costBrl ?? null,
        transferDate: new Date(body.transferDate),
        personId: body.personId ?? null,
        description: body.description ?? null,
      },
      loyaltyTransfer,
      loyaltyTransaction,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
