import { NextRequest } from "next/server";
import { markInstallmentPaidUseCase } from "../../../../../application/use-cases/MarkInstallmentPaidUseCase";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { creditCardPurchase } = createRepositories();
    await markInstallmentPaidUseCase(params.id, creditCardPurchase);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
