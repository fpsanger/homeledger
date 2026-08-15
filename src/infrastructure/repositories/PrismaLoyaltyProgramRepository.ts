import type { PrismaClient } from "@prisma/client";
import type {
  ILoyaltyProgramRepository,
  LoyaltyProgramRecord,
} from "../../domain/repositories/ILoyaltyProgramRepository";

export class PrismaLoyaltyProgramRepository implements ILoyaltyProgramRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<LoyaltyProgramRecord[]> {
    return this.prisma.loyaltyProgram.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string): Promise<LoyaltyProgramRecord | null> {
    return this.prisma.loyaltyProgram.findUnique({ where: { id } });
  }

  async save(program: LoyaltyProgramRecord): Promise<LoyaltyProgramRecord> {
    return this.prisma.loyaltyProgram.upsert({
      where: { id: program.id },
      create: {
        id: program.id,
        name: program.name,
        type: program.type,
        color: program.color,
      },
      update: {
        name: program.name,
        type: program.type,
        color: program.color,
        updatedAt: program.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loyaltyProgram.delete({ where: { id } });
  }
}
