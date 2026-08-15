import type { NextRequest } from "next/server";
import { createIncomeUseCase } from "../../../application/use-cases/CreateIncomeUseCase";
import type { IncomeSource } from "../../../domain/repositories/ITransactionRepository";
import { parseDateUTC } from "../_lib/date";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

const VALID_SOURCES: IncomeSource[] = ["SALARY", "FREELANCE", "RENTAL", "INVESTMENT", "OTHER"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.personId) return Response.json({ error: "personId is required" }, { status: 400 });
    if (typeof body.amount !== "number")
      return Response.json({ error: "amount must be a number" }, { status: 400 });
    if (!body.date) return Response.json({ error: "date is required" }, { status: 400 });
    if (!VALID_SOURCES.includes(body.source)) {
      return Response.json({ error: "invalid source" }, { status: 400 });
    }

    const { transaction, category } = createRepositories();
    const result = await createIncomeUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        amount: body.amount,
        date: parseDateUTC(body.date),
        description: body.description ?? "",
        source: body.source,
        categoryId: body.categoryId ?? null,
      },
      transaction,
      category,
    );
    return Response.json({ ...result.record, isDuplicate: result.isDuplicate }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
