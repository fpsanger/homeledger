import type { NextRequest } from "next/server";
import { deleteCreditCardClosureUseCase } from "../../../../../application/use-cases/DeleteCreditCardClosureUseCase";
import { setCreditCardClosureUseCase } from "../../../../../application/use-cases/SetCreditCardClosureUseCase";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (!body.year || !body.month || !body.closureDay)
      return Response.json({ error: "year, month, and closureDay are required" }, { status: 400 });

    const { creditCard } = createRepositories();
    const closure = await setCreditCardClosureUseCase(
      {
        creditCardId: params.id,
        year: body.year,
        month: body.month,
        closureDay: body.closureDay,
        previousMonth: body.previousMonth ?? false,
      },
      creditCard,
    );
    return Response.json(closure, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (!body.year || !body.month)
      return Response.json({ error: "year and month are required" }, { status: 400 });

    const { creditCard } = createRepositories();
    await deleteCreditCardClosureUseCase(
      { creditCardId: params.id, year: body.year, month: body.month },
      creditCard,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCard } = createRepositories();
    const closures = await creditCard.findClosuresByCard(params.id);
    return Response.json({ closures });
  } catch (error) {
    return errorResponse(error);
  }
}
