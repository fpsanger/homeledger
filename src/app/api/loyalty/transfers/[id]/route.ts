import type { NextRequest } from "next/server";
import { deleteLoyaltyTransferUseCase } from "../../../../../application/use-cases/loyalty/DeleteLoyaltyTransferUseCase";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { loyaltyTransfer, loyaltyTransaction } = createRepositories();
    await deleteLoyaltyTransferUseCase(id, loyaltyTransfer, loyaltyTransaction);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
