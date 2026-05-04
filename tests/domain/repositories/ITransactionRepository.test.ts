import type { ITransactionRepository, TransactionRecord } from "../../../src/domain/repositories/ITransactionRepository";

class InMemoryTransactionRepository implements ITransactionRepository {
  private store: TransactionRecord[] = [];

  async findById(id: string): Promise<TransactionRecord | null> {
    return this.store.find((t) => t.id === id) ?? null;
  }

  async findByMonth(year: number, month: number): Promise<TransactionRecord[]> {
    return this.store.filter((t) => {
      const d = new Date(t.date);
      return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
    });
  }

  async findByPersonAndMonth(personId: string, year: number, month: number): Promise<TransactionRecord[]> {
    return this.store.filter((t) => {
      const d = new Date(t.date);
      return t.personId === personId && d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
    });
  }

  async save(t: Omit<TransactionRecord, "createdAt" | "updatedAt">): Promise<TransactionRecord> {
    const record: TransactionRecord = { ...t, createdAt: new Date(), updatedAt: new Date() };
    const idx = this.store.findIndex((r) => r.id === t.id);
    if (idx >= 0) {
      this.store[idx] = record;
    } else {
      this.store.push(record);
    }
    return record;
  }

  async delete(id: string): Promise<void> {
    this.store = this.store.filter((t) => t.id !== id);
  }
}

const makeExpense = (overrides: Partial<TransactionRecord> = {}): Omit<TransactionRecord, "createdAt" | "updatedAt"> => ({
  id: "txn-1",
  personId: "person-1",
  type: "EXPENSE",
  amount: 100,
  date: new Date("2026-05-10"),
  description: "Groceries",
  paymentMethod: "CASH",
  categoryId: null,
  ...overrides,
});

describe("ITransactionRepository", () => {
  let repo: ITransactionRepository;

  beforeEach(() => {
    repo = new InMemoryTransactionRepository();
  });

  it("saves and retrieves an expense by id", async () => {
    await repo.save(makeExpense({ id: "txn-1" }));

    const found = await repo.findById("txn-1");

    expect(found).not.toBeNull();
    expect(found!.personId).toBe("person-1");
    expect(found!.type).toBe("EXPENSE");
  });

  it("expense record always has a personId", async () => {
    const expense = await repo.save(makeExpense({ personId: "person-1" }));

    expect(expense.personId).toBe("person-1");
    expect(expense.personId).toBeTruthy();
  });

  it("findByPersonAndMonth returns only matching person and month", async () => {
    await repo.save(makeExpense({ id: "t1", personId: "person-1", date: new Date("2026-05-10") }));
    await repo.save(makeExpense({ id: "t2", personId: "person-1", date: new Date("2026-06-01") }));
    await repo.save(makeExpense({ id: "t3", personId: "person-2", date: new Date("2026-05-15") }));

    const results = await repo.findByPersonAndMonth("person-1", 2026, 5);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("t1");
  });

  it("returns empty list when no transactions in that month", async () => {
    await repo.save(makeExpense({ date: new Date("2026-04-30") }));

    const results = await repo.findByPersonAndMonth("person-1", 2026, 5);

    expect(results).toHaveLength(0);
  });

  it("deletes a transaction", async () => {
    await repo.save(makeExpense({ id: "txn-1" }));

    await repo.delete("txn-1");

    const found = await repo.findById("txn-1");
    expect(found).toBeNull();
  });

  it("transaction record has no workspaceId field", async () => {
    const expense = await repo.save(makeExpense());

    expect(expense).not.toHaveProperty("workspaceId");
    expect(expense).not.toHaveProperty("workspace_id");
  });
});
