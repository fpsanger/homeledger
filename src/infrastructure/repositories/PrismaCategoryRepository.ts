import type { PrismaClient } from "@prisma/client";
import type {
  CategoryRecord,
  ICategoryRepository,
} from "../../domain/repositories/ICategoryRepository";

const HOUSEHOLD_ID = "default";

type PrismaCategoryRow = {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  level: number;
  createdAt: Date;
};

function toRecord(row: PrismaCategoryRow): CategoryRecord {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    path: row.path,
    level: row.level,
    householdId: HOUSEHOLD_ID,
    createdAt: row.createdAt,
  };
}

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<CategoryRecord[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: { level: "asc" },
    });
    return rows.map(toRecord);
  }

  async findById(id: string): Promise<CategoryRecord | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async findRootByName(name: string, householdId: string): Promise<CategoryRecord | null> {
    const row = await this.prisma.category.findFirst({
      where: { name, parentId: null },
    });
    return row ? toRecord(row) : null;
  }

  async save(category: Omit<CategoryRecord, "createdAt">): Promise<CategoryRecord> {
    const row = await this.prisma.category.upsert({
      where: { id: category.id },
      create: {
        id: category.id,
        name: category.name,
        parentId: category.parentId,
        path: category.path,
        level: category.level,
      },
      update: {
        name: category.name,
        parentId: category.parentId,
        path: category.path,
        level: category.level,
      },
    });
    return toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
