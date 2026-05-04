import type { IPersonRepository, PersonRecord } from "../../../src/domain/repositories/IPersonRepository";

class InMemoryPersonRepository implements IPersonRepository {
  private store: PersonRecord[] = [];

  async findAll(): Promise<PersonRecord[]> {
    return [...this.store];
  }

  async findById(id: string): Promise<PersonRecord | null> {
    return this.store.find((p) => p.id === id) ?? null;
  }

  async save(person: Omit<PersonRecord, "createdAt">): Promise<PersonRecord> {
    const existing = this.store.findIndex((p) => p.id === person.id);
    const record: PersonRecord = { ...person, createdAt: new Date() };
    if (existing >= 0) {
      this.store[existing] = record;
    } else {
      this.store.push(record);
    }
    return record;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((p) => p.id !== id);
  }
}

describe("IPersonRepository", () => {
  let repo: IPersonRepository;

  beforeEach(() => {
    repo = new InMemoryPersonRepository();
  });

  it("saves and retrieves a person by id", async () => {
    await repo.save({ id: "person-1", name: "Felipe" });

    const found = await repo.findById("person-1");

    expect(found).not.toBeNull();
    expect(found!.name).toBe("Felipe");
  });

  it("lists all saved people", async () => {
    await repo.save({ id: "person-1", name: "Felipe" });
    await repo.save({ id: "person-2", name: "Ana" });

    const all = await repo.findAll();

    expect(all).toHaveLength(2);
    expect(all.map((p) => p.name)).toEqual(expect.arrayContaining(["Felipe", "Ana"]));
  });

  it("returns empty list when no people saved", async () => {
    const all = await repo.findAll();

    expect(all).toHaveLength(0);
  });

  it("returns null when person not found", async () => {
    const found = await repo.findById("nonexistent");

    expect(found).toBeNull();
  });

  it("deletes a person by id", async () => {
    await repo.save({ id: "person-1", name: "Felipe" });

    await repo.delete("person-1");

    const found = await repo.findById("person-1");
    expect(found).toBeNull();
  });

  it("person record has no workspaceId field", async () => {
    const person = await repo.save({ id: "person-1", name: "Felipe" });

    expect(person).not.toHaveProperty("workspaceId");
    expect(person).not.toHaveProperty("workspace_id");
  });
});
