import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("shared purchase owner migration", () => {
  it("clears arbitrary owners from split purchases created before the migration", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "src/infrastructure/database/migrations/20260905180000_make_shared_purchase_owner_optional/migration.sql",
      ),
      "utf8",
    );

    expect(migration).toMatch(/UPDATE "CreditCardPurchase"/);
    expect(migration).toMatch(/COUNT\(DISTINCT i\."personId"\) > 1/);
    expect(migration).toMatch(/SET "personId" = NULL/);
  });
});
