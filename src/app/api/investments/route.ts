import { NextRequest } from "next/server";
import { createInvestmentUseCase } from "../../../application/use-cases/CreateInvestmentUseCase";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.personId) return Response.json({ error: "personId is required" }, { status: 400 });
    if (typeof body.amount !== "number") return Response.json({ error: "amount must be a number" }, { status: 400 });
    if (!body.date) return Response.json({ error: "date is required" }, { status: 400 });
    if (!body.categoryId) return Response.json({ error: "categoryId is required" }, { status: 400 });

    const { transaction, category } = createRepositories();
    const result = await createInvestmentUseCase(
      {
        id: crypto.randomUUID(),
        personId: body.personId,
        amount: body.amount,
        date: new Date(body.date),
        description: body.description ?? "",
        categoryId: body.categoryId,
      },
      transaction,
      category,
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
