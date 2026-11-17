import type { NextRequest } from "next/server";
import { z } from "zod";
import { confirmPendingTransactionUseCase } from "../../../../../application/use-cases/ConfirmPendingTransactionUseCase";
import { parseBillingMonth } from "../../../_lib/billingMonth";
import { errorResponse } from "../../../_lib/errorResponse";
import { createRepositories } from "../../../_lib/repositories";

const BodySchema = z.object({
  categoryId: z.string().min(1).nullable(),
  creditCardId: z.string().min(1).nullable(),
  billingMonth: z.string().nullish(),
  paymentMethod: z
    .enum(["CASH", "DEBIT_CARD", "CREDIT_CARD", "PIX", "BANK_TRANSFER", "BOLETO", "ACCOUNT_DEBIT"])
    .optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const billingMonth = parseBillingMonth(parsed.data.billingMonth);
    if (billingMonth.error) return Response.json({ error: billingMonth.error }, { status: 400 });

    const repositories = createRepositories();
    const result = await confirmPendingTransactionUseCase(
      {
        id: params.id,
        recordId: crypto.randomUUID(),
        categoryId: parsed.data.categoryId,
        creditCardId: parsed.data.creditCardId,
        billingMonth: billingMonth.value,
        paymentMethod: parsed.data.paymentMethod,
      },
      {
        pending: repositories.pendingTransaction,
        transactions: repositories.transaction,
        categories: repositories.category,
        purchases: repositories.creditCardPurchase,
        creditCards: repositories.creditCard,
        categoryMemory: repositories.categoryMemory,
      },
    );
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
