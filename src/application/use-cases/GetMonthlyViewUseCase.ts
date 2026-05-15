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
  filterBy?: "dueMonth" | "purchaseDate";
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
  const { year, month, personId, filterBy = "dueMonth" } = input;

  const [transactions, installments, recurringRules] = await Promise.all([
    personId
      ? transactionRepo.findByPersonAndMonth(personId, year, month)
      : transactionRepo.findByMonth(year, month),
    filterBy === "purchaseDate"
      ? (personId
          ? creditCardRepo.findInstallmentsByPurchaseMonth(personId, year, month)
          : creditCardRepo.findAllInstallmentsByPurchaseMonth(year, month))
      : (personId
          ? creditCardRepo.findInstallmentsByMonth(personId, year, month)
          : creditCardRepo.findAllInstallmentsByMonth(year, month)),
    personId
      ? recurringRepo.findActiveByPersonAndMonth(personId, year, month)
      : recurringRepo.findAllActiveByMonth(year, month),
  ]);

  return buildMonthlyView({ transactions, installments, recurringRules, year, month, personId, filterBy });
}
