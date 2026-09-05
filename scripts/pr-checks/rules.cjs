const SCHEMA_PATH = "src/infrastructure/database/schema.prisma";
const MIGRATIONS_PREFIX = "src/infrastructure/database/migrations/";
const FINANCIAL_ROOTS = [
  "src/domain/entities/",
  "src/domain/services/",
  "src/application/services/",
  "src/application/use-cases/",
];
const API_ROUTE_PATTERN = /^src\/app\/api\/.*\/route\.ts$/;
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
  const changedTests = new Set(files.filter((f) => f.status !== "D").map((f) => f.path));
  const untestedFiles = files.filter(
    (file) =>
      file.status !== "D" &&
      matchesAny(file.path, FINANCIAL_ROOTS) &&
      !correspondingTestPaths(file.path).some((testPath) => changedTests.has(testPath)),
  );
  if (untestedFiles.length === 0) return null;

  return {
    rule: "financial-logic-without-tests",
    severity: "review-required",
    message:
      "Financial/domain logic changed without a corresponding mirrored test change",
    files: untestedFiles.map((f) => f.path),
  };
}

function correspondingTestPaths(sourcePath) {
  const testPath = sourcePath
    .replace(/^src\/domain\//, "tests/domain/")
    .replace(/^src\/application\//, "tests/application/")
    .replace(/\.(ts|tsx)$/, ".test.$1");
  return [testPath];
}

function apiRouteWithoutValidationOrTests(files) {
  const routeFiles = files.filter((f) => f.status !== "D" && API_ROUTE_PATTERN.test(f.path));
  if (routeFiles.length === 0) return null;

  const changedPaths = new Set(files.filter((f) => f.status !== "D").map((f) => f.path));
  const uncoveredRoutes = routeFiles.filter(
    (route) => !apiCompanionPaths(route.path).some((candidate) => changedPaths.has(candidate)),
  );
  if (uncoveredRoutes.length === 0) return null;

  return {
    rule: "api-route-without-validation-or-tests",
    severity: "review-required",
    message:
      "API route changed without a route-specific validation module or corresponding test change",
    files: uncoveredRoutes.map((f) => f.path),
  };
}

function apiCompanionPaths(routePath) {
  const routeDirectory = routePath.slice(0, -"/route.ts".length);
  const resource = routeDirectory.slice("src/app/api/".length);
  const e2eName = resource.replace(/\[([^\]]+)\]/g, "$1").replaceAll("/", "-");
  return [
    `${routeDirectory}/validation.ts`,
    `${routeDirectory}/schema.ts`,
    `tests/app/api/${resource}/route.test.ts`,
    `tests/app/api/${resource}/route.test.tsx`,
    `tests/e2e/${e2eName}.spec.ts`,
  ];
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
