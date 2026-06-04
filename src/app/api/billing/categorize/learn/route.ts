import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../infrastructure/database/client";
import { PrismaMerchantHistoryRepository } from "../../../../../infrastructure/repositories/PrismaMerchantHistoryRepository";

export const runtime = "nodejs";

const RequestSchema = z.object({
  items: z.array(
    z.object({
      description: z.string(),
      categoryId: z.string(),
    }),
  ),
});

function normalizeMerchantKey(description: string): string {
  return description
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

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

    const repo = new PrismaMerchantHistoryRepository(prisma);

    for (const item of parsed.data.items) {
      const merchantKey = normalizeMerchantKey(item.description);
      await repo.upsert(merchantKey, item.categoryId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[categorize/learn] unexpected error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
