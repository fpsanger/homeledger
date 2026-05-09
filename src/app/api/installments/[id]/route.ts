import { NextRequest } from "next/server";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { creditCardPurchase } = createRepositories();
    await creditCardPurchase.deleteInstallment(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
