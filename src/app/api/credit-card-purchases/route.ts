import { NextRequest } from "next/server";
import { getCreditCardPurchasesUseCase } from "../../../application/use-cases/GetCreditCardPurchasesUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId") ?? undefined;
    const { creditCardPurchase } = createRepositories();
    const purchases = await getCreditCardPurchasesUseCase(personId, creditCardPurchase);
    return Response.json({ purchases });
  } catch (error) {
    return errorResponse(error);
  }
}
