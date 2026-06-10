import type { ICreditCardPurchaseRepository } from "../../domain/repositories/ICreditCardPurchaseRepository";
import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";
import { buildAnnualReport, type AnnualReportResult } from "../../domain/services/AnnualReport";

type Input = {
  year: number;
  personId?: string;
};

export async function getAnnualReportUseCase(
  input: Input,
  transactionRepo: ITransactionRepository,
  creditCardRepo: ICreditCardPurchaseRepository,
): Promise<AnnualReportResult> {
  const { year, personId } = input;

  const [transactions, installments] = await Promise.all([
    personId
      ? transactionRepo.findByPersonAndYear(personId, year)
      : transactionRepo.findByYear(year),
    personId
      ? creditCardRepo.findInstallmentsByTransactionYear(personId, year)
      : creditCardRepo.findAllInstallmentsByTransactionYear(year),
  ]);

  return buildAnnualReport({ transactions, installments, year, personId });
}
