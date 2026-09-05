const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  evaluateDiff,
  schemaWithoutMigration,
  financialLogicWithoutTests,
  apiRouteWithoutValidationOrTests,
  protectedHarnessFileTouched,
} = require("../../scripts/pr-checks/rules.cjs");
const { diffFiles, formatFindings } = require("../../scripts/pr-checks/analyze-diff.cjs");

function file(status, path) {
  return { status, path };
}

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function repositoryFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "homeledger-pr-review-"));
  git(root, ["init"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  fs.writeFileSync(path.join(root, "tracked.ts"), "export const value = 1;\n");
  git(root, ["add", "tracked.ts"]);
  git(root, ["commit", "-m", "initial"]);
  return root;
}

test("diffFiles includes tracked and untracked working-tree changes", () => {
  const root = repositoryFixture();
  fs.writeFileSync(path.join(root, "tracked.ts"), "export const value = 2;\n");
  fs.writeFileSync(path.join(root, "new.ts"), "export const added = true;\n");

  assert.deepEqual(diffFiles("HEAD", "HEAD", { cwd: root, includeWorkingTree: true }), [
    file("A", "new.ts"),
    file("M", "tracked.ts"),
  ]);
});

test("schema change without a new migration blocks", () => {
  const files = [file("M", "src/infrastructure/database/schema.prisma")];
  const finding = schemaWithoutMigration(files);
  assert.equal(finding.rule, "schema-without-migration");
  assert.equal(finding.severity, "block");
});

test("schema change with a new migration passes", () => {
  const files = [
    file("M", "src/infrastructure/database/schema.prisma"),
    file("A", "src/infrastructure/database/migrations/20260901000000_add_x/migration.sql"),
  ];
  assert.equal(schemaWithoutMigration(files), null);
});

test("no schema change means no finding", () => {
  assert.equal(schemaWithoutMigration([file("M", "src/domain/entities/Person.ts")]), null);
});

test("financial logic change without tests is review-required", () => {
  const files = [file("M", "src/domain/services/InstallmentPurchase.ts")];
  const finding = financialLogicWithoutTests(files);
  assert.equal(finding.rule, "financial-logic-without-tests");
  assert.equal(finding.severity, "review-required");
});

test("financial logic change with a matching test change passes", () => {
  const files = [
    file("M", "src/domain/services/InstallmentPurchase.ts"),
    file("M", "tests/domain/services/InstallmentPurchase.test.ts"),
  ];
  assert.equal(financialLogicWithoutTests(files), null);
});

test("domain change without a financial keyword is not flagged", () => {
  const files = [file("M", "src/domain/entities/Person.ts")];
  assert.equal(financialLogicWithoutTests(files), null);
});

test("API route change without validation or tests is review-required", () => {
  const files = [file("M", "src/app/api/people/route.ts")];
  const finding = apiRouteWithoutValidationOrTests(files);
  assert.equal(finding.rule, "api-route-without-validation-or-tests");
  assert.equal(finding.severity, "review-required");
});

test("API route change with a test change passes", () => {
  const files = [
    file("M", "src/app/api/people/route.ts"),
    file("M", "tests/app/api/people/route.test.ts"),
  ];
  assert.equal(apiRouteWithoutValidationOrTests(files), null);
});

test("protected harness file touched is always flagged, never blocking", () => {
  const finding = protectedHarnessFileTouched([file("M", "quality-baseline.json")]);
  assert.equal(finding.rule, "protected-harness-file-touched");
  assert.equal(finding.severity, "review-required");
});

test("flags every entry point that can weaken the harness", () => {
  const paths = [
    "package.json",
    "scripts/pr-checks/rules.cjs",
    "scripts/quality/ratchet.cjs",
    "stryker.config.mjs",
  ];
  const finding = protectedHarnessFileTouched(paths.map((path) => file("M", path)));
  assert.deepEqual(finding.files, paths);
});

test("evaluateDiff aggregates all rule findings", () => {
  const files = [file("M", "src/infrastructure/database/schema.prisma"), file("M", "AGENTS.md")];
  const findings = evaluateDiff(files);
  const rules = findings.map((f) => f.rule).sort();
  assert.deepEqual(rules, ["protected-harness-file-touched", "schema-without-migration"]);
});

test("formatFindings reports no findings cleanly", () => {
  assert.match(formatFindings([]), /No findings\./);
});

test("formatFindings labels blocking findings distinctly", () => {
  const markdown = formatFindings([
    { rule: "schema-without-migration", severity: "block", message: "x", files: ["a"] },
  ]);
  assert.match(markdown, /\(BLOCKING\)/);
});
