import type { NextRequest } from "next/server";
import { createInstallmentPurchaseUseCase } from "../../../application/use-cases/CreateInstallmentPurchaseUseCase";
import { parseBillingMonth } from "../_lib/billingMonth";
import { errorResponse } from "../_lib/errorResponse";
import { createRepositories } from "../_lib/repositories";

// biome-ignore lint/suspicious/noExplicitAny: request body is parsed JSON, not yet validated
function validateOwner(body: any): string | null {
  const hasSplits = Array.isArray(body.splits);
  if (!body.personId && !hasSplits) return "personId or splits is required";
  if (body.personId && hasSplits) return "Provide either personId or splits, not both";
  return hasSplits ? validateSplits(body.splits) : null;
}

// biome-ignore lint/suspicious/noExplicitAny: request body is parsed JSON, not yet validated
function validateSplits(splits: any[]): string | null {
  if (splits.length < 2) return "A split purchase requires at least 2 people";
  for (const split of splits) {
    if (!split.personId || typeof split.amount !== "number" || split.amount <= 0) {
      return "Each split must have a personId and a positive amount";
    }
  }
  return null;
}

// biome-ignore lint/suspicious/noExplicitAny: request body is parsed JSON, not yet validated
function validateSharedFields(body: any): string | null {
  if (typeof body.totalAmount !== "number") return "totalAmount must be a number";
  if (typeof body.numberOfInstallments !== "number" || body.numberOfInstallments < 1) {
    return "numberOfInstallments must be a positive integer";
  }
  if (!body.purchaseDate) return "purchaseDate is required";
  if (!body.creditCardId) return "creditCardId is required";
  return null;
}

// biome-ignore lint/suspicious/noExplicitAny: request body is parsed JSON, not yet validated
function validateBody(body: any): string | null {
  return validateOwner(body) ?? validateSharedFields(body);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const billingMonth = parseBillingMonth(body.billingMonth);
    const validationError = validateBody(body) ?? billingMonth.error;
    if (validationError) return Response.json({ error: validationError }, { status: 400 });

    const hasSplits = Array.isArray(body.splits);
    const { creditCardPurchase, creditCard } = createRepositories();
    const result = await createInstallmentPurchaseUseCase(
      {
        id: crypto.randomUUID(),
        ...(hasSplits ? { splits: body.splits } : { personId: body.personId }),
        totalAmount: body.totalAmount,
        numberOfInstallments: body.numberOfInstallments,
        purchaseDate: new Date(body.purchaseDate),
        description: body.description ?? "",
        categoryId: body.categoryId ?? null,
        creditCardId: body.creditCardId,
        billingMonth: billingMonth.value,
      },
      creditCardPurchase,
      creditCard,
    );
    return Response.json({ ...result.record, isDuplicate: result.isDuplicate }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
