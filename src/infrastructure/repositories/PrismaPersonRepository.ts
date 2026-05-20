import type { PrismaClient } from "@prisma/client";
import type { IPersonRepository, PersonRecord } from "../../domain/repositories/IPersonRepository";

export class PrismaPersonRepository implements IPersonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<PersonRecord[]> {
    return this.prisma.person.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string): Promise<PersonRecord | null> {
    return this.prisma.person.findUnique({ where: { id } });
  }

  async save(person: Omit<PersonRecord, "createdAt">): Promise<PersonRecord> {
    return this.prisma.person.upsert({
      where: { id: person.id },
      create: { id: person.id, name: person.name },
      update: { name: person.name },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.person.delete({ where: { id } });
  }
}
