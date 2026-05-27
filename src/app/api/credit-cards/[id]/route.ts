import { NextRequest } from "next/server";
import { updateCreditCardUseCase } from "../../../../application/use-cases/UpdateCreditCardUseCase";
import { deleteCreditCardUseCase } from "../../../../application/use-cases/DeleteCreditCardUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { creditCard } = createRepositories();
    const card = await updateCreditCardUseCase(
      {
        id: params.id,
        name: body.name,
        closureType: body.closureType,
        fixedClosureDay: body.fixedClosureDay ?? null,
        fixedClosurePreviousMonth: body.fixedClosurePreviousMonth ?? false,
        dueDayOfMonth: body.dueDayOfMonth,
        alwaysNextMonth: body.alwaysNextMonth ?? false,
        closureNextMonth: body.closureNextMonth ?? false,
      },
      creditCard,
    );
    return Response.json(card);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCard } = createRepositories();
    await deleteCreditCardUseCase(params.id, creditCard);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
