import type { IPersonRepository, PersonRecord } from "../../domain/repositories/IPersonRepository";

export async function listPeopleUseCase(repo: IPersonRepository): Promise<PersonRecord[]> {
  return repo.findAll();
}
