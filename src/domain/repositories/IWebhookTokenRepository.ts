export interface IWebhookTokenRepository {
  /** Revokes the person's active token, if any, and stores the new one. */
  issue(token: { id: string; personId: string; tokenHash: string }): Promise<void>;
  /** The person a non-revoked token belongs to, looked up by the hash of the presented token. */
  findActiveByHash(tokenHash: string): Promise<{ personId: string } | null>;
  revokeForPerson(personId: string): Promise<void>;
}
