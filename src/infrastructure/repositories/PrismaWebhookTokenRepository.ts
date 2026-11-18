import type { PrismaClient } from "@prisma/client";
import type { IWebhookTokenRepository } from "../../domain/repositories/IWebhookTokenRepository";

export class PrismaWebhookTokenRepository implements IWebhookTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async issue(token: { id: string; personId: string; tokenHash: string }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Two overlapping issues for one person would both revoke before either creates, leaving two
      // active tokens. The lock makes the second wait for the first to commit, then revoke it.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${token.personId}))`;
      await tx.webhookToken.updateMany({
        where: { personId: token.personId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.webhookToken.create({
        data: { id: token.id, personId: token.personId, tokenHash: token.tokenHash },
      });
    });
  }

  async findActiveByHash(tokenHash: string): Promise<{ personId: string } | null> {
    return this.prisma.webhookToken.findFirst({
      where: { tokenHash, revokedAt: null },
      select: { personId: true },
    });
  }

  async revokeForPerson(personId: string): Promise<void> {
    await this.prisma.webhookToken.updateMany({
      where: { personId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
