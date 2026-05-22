import { NextRequest } from "next/server";
import { updateIncomeUseCase } from "../../../../application/use-cases/UpdateIncomeUseCase";
import type { IncomeSource } from "../../../../domain/repositories/ITransactionRepository";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

const VALID_SOURCES: IncomeSource[] = ["SALARY", "FREELANCE", "RENTAL", "INVESTMENT", "OTHER"];

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { personId, amount, date, source, categoryId = null, description = "" } = body;

    if (!personId)
      return new Response(JSON.stringify({ error: "personId is required" }), { status: 400 });
    if (typeof amount !== "number")
      return new Response(JSON.stringify({ error: "amount must be a number" }), { status: 400 });
    if (!date) return new Response(JSON.stringify({ error: "date is required" }), { status: 400 });
    if (!source)
      return new Response(JSON.stringify({ error: "source is required" }), { status: 400 });

    const { transaction, category } = createRepositories();
    await updateIncomeUseCase(
      {
        id: params.id,
        personId,
        amount,
        date: new Date(date),
        source: source as IncomeSource,
        categoryId,
        description,
      },
      transaction,
      category,
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
