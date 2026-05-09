import { NextRequest } from "next/server";
import { deleteTransactionUseCase } from "../../../../application/use-cases/DeleteTransactionUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { transaction } = createRepositories();
    await deleteTransactionUseCase(params.id, transaction);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
