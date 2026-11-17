import type { PendingTransactionRecord } from "../../domain/entities/PendingTransaction";
import { NotFoundError, PendingTransactionResolvedError } from "../../domain/errors";
import type { ICategoryRepository } from "../../domain/repositories/ICategoryRepository";
import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import type { IMerchantCategoryMemory } from "../../domain/repositories/IMerchantCategoryMemory";
import type { IPendingTransactionRepository } from "../../domain/repositories/IPendingTransactionRepository";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { validateExpenseCategory } from "../../domain/services/CategoryTree";
import type { BillingMonth } from "../../domain/services/InstallmentPurchase";
import { createExpenseUseCase } from "./CreateExpenseUseCase";
import { createInstallmentPurchaseUseCase } from "./CreateInstallmentPurchaseUseCase";

type Input = {
  /** Id of the pending purchase being confirmed. */
  id: string;
  /** Id for the expense or credit card purchase that confirming creates. */
  recordId: string;
  categoryId: string | null;
  /** A credit card makes it a credit card purchase, no card makes it a plain expense. */
  creditCardId: string | null;
  billingMonth?: BillingMonth;
  paymentMethod?: Exclude<TransactionRecord["paymentMethod"], null>;
};

type Deps = {
  pending: IPendingTransactionRepository;
  transactions: ITransactionRepository;
  categories: ICategoryRepository;
  purchases: ICreditCardPurchaseRepository;
  creditCards: ICreditCardRepository;
  categoryMemory: IMerchantCategoryMemory;
};

type Result = { kind: "expense" | "credit"; recordId: string; isDuplicate: boolean };

/** Moves a pending purchase out of PENDING so two requests cannot both act on it. */
async function claimPending(
  id: string,
  status: "CONFIRMED" | "DISCARDED",
  repo: IPendingTransactionRepository,
): Promise<PendingTransactionRecord> {
  const record = await repo.findById(id);
  if (!record) throw new NotFoundError("Pending transaction not found");
  if (record.status !== "PENDING") throw new PendingTransactionResolvedError();
  if (!(await repo.resolve(id, status, new Date()))) throw new PendingTransactionResolvedError();
  return record;
}

async function createCreditPurchase(
  pending: PendingTransactionRecord,
  creditCardId: string,
  input: Input,
  deps: Deps,
) {
  if (input.categoryId !== null) {
    validateExpenseCategory(input.categoryId, await deps.categories.findAll());
  }
  return createInstallmentPurchaseUseCase(
    {
      id: input.recordId,
      personId: pending.personId,
      totalAmount: pending.amount,
      numberOfInstallments: 1,
      purchaseDate: pending.occurredOn,
      description: pending.merchant,
      categoryId: input.categoryId,
      creditCardId,
      billingMonth: input.billingMonth,
    },
    deps.purchases,
    deps.creditCards,
  );
}

async function createRecord(
  pending: PendingTransactionRecord,
  input: Input,
  deps: Deps,
): Promise<Result> {
  if (input.creditCardId) {
    const { isDuplicate } = await createCreditPurchase(pending, input.creditCardId, input, deps);
    return { kind: "credit", recordId: input.recordId, isDuplicate };
  }

  const { isDuplicate } = await createExpenseUseCase(
    {
      id: input.recordId,
      personId: pending.personId,
      amount: pending.amount,
      date: pending.occurredOn,
      description: pending.merchant,
      paymentMethod: input.paymentMethod ?? "DEBIT_CARD",
      categoryId: input.categoryId,
    },
    deps.transactions,
    deps.categories,
  );
  return { kind: "expense", recordId: input.recordId, isDuplicate };
}

async function learnCategory(
  memory: IMerchantCategoryMemory,
  merchant: string,
  categoryId: string,
) {
  try {
    await memory.learn(merchant, categoryId);
  } catch {
    // The entry already exists; failing to remember the category must not undo it.
  }
}

export async function confirmPendingTransactionUseCase(input: Input, deps: Deps): Promise<Result> {
  const pending = await claimPending(input.id, "CONFIRMED", deps.pending);

  let result: Result;
  try {
    result = await createRecord(pending, input, deps);
  } catch (error) {
    await deps.pending.reopen(input.id);
    throw error;
  }

  if (input.categoryId !== null) {
    await learnCategory(deps.categoryMemory, pending.merchant, input.categoryId);
  }
  return result;
}

export async function discardPendingTransactionUseCase(
  id: string,
  pending: IPendingTransactionRepository,
): Promise<void> {
  await claimPending(id, "DISCARDED", pending);
}
