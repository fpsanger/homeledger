import { NotFoundError } from "../../domain/errors";
import type { IPersonRepository } from "../../domain/repositories/IPersonRepository";
import type { IWebhookTokenRepository } from "../../domain/repositories/IWebhookTokenRepository";

export async function revokeWebhookTokenUseCase(
  personId: string,
  deps: { people: IPersonRepository; tokens: IWebhookTokenRepository },
): Promise<void> {
  if (!(await deps.people.findById(personId))) throw new NotFoundError("Person not found");
  await deps.tokens.revokeForPerson(personId);
}
