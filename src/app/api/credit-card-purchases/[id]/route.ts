import type { NextRequest } from "next/server";
import type {
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../../../domain/repositories/ICreditCardPurchaseRepository";
import type { BillingMonth } from "../../../../domain/services/InstallmentPurchase";
import { parseBillingMonth } from "../../_lib/billingMonth";
import { errorResponse } from "../../_lib/errorResponse";
import { createRepositories } from "../../_lib/repositories";

/** Fatura of installment 1: the earliest `due - (installmentNumber - 1)` across the rows. */
function firstBillingMonth(installments: InstallmentRecord[]): BillingMonth | null {
  const firstAbsolute = installments.reduce<number | null>((min, i) => {
    const absolute = i.dueYear * 12 + (i.dueMonth - 1) - (i.installmentNumber - 1);
    return min === null || absolute < min ? absolute : min;
  }, null);
  if (firstAbsolute === null) return null;
  return { year: Math.floor(firstAbsolute / 12), month: (firstAbsolute % 12) + 1 };
}

function isBillingChange(installments: InstallmentRecord[], requested?: BillingMonth): boolean {
  if (!requested) return false;
  const current = firstBillingMonth(installments);
  return !current || current.year !== requested.year || current.month !== requested.month;
}

/** Why the edit cannot be applied to this purchase, or null when it can. */
function findConflict(
  installments: InstallmentRecord[],
  currentTotal: number,
  newTotal: number,
  billingChanged: boolean,
): string | null {
  const isSplit = new Set(installments.map((i) => i.personId)).size > 1;
  const totalChanged = Math.round(newTotal * 100) !== Math.round(currentTotal * 100);
  if (isSplit && totalChanged) {
    return "Editing the total amount of a split purchase is not supported yet";
  }
  if (billingChanged && installments.some((i) => i.isPaid)) {
    return "Cannot change the fatura of a purchase with paid installments";
  }
  return null;
}

function toUpdateData(
  body: Record<string, unknown>,
  firstDue: BillingMonth | undefined,
): Parameters<ICreditCardPurchaseRepository["updatePurchase"]>[1] {
  return {
    description: (body.description as string | undefined) ?? "",
    totalAmount: body.totalAmount as number,
    purchaseDate: new Date(body.purchaseDate as string),
    categoryId: (body.categoryId as string | null | undefined) ?? null,
    creditCardId: (body.creditCardId as string | null | undefined) ?? null,
    ...(firstDue ? { firstDue } : {}),
  };
}

function formatBillingMonth({ year, month }: BillingMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCardPurchase } = createRepositories();
    const [purchase, installments] = await Promise.all([
      creditCardPurchase.findPurchaseById(params.id),
      creditCardPurchase.findByPurchaseId(params.id),
    ]);
    if (!purchase) return Response.json({ error: "Not found" }, { status: 404 });
    const first = firstBillingMonth(installments);
    return Response.json({
      purchase: first ? { ...purchase, billingMonth: formatBillingMonth(first) } : purchase,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { creditCardPurchase } = createRepositories();
    await creditCardPurchase.deletePurchase(params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { totalAmount, purchaseDate } = body;

    if (typeof totalAmount !== "number" || !purchaseDate) {
      return Response.json({ error: "totalAmount and purchaseDate are required" }, { status: 400 });
    }

    const billing = parseBillingMonth(body.billingMonth);
    if (billing.error) return Response.json({ error: billing.error }, { status: 400 });

    const { creditCardPurchase } = createRepositories();

    const [existingPurchase, installments] = await Promise.all([
      creditCardPurchase.findPurchaseById(params.id),
      creditCardPurchase.findByPurchaseId(params.id),
    ]);
    if (!existingPurchase) return Response.json({ error: "Not found" }, { status: 404 });

    const billingChanged = isBillingChange(installments, billing.value);
    const conflict = findConflict(
      installments,
      existingPurchase.totalAmount,
      totalAmount,
      billingChanged,
    );
    if (conflict) return Response.json({ error: conflict }, { status: 409 });

    await creditCardPurchase.updatePurchase(
      params.id,
      toUpdateData(body, billingChanged ? billing.value : undefined),
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
