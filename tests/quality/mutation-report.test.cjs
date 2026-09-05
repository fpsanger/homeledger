const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildReport,
  formatReport,
  scoreForMutants,
} = require("../../scripts/quality/mutation-report.cjs");

test("computes a mutation score from killed/timeout vs survived/noCoverage", () => {
  const mutants = [
    { status: "Killed" },
    { status: "Killed" },
    { status: "Survived" },
    { status: "NoCoverage" },
  ];
  assert.equal(scoreForMutants(mutants), 50);
});

test("returns null when there are no countable mutants", () => {
  assert.equal(scoreForMutants([{ status: "Ignored" }]), null);
});

test("builds a sorted per-file report", () => {
  const rows = buildReport({
    files: {
      "src/b.ts": { mutants: [{ status: "Killed" }] },
      "src/a.ts": { mutants: [{ status: "Survived" }] },
    },
  });
  assert.deepEqual(
    rows.map((r) => r.file),
    ["src/a.ts", "src/b.ts"],
  );
  assert.equal(rows[0].score, 0);
  assert.equal(rows[1].score, 100);
});

test("formatReport renders a markdown table", () => {
  const markdown = formatReport([{ file: "src/a.ts", score: 75, mutants: 4 }]);
  assert.match(markdown, /## Mutation score by file/);
  assert.match(markdown, /\| src\/a\.ts \| 75\.0% \| 4 \|/);
});

test("formatReport handles an empty report", () => {
  assert.match(formatReport([]), /No mutation report data found\./);
});
