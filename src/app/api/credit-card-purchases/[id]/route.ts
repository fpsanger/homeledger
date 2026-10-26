import type { NextRequest } from "next/server";
import type { InstallmentRecord } from "../../../../domain/repositories/ICreditCardPurchaseRepository";
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
    const { description, totalAmount, purchaseDate, categoryId, creditCardId } = body;

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

    const isSplit = new Set(installments.map((i) => i.personId)).size > 1;
    const totalChanged =
      Math.round(totalAmount * 100) !== Math.round(existingPurchase.totalAmount * 100);
    if (isSplit && totalChanged) {
      return Response.json(
        { error: "Editing the total amount of a split purchase is not supported yet" },
        { status: 409 },
      );
    }

    const current = firstBillingMonth(installments);
    const billingChanged =
      billing.value !== undefined &&
      (!current || current.year !== billing.value.year || current.month !== billing.value.month);
    if (billingChanged && installments.some((i) => i.isPaid)) {
      return Response.json(
        { error: "Cannot change the fatura of a purchase with paid installments" },
        { status: 409 },
      );
    }

    await creditCardPurchase.updatePurchase(params.id, {
      description: description ?? "",
      totalAmount,
      purchaseDate: new Date(purchaseDate),
      categoryId: categoryId ?? null,
      creditCardId: creditCardId ?? null,
      ...(billingChanged ? { firstDue: billing.value } : {}),
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
