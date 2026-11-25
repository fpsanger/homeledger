import type { PrismaClient, LoyaltyProgram as PrismaLoyaltyProgramRow } from "@prisma/client";
import type {
  ILoyaltyProgramRepository,
  LoyaltyProgramRecord,
} from "../../domain/repositories/ILoyaltyProgramRepository";

function toNumberOrNull(value: PrismaLoyaltyProgramRow["referenceMinPer1kBrl"]): number | null {
  if (value == null) return null;
  return typeof value === "number" ? value : value.toNumber();
}

function toRecord(row: PrismaLoyaltyProgramRow): LoyaltyProgramRecord {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    referenceMinPer1kBrl: toNumberOrNull(row.referenceMinPer1kBrl),
    referenceMaxPer1kBrl: toNumberOrNull(row.referenceMaxPer1kBrl),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaLoyaltyProgramRepository implements ILoyaltyProgramRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<LoyaltyProgramRecord[]> {
    const rows = await this.prisma.loyaltyProgram.findMany({ orderBy: { name: "asc" } });
    return rows.map(toRecord);
  }

  async findById(id: string): Promise<LoyaltyProgramRecord | null> {
    const row = await this.prisma.loyaltyProgram.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async save(program: LoyaltyProgramRecord): Promise<LoyaltyProgramRecord> {
    const row = await this.prisma.loyaltyProgram.upsert({
      where: { id: program.id },
      create: {
        id: program.id,
        name: program.name,
        type: program.type,
        color: program.color,
        referenceMinPer1kBrl: program.referenceMinPer1kBrl,
        referenceMaxPer1kBrl: program.referenceMaxPer1kBrl,
      },
      update: {
        name: program.name,
        type: program.type,
        color: program.color,
        referenceMinPer1kBrl: program.referenceMinPer1kBrl,
        referenceMaxPer1kBrl: program.referenceMaxPer1kBrl,
        updatedAt: program.updatedAt,
      },
    });
    return toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loyaltyProgram.delete({ where: { id } });
  }
}
