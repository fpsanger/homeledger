import type { NextRequest } from "next/server";
import { getMonthlyViewUseCase } from "../../../application/use-cases/GetMonthlyViewUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

type MonthlyViewQuery = {
  year: number;
  month: number;
  personId: string | undefined;
  filterBy: "purchaseDate" | "transactionMonth" | "dueMonth";
};

function parseMonthlyViewQuery(searchParams: URLSearchParams): MonthlyViewQuery | Response {
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");

  if (!yearParam || !monthParam) {
    return Response.json({ error: "year and month query params are required" }, { status: 400 });
  }

  const year = Number(yearParam);
  const month = Number(monthParam);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return Response.json(
      { error: "year must be an integer and month must be 1-12" },
      { status: 400 },
    );
  }

  const personId = searchParams.get("personId") ?? undefined;
  const filterByParam = searchParams.get("filterBy");
  const filterBy =
    filterByParam === "purchaseDate"
      ? ("purchaseDate" as const)
      : filterByParam === "transactionMonth"
        ? ("transactionMonth" as const)
        : ("dueMonth" as const);

  return { year, month, personId, filterBy };
}

export async function GET(request: NextRequest) {
  try {
    const query = parseMonthlyViewQuery(request.nextUrl.searchParams);
    if (query instanceof Response) return query;

    const { transaction, creditCardPurchase, recurring } = createRepositories();
    const result = await getMonthlyViewUseCase(query, transaction, creditCardPurchase, recurring);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
