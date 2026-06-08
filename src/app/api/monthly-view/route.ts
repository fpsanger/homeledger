import { NextRequest } from "next/server";
import { getMonthlyViewUseCase } from "../../../application/use-cases/GetMonthlyViewUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
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

    const { transaction, creditCardPurchase, recurring } = createRepositories();
    const result = await getMonthlyViewUseCase(
      { year, month, personId, filterBy },
      transaction,
      creditCardPurchase,
      recurring,
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
