import type { ICreditCardRefundRepository } from "../../domain/repositories/ICreditCardRefundRepository";

export async function deleteCreditCardRefundUseCase(
  id: string,
  repo: ICreditCardRefundRepository,
): Promise<void> {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Refund not found");
  await repo.deleteById(id);
}
