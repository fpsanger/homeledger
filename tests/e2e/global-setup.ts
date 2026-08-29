import { type FullConfig, request } from "@playwright/test";

type CreatedRecord = { id: string };
type PurchaseRecord = { id: string; creditCardId: string };

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (typeof baseURL !== "string") throw new Error("Playwright baseURL is required");

  const api = await request.newContext({ baseURL });
  const suffix = `${Date.now()}-${process.pid}`;
  const personName = `E2E Fixture Person ${suffix}`;
  const cardName = `E2E Fixture Card ${suffix}`;

  const personResponse = await api.post("/api/people", {
    data: { name: personName },
  });
  if (!personResponse.ok()) {
    throw new Error(`Unable to create E2E person fixture: ${personResponse.status()}`);
  }
  const person = (await personResponse.json()) as CreatedRecord;

  const cardResponse = await api.post("/api/credit-cards", {
    data: {
      name: cardName,
      closureType: "FIXED",
      fixedClosureDay: 10,
      dueDayOfMonth: 20,
    },
  });
  if (!cardResponse.ok()) {
    await api.delete(`/api/people/${person.id}`);
    throw new Error(`Unable to create E2E card fixture: ${cardResponse.status()}`);
  }
  const card = (await cardResponse.json()) as CreatedRecord;

  process.env.E2E_FIXTURE_PERSON_NAME = personName;
  process.env.E2E_FIXTURE_CARD_NAME = cardName;

  return async () => {
    const purchasesResponse = await api.get("/api/credit-card-purchases");
    if (purchasesResponse.ok()) {
      const { purchases } = (await purchasesResponse.json()) as {
        purchases: PurchaseRecord[];
      };
      const fixturePurchases = purchases.filter((purchase) => purchase.creditCardId === card.id);
      await Promise.all(
        fixturePurchases.map((purchase) => api.delete(`/api/credit-card-purchases/${purchase.id}`)),
      );
    }

    const cardCleanup = await api.delete(`/api/credit-cards/${card.id}`);
    const personCleanup = await api.delete(`/api/people/${person.id}`);
    await api.dispose();

    if (!cardCleanup.ok() || !personCleanup.ok()) {
      throw new Error(
        `Unable to clean E2E fixtures: card=${cardCleanup.status()} person=${personCleanup.status()}`,
      );
    }
  };
}
