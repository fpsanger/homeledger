import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { IRecurringTransactionRepository } from "../../domain/repositories/IRecurringTransactionRepository";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";
import { type AnnualReportResult, buildAnnualReport } from "../../domain/services/AnnualReport";

type Input = {
  year: number;
  personId?: string;
};

export async function getAnnualReportUseCase(
  input: Input,
  transactionRepo: ITransactionRepository,
  creditCardRepo: ICreditCardPurchaseRepository,
  recurringRepo: IRecurringTransactionRepository,
): Promise<AnnualReportResult> {
  const { year, personId } = input;

  const [transactions, installments, recurringRules] = await Promise.all([
    personId
      ? transactionRepo.findByPersonAndYear(personId, year)
      : transactionRepo.findByYear(year),
    personId
      ? creditCardRepo.findInstallmentsByTransactionYear(personId, year)
      : creditCardRepo.findAllInstallmentsByTransactionYear(year),
    recurringRepo.findAll(personId),
  ]);

  return buildAnnualReport({ transactions, installments, recurringRules, year, personId });
}
