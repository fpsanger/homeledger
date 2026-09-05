const assert = require("node:assert/strict");
const test = require("node:test");

const { compareSnapshots, formatViolation } = require("../../scripts/quality/ratchet.cjs");

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

test("formats architecture violations with file and target", () => {
  assert.equal(
    formatViolation("architecture", { file: "src/domain/example.ts", imports: "react" }),
    "  - src/domain/example.ts imports react (forbidden by layering rules)",
  );
});

test("formats complexity violations with file, line, function, and value", () => {
  assert.equal(
    formatViolation("complexity", {
      file: "src/domain/decide.ts",
      line: 12,
      name: "decide",
      complexity: 14,
    }),
    "  - src/domain/decide.ts:12 function `decide` has cyclomatic complexity 14",
  );
});

test("formats oversized-file violations using the Biome diagnostic message", () => {
  assert.equal(
    formatViolation("oversizedFiles", {
      message: "This file has too many lines (843). Maximum allowed is 400.",
      location: { path: "src/components/credit-cards/BillView.tsx", start: { line: 1 } },
    }),
    "  - src/components/credit-cards/BillView.tsx:1 This file has too many lines (843). Maximum allowed is 400.",
  );
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
