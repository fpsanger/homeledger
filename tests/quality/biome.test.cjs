const assert = require("node:assert/strict");
const test = require("node:test");

const { countSizeViolations } = require("../../scripts/quality/biome.cjs");

test("counts only Biome file and function size diagnostics", () => {
  const report = {
    diagnostics: [
      { category: "lint/nursery/noExcessiveLinesPerFile" },
      { category: "lint/complexity/noExcessiveLinesPerFunction" },
      { category: "lint/complexity/noExcessiveLinesPerFunction" },
      { category: "lint/correctness/noUnusedVariables" },
    ],
  };

  assert.deepEqual(countSizeViolations(report), {
    oversizedFiles: 1,
    oversizedFunctions: 2,
  });
});
