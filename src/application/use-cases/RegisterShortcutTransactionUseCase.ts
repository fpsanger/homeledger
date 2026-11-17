import {
  createPendingTransaction,
  type PendingTransactionRecord,
} from "../../domain/entities/PendingTransaction";
import type { ICreditCardRepository } from "../../domain/repositories/ICreditCardRepository";
import type { IMerchantCategoryMemory } from "../../domain/repositories/IMerchantCategoryMemory";
import type { IPendingTransactionRepository } from "../../domain/repositories/IPendingTransactionRepository";
import { matchCreditCard } from "../../domain/services/matchCreditCard";
import { parseShortcutAmount } from "../../domain/services/parseShortcutAmount";

type Input = {
  id: string;
  personId: string;
  amount: string | number;
  merchant: string;
  cardName: string;
  occurredAt: Date;
  occurredOn: Date;
};

type Deps = {
  pending: IPendingTransactionRepository;
  creditCards: ICreditCardRepository;
  categoryMemory: IMerchantCategoryMemory;
};

async function suggestCategory(memory: IMerchantCategoryMemory, merchant: string) {
  try {
    return await memory.suggest(merchant);
  } catch {
    // A missing suggestion only costs the user a click, so it must not lose the purchase.
    return null;
  }
}

export async function registerShortcutTransactionUseCase(
  input: Input,
  deps: Deps,
): Promise<{ record: PendingTransactionRecord; created: boolean }> {
  const draft = createPendingTransaction({
    id: input.id,
    personId: input.personId,
    amount: parseShortcutAmount(input.amount),
    occurredAt: input.occurredAt,
    occurredOn: input.occurredOn,
    merchant: input.merchant,
    cardName: input.cardName,
    creditCardId: null,
    suggestedCategoryId: null,
  });

  const card = matchCreditCard(draft.cardName, await deps.creditCards.findAll());
  const suggestedCategoryId = await suggestCategory(deps.categoryMemory, draft.merchant);

  return deps.pending.saveIfNew({ ...draft, creditCardId: card?.id ?? null, suggestedCategoryId });
}
