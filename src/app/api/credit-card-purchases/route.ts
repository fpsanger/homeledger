import type { NextRequest } from "next/server";
import { getCreditCardPurchasesUseCase } from "../../../application/use-cases/GetCreditCardPurchasesUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId") ?? undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;
    const { creditCardPurchase } = createRepositories();
    let purchases = await getCreditCardPurchasesUseCase(personId, creditCardPurchase);
    if (year !== null && month !== null) {
      purchases = purchases.filter((p) => {
        const d = new Date(p.purchaseDate);
        return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
      });
    }
    return Response.json({ purchases });
  } catch (error) {
    return errorResponse(error);
  }
}
