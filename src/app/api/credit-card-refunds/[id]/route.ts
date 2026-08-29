import type { NextRequest } from "next/server";
import { deleteCreditCardRefundUseCase } from "../../../../application/use-cases/DeleteCreditCardRefundUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCardRefund } = createRepositories();
    await deleteCreditCardRefundUseCase(params.id, creditCardRefund);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
