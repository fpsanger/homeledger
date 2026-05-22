import { NotFoundError } from "../../domain/errors";
import type { IPersonRepository } from "../../domain/repositories/IPersonRepository";

export async function deletePersonUseCase(id: string, repo: IPersonRepository): Promise<void> {
  const person = await repo.findById(id);
  if (!person) throw new NotFoundError("Person not found");
  await repo.delete(id);
}
