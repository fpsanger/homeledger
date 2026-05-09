import { NextRequest } from "next/server";
import { cancelInstallmentPurchaseUseCase } from "../../../../application/use-cases/CancelInstallmentPurchaseUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { creditCard } = createRepositories();
    await cancelInstallmentPurchaseUseCase(params.id, creditCard);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
