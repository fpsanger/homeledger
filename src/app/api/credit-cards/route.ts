import { NextRequest } from "next/server";
import { createCreditCardUseCase } from "../../../application/use-cases/CreateCreditCardUseCase";
import { listCreditCardsUseCase } from "../../../application/use-cases/ListCreditCardsUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET() {
  try {
    const { creditCard } = createRepositories();
    const cards = await listCreditCardsUseCase(creditCard);
    return Response.json({ cards });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) return Response.json({ error: "name is required" }, { status: 400 });
    if (!body.closureType)
      return Response.json({ error: "closureType is required" }, { status: 400 });
    if (!body.dueDayOfMonth)
      return Response.json({ error: "dueDayOfMonth is required" }, { status: 400 });

    const { creditCard } = createRepositories();
    const card = await createCreditCardUseCase(
      {
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
    return Response.json(card, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
