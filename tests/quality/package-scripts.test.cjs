const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const packageJson = require(path.resolve(__dirname, "../../package.json"));

test("agent:check generates the Prisma client before running checks and validates the schema", () => {
  assert.equal(
    packageJson.scripts["agent:check"],
    "prisma generate && npm run verify:fast && prisma validate",
  );
});

test("verify composes the canonical agent gate with Playwright", () => {
  assert.equal(packageJson.scripts.verify, "npm run agent:check && npm run test:e2e");
});
