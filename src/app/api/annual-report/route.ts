import { NextRequest } from "next/server";
import { getAnnualReportUseCase } from "../../../application/use-cases/GetAnnualReportUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const yearParam = searchParams.get("year");

    if (!yearParam) {
      return Response.json({ error: "year query param is required" }, { status: 400 });
    }

    const year = Number(yearParam);

    if (!Number.isInteger(year)) {
      return Response.json({ error: "year must be an integer" }, { status: 400 });
    }

    const personId = searchParams.get("personId") ?? undefined;

    const { transaction, creditCardPurchase } = createRepositories();
    const result = await getAnnualReportUseCase({ year, personId }, transaction, creditCardPurchase);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
