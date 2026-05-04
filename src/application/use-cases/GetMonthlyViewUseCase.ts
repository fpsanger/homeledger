import type {
  ICreditCardPurchaseRepository,
  InstallmentRecord,
} from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { IRecurringTransactionRepository } from "../../domain/repositories/IRecurringTransactionRepository";
import type {
  ITransactionRepository,
  TransactionRecord,
} from "../../domain/repositories/ITransactionRepository";
import { buildMonthlyView } from "../../domain/services/MonthlyView";

type Input = {
  year: number;
  month: number;
  personId?: string;
};

type Output = {
  transactions: TransactionRecord[];
  installments: InstallmentRecord[];
};

export async function getMonthlyViewUseCase(
  input: Input,
  transactionRepo: ITransactionRepository,
  creditCardRepo: ICreditCardPurchaseRepository,
  recurringRepo: IRecurringTransactionRepository,
): Promise<Output> {
  const { year, month, personId } = input;

  const [transactions, installments, recurringRules] = await Promise.all([
    personId
      ? transactionRepo.findByPersonAndMonth(personId, year, month)
      : transactionRepo.findByMonth(year, month),
    personId
      ? creditCardRepo.findInstallmentsByMonth(personId, year, month)
      : creditCardRepo.findAllInstallmentsByMonth(year, month),
    personId
      ? recurringRepo.findActiveByPersonAndMonth(personId, year, month)
      : recurringRepo.findAllActiveByMonth(year, month),
  ]);

  return buildMonthlyView({ transactions, installments, recurringRules, year, month, personId });
}
