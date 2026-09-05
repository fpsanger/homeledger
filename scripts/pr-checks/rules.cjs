const SCHEMA_PATH = "src/infrastructure/database/schema.prisma";
const MIGRATIONS_PREFIX = "src/infrastructure/database/migrations/";
const FINANCIAL_ROOTS = ["src/domain/", "src/application/"];
const FINANCIAL_TEST_ROOTS = ["tests/domain/", "tests/application/"];
const FINANCIAL_KEYWORDS = [
  "amount",
  "cents",
  "installment",
  "closure",
  "fifo",
  "refund",
  "total",
  "balance",
];
const API_ROUTE_PATTERN = /^src\/app\/api\/.*\/route\.ts$/;
const API_LIB_PREFIX = "src/app/api/_lib/";
const PROTECTED_HARNESS_FILES = [
  "package.json",
  "quality-baseline.json",
  "scripts/quality/",
  "scripts/pr-checks/",
  "quality.config.json",
  "quality.biome.json",
  "stryker.config.mjs",
  "AGENTS.md",
  "CLAUDE.md",
  ".github/workflows/",
];

function matchesAny(filePath, prefixesOrPaths) {
  return prefixesOrPaths.some(
    (entry) => filePath === entry || (entry.endsWith("/") && filePath.startsWith(entry)),
  );
}

function schemaWithoutMigration(files) {
  const schemaTouched = files.some((f) => f.path === SCHEMA_PATH);
  if (!schemaTouched) return null;

  const migrationAdded = files.some(
    (f) => f.status === "A" && f.path.startsWith(MIGRATIONS_PREFIX),
  );
  if (migrationAdded) return null;

  return {
    rule: "schema-without-migration",
    severity: "block",
    message: `${SCHEMA_PATH} changed without a new file under ${MIGRATIONS_PREFIX}`,
    files: files.filter((f) => f.path === SCHEMA_PATH).map((f) => f.path),
  };
}

function financialLogicWithoutTests(files) {
  const financialFiles = files.filter(
    (f) =>
      matchesAny(f.path, FINANCIAL_ROOTS) &&
      FINANCIAL_KEYWORDS.some((keyword) => f.path.toLowerCase().includes(keyword)),
  );
  if (financialFiles.length === 0) return null;

  const hasTestChange = files.some((f) => matchesAny(f.path, FINANCIAL_TEST_ROOTS));
  if (hasTestChange) return null;

  return {
    rule: "financial-logic-without-tests",
    severity: "review-required",
    message:
      "Financial/domain logic changed without a corresponding change under tests/domain/** or tests/application/**",
    files: financialFiles.map((f) => f.path),
  };
}

function apiRouteWithoutValidationOrTests(files) {
  const routeFiles = files.filter((f) => API_ROUTE_PATTERN.test(f.path));
  if (routeFiles.length === 0) return null;

  const hasLibChange = files.some((f) => f.path.startsWith(API_LIB_PREFIX));
  const hasTestChange = files.some((f) => f.path.startsWith("tests/"));
  if (hasLibChange || hasTestChange) return null;

  return {
    rule: "api-route-without-validation-or-tests",
    severity: "review-required",
    message:
      "API route changed without a corresponding validation change under src/app/api/_lib/** or a test change",
    files: routeFiles.map((f) => f.path),
  };
}

function protectedHarnessFileTouched(files) {
  const protectedFiles = files.filter((f) => matchesAny(f.path, PROTECTED_HARNESS_FILES));
  if (protectedFiles.length === 0) return null;

  return {
    rule: "protected-harness-file-touched",
    severity: "review-required",
    message: "Change touches a protected harness file — requires human review",
    files: protectedFiles.map((f) => f.path),
  };
}

const RULES = [
  schemaWithoutMigration,
  financialLogicWithoutTests,
  apiRouteWithoutValidationOrTests,
  protectedHarnessFileTouched,
];

function evaluateDiff(files) {
  return RULES.map((rule) => rule(files)).filter(Boolean);
}

module.exports = {
  evaluateDiff,
  schemaWithoutMigration,
  financialLogicWithoutTests,
  apiRouteWithoutValidationOrTests,
  protectedHarnessFileTouched,
};
