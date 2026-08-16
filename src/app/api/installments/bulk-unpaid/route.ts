import { type NextRequest, NextResponse } from "next/server";
import { markInstallmentsUnpaidUseCase } from "../../../../application/use-cases/MarkInstallmentsUnpaidUseCase";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids: unknown = body?.ids;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
      return NextResponse.json({ error: "ids must be an array of strings" }, { status: 400 });
    }
    const { creditCardPurchase } = createRepositories();
    await markInstallmentsUnpaidUseCase(ids as string[], creditCardPurchase);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
