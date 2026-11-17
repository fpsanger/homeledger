import type { NextRequest } from "next/server";
import { discardPendingTransactionUseCase } from "../../../../../application/use-cases/ConfirmPendingTransactionUseCase";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { pendingTransaction } = createRepositories();
    await discardPendingTransactionUseCase(params.id, pendingTransaction);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
