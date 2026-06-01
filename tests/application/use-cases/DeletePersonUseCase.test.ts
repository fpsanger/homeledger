import { deletePersonUseCase } from "../../../src/application/use-cases/DeletePersonUseCase";
import type {
  IPersonRepository,
  PersonRecord,
} from "../../../src/domain/repositories/IPersonRepository";

const makePerson = (id: string): PersonRecord => ({
  id,
  name: "Test",
  createdAt: new Date(),
});

const makeRepo = (
  people: PersonRecord[] = [],
  overrides: Partial<IPersonRepository> = {},
): IPersonRepository => ({
  findAll: async () => people,
  findById: async (id) => people.find((p) => p.id === id) ?? null,
  save: async (p) => ({ ...p, createdAt: new Date() }),
  delete: async () => {},
  ...overrides,
});

describe("deletePersonUseCase", () => {
  it("deletes person when found", async () => {
    const deleted: string[] = [];
    const repo = makeRepo([makePerson("p-1")], {
      delete: async (id) => {
        deleted.push(id);
      },
    });
    await deletePersonUseCase("p-1", repo);
    expect(deleted).toContain("p-1");
  });

  it("throws when person not found", async () => {
    const repo = makeRepo([]);
    await expect(deletePersonUseCase("nonexistent", repo)).rejects.toThrow("Person not found");
  });
});
