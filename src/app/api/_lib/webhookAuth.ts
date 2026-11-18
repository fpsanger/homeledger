import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { IWebhookTokenRepository } from "../../../domain/repositories/IWebhookTokenRepository";

const BEARER_PATTERN = /^bearer (.+)$/i;

export function hashWebhookToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A new token for a person, with the id and hash to store; the plain token is shown only once. */
export function generateWebhookToken(): { id: string; token: string; tokenHash: string } {
  const token = `hl_${randomBytes(32).toString("hex")}`;
  return { id: randomUUID(), token, tokenHash: hashWebhookToken(token) };
}

/**
 * The person who owns the `Authorization: Bearer <token>` credential, or null. Tokens are looked
 * up by hash: they are 256 random bits, so a lookup leaks nothing a comparison would protect.
 */
export async function resolveWebhookPerson(
  authorization: string | null,
  tokens: IWebhookTokenRepository,
): Promise<string | null> {
  const presented = authorization ? BEARER_PATTERN.exec(authorization)?.[1] : undefined;
  if (presented === undefined) return null;
  const found = await tokens.findActiveByHash(hashWebhookToken(presented));
  return found?.personId ?? null;
}
