import type { NextRequest } from "next/server";
import { issueWebhookTokenUseCase } from "../../../../../application/use-cases/IssueWebhookTokenUseCase";
import { revokeWebhookTokenUseCase } from "../../../../../application/use-cases/RevokeWebhookTokenUseCase";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";
import { generateWebhookToken } from "../../../_lib/webhookAuth";

// Never cache: the response carries a secret that is shown only once.
export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { person, webhookToken } = createRepositories();
    const result = await issueWebhookTokenUseCase(params.id, {
      people: person,
      tokens: webhookToken,
      mint: generateWebhookToken,
    });
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { person, webhookToken } = createRepositories();
    await revokeWebhookTokenUseCase(params.id, { people: person, tokens: webhookToken });
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
