const assert = require("node:assert/strict");
const test = require("node:test");

const { createUpdatedBaseline } = require("../../scripts/quality/update-baseline.cjs");

const baseline = {
  coverage: { statements: 80, branches: 70, functions: 75, lines: 81 },
  violations: {
    architecture: 2,
    circularDependencies: 1,
    complexity: 4,
    oversizedFiles: 3,
    oversizedFunctions: 5,
  },
};

test("promotes improved metrics without copying snapshot details", () => {
  const snapshot = structuredClone(baseline);
  snapshot.coverage.lines = 82;
  snapshot.violations.oversizedFiles = 2;
  snapshot.details = { oversizedFiles: [{ path: "src/large.ts" }] };

  assert.deepEqual(createUpdatedBaseline(baseline, snapshot), {
    coverage: { statements: 80, branches: 70, functions: 75, lines: 82 },
    violations: {
      architecture: 2,
      circularDependencies: 1,
      complexity: 4,
      oversizedFiles: 2,
      oversizedFunctions: 5,
    },
  });
});

test("rejects a snapshot containing regressions", () => {
  const snapshot = structuredClone(baseline);
  snapshot.coverage.lines = 80;

  assert.throws(
    () => createUpdatedBaseline(baseline, snapshot),
    /Cannot update quality baseline: coverage\.lines decreased from 81 to 80/,
  );
});
