import type { NextRequest } from "next/server";
import { z } from "zod";
import { registerShortcutTransactionUseCase } from "../../../../../application/use-cases/RegisterShortcutTransactionUseCase";
import { parseDateUTC } from "../../../_lib/date";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";
import { resolveWebhookPerson } from "../../../_lib/webhookAuth";

// Reads the database and the request on every call, so Next must not evaluate it at build time.
export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

// `new Date("2026-02-30")` rolls over to March 2, so the written day must survive a round trip.
function isRealCalendarDay(value: string): boolean {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  );
}

const PayloadSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  merchant: z.string(),
  card: z.string().default(""),
  // ISO 8601 with the time ("2026-11-16T22:30:00-03:00"), or just the day ("2026-11-16").
  date: z
    .string()
    .regex(DATE_PATTERN, "date must be an ISO 8601 date")
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()) && isRealCalendarDay(value),
      "date is not a valid date",
    ),
});

const LOG = "[webhook/shortcuts]";

// Why a request was refused, for the log only. Never includes any part of the token.
function unauthorizedReason(authorization: string | null): string {
  if (!authorization) return "no authorization header";
  if (!/^bearer .+/i.test(authorization)) return "not a bearer header";
  return "unknown or revoked token";
}

// Field names and messages only: the values are purchase details and stay out of the log.
function logInvalidBody(issues: z.ZodIssue[]): void {
  console.warn(`${LOG} invalid body`, {
    issues: issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  });
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const authorization = request.headers.get("authorization");
  console.info(`${LOG} received`, {
    userAgent: request.headers.get("user-agent"),
    hasAuthorization: authorization !== null,
  });

  try {
    const { pendingTransaction, creditCard, categoryMemory, webhookToken } = createRepositories();
    const personId = await resolveWebhookPerson(authorization, webhookToken);
    if (!personId) {
      console.warn(`${LOG} unauthorized`, { reason: unauthorizedReason(authorization) });
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = PayloadSchema.safeParse(await request.json());
    if (!parsed.success) {
      logInvalidBody(parsed.error.issues);
      return Response.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { amount, merchant, card, date } = parsed.data;
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
    console.info(`${LOG} ${created ? "stored" : "duplicate"}`, {
      id: record.id,
      personId,
      ms: Date.now() - startedAt,
    });
    return Response.json({ id: record.id, created }, { status: created ? 201 : 200 });
  } catch (error) {
    console.error(`${LOG} error`, {
      message: error instanceof Error ? error.message : String(error),
      ms: Date.now() - startedAt,
    });
    return errorResponse(error);
  }
}
