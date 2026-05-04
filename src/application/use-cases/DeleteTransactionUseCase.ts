import type { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";

export async function deleteTransactionUseCase(
  id: string,
  repo: ITransactionRepository,
): Promise<void> {
  const transaction = await repo.findById(id);
  if (!transaction) throw new Error("Transaction not found");
  await repo.delete(id);
}
