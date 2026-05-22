import { NextRequest } from "next/server";
import { getCreditCardBillUseCase } from "../../../../application/use-cases/GetCreditCardBillUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? "");
    const month = parseInt(searchParams.get("month") ?? "");
    if (!year || !month)
      return Response.json({ error: "year and month are required" }, { status: 400 });

    const personId = searchParams.get("personId") ?? undefined;
    const { creditCard, creditCardPurchase } = createRepositories();
    const bill = await getCreditCardBillUseCase(
      { year, month, personId },
      creditCard,
      creditCardPurchase,
    );
    return Response.json({ bill });
  } catch (error) {
    return errorResponse(error);
  }
}
