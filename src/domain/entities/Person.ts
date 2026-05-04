import type { PersonRecord } from "../repositories/IPersonRepository";

export function createPerson(input: { id: string; name: string }): PersonRecord {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Name is required");
  }

  return {
    id: input.id,
    name,
    createdAt: new Date(),
  };
}
