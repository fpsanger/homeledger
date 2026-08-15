import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertMerchantHistory } from "../../../../infrastructure/categorization/MerchantHistoryCategorizer";

export const runtime = "nodejs";

const RequestSchema = z.object({
  entries: z.array(
    z.object({
      description: z.string(),
      categoryId: z.string(),
    }),
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    await Promise.all(
      parsed.data.entries.map(({ description, categoryId }) =>
        upsertMerchantHistory(description, categoryId),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[billing/learn] unexpected error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
