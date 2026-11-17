import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

// The list changes whenever a Shortcut reports a purchase, so it must not be cached.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { pendingTransaction } = createRepositories();
    return Response.json({ pending: await pendingTransaction.findPending() });
  } catch (error) {
    return errorResponse(error);
  }
}
