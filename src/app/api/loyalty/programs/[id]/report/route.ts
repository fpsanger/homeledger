import { NextRequest } from "next/server";
import { getLoyaltyProgramReportUseCase } from "../../../../../../application/use-cases/loyalty/GetLoyaltyProgramReportUseCase";
import { errorResponse } from "../../../../_lib/errorResponse";
import { createRepositories } from "../../../../_lib/repositories";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const personId = request.nextUrl.searchParams.get("personId") ?? undefined;
    const { loyaltyProgram, loyaltyTransaction } = createRepositories();
    const report = await getLoyaltyProgramReportUseCase(id, loyaltyProgram, loyaltyTransaction, personId);
    return Response.json(report);
  } catch (error) {
    return errorResponse(error);
  }
}
