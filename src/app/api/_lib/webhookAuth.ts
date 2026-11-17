import { createHash, timingSafeEqual } from "node:crypto";

const BEARER_PATTERN = /^bearer (.+)$/i;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * Checks an `Authorization: Bearer <token>` header against the configured webhook token. Both
 * sides are hashed first so the comparison takes the same time whatever their lengths.
 */
export function isAuthorizedWebhook(authorization: string | null, token: string): boolean {
  if (!token) return false;
  const presented = authorization ? BEARER_PATTERN.exec(authorization)?.[1] : undefined;
  if (presented === undefined) return false;
  return timingSafeEqual(digest(presented), digest(token));
}
