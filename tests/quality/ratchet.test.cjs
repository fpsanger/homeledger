const assert = require("node:assert/strict");
const test = require("node:test");

const { compareSnapshots } = require("../../scripts/quality/ratchet.cjs");

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

test("accepts unchanged metrics", () => {
  assert.deepEqual(compareSnapshots(baseline, structuredClone(baseline)).regressions, []);
});

test("reports coverage decreases as regressions", () => {
  const current = structuredClone(baseline);
  current.coverage.branches = 69.99;

  assert.deepEqual(compareSnapshots(baseline, current).regressions, [
    "coverage.branches decreased from 70 to 69.99",
  ]);
});

test("reports violation-count increases as regressions", () => {
  const current = structuredClone(baseline);
  current.violations.complexity = 5;

  assert.deepEqual(compareSnapshots(baseline, current).regressions, [
    "violations.complexity increased from 4 to 5",
  ]);
});

test("reports improvements without treating them as regressions", () => {
  const current = structuredClone(baseline);
  current.coverage.lines = 82;
  current.violations.oversizedFiles = 2;

  assert.deepEqual(compareSnapshots(baseline, current), {
    regressions: [],
    improvements: [
      "coverage.lines increased from 81 to 82",
      "violations.oversizedFiles decreased from 3 to 2",
    ],
  });
});
