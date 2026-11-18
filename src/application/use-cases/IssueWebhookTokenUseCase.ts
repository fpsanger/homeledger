import { NotFoundError } from "../../domain/errors";
import type { IPersonRepository } from "../../domain/repositories/IPersonRepository";
import type { IWebhookTokenRepository } from "../../domain/repositories/IWebhookTokenRepository";

type Deps = {
  people: IPersonRepository;
  tokens: IWebhookTokenRepository;
  /** Creates a fresh token and the hash that is stored in its place. */
  mint: () => { id: string; token: string; tokenHash: string };
};

/** Gives the person a new webhook token, invalidating the previous one. Only the hash is kept. */
export async function issueWebhookTokenUseCase(
  personId: string,
  deps: Deps,
): Promise<{ token: string }> {
  if (!(await deps.people.findById(personId))) throw new NotFoundError("Person not found");

  const { id, token, tokenHash } = deps.mint();
  await deps.tokens.issue({ id, personId, tokenHash });
  return { token };
}
