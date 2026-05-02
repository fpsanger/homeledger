import { createPerson } from "../../domain/entities/Person";
import type { IPersonRepository, PersonRecord } from "../../domain/repositories/IPersonRepository";

type Input = { id: string; name: string };

export async function createPersonUseCase(input: Input, repo: IPersonRepository): Promise<PersonRecord> {
  const person = createPerson(input);
  return repo.save(person);
}
