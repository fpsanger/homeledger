import type { NextRequest } from "next/server";
import { z } from "zod";
import { registerShortcutTransactionUseCase } from "../../../../../application/use-cases/RegisterShortcutTransactionUseCase";
import { parseDateUTC } from "../../../_lib/date";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";
import { isAuthorizedWebhook } from "../../../_lib/webhookAuth";

// Reads the environment and the request on every call, so Next must not evaluate it at build time.
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

const PayloadSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  merchant: z.string(),
  card: z.string().default(""),
  // ISO 8601 with the time ("2026-11-16T22:30:00-03:00"), or just the day ("2026-11-16").
  date: z
    .string()
    .regex(DATE_PATTERN, "date must be an ISO 8601 date")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "date is not a valid date"),
});

export async function POST(request: NextRequest) {
  const token = process.env.WEBHOOK_TOKEN;
  const personId = process.env.WEBHOOK_PERSON_ID;
  if (!token || !personId) {
    return Response.json({ error: "Webhook is not configured" }, { status: 503 });
  }
  if (!isAuthorizedWebhook(request.headers.get("authorization"), token)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = PayloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { amount, merchant, card, date } = parsed.data;
    const { pendingTransaction, creditCard, categoryMemory } = createRepositories();
    const { record, created } = await registerShortcutTransactionUseCase(
      {
        id: crypto.randomUUID(),
        personId,
        amount,
        merchant,
        cardName: card,
        occurredAt: new Date(date),
        occurredOn: parseDateUTC(date),
      },
      { pending: pendingTransaction, creditCards: creditCard, categoryMemory },
    );
    return Response.json({ id: record.id, created }, { status: created ? 201 : 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
