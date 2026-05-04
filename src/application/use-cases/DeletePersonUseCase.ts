import type { IPersonRepository } from "../../domain/repositories/IPersonRepository";

export async function deletePersonUseCase(
  id: string,
  repo: IPersonRepository,
): Promise<void> {
  const person = await repo.findById(id);
  if (!person) throw new Error("Person not found");
  await repo.delete(id);
}
