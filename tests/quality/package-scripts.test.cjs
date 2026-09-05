const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const packageJson = require(path.resolve(__dirname, "../../package.json"));

test("agent:check validates the Prisma schema", () => {
  assert.match(packageJson.scripts["agent:check"], /prisma validate/);
});

test("verify composes the canonical agent gate with Playwright", () => {
  assert.equal(packageJson.scripts.verify, "npm run agent:check && npm run test:e2e");
});
