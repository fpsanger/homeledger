const fs = require("node:fs");
const path = require("node:path");

const COVERAGE_METRICS = ["statements", "branches", "functions", "lines"];
const VIOLATION_METRICS = [
  "architecture",
  "circularDependencies",
  "complexity",
  "oversizedFiles",
  "oversizedFunctions",
];

function compareSnapshots(baseline, current) {
  const regressions = [];
  const improvements = [];

  for (const metric of COVERAGE_METRICS) {
    compare(metric, baseline.coverage[metric], current.coverage[metric], "coverage", true);
  }
  for (const metric of VIOLATION_METRICS) {
    compare(
      metric,
      baseline.violations[metric],
      current.violations[metric],
      "violations",
      false,
    );
  }

  return { regressions, improvements };

  function compare(metric, before, after, group, higherIsBetter) {
    if (typeof before !== "number" || typeof after !== "number") {
      throw new Error(`Missing numeric metric: ${group}.${metric}`);
    }
    if (before === after) return;

    const improved = higherIsBetter ? after > before : after < before;
    const direction = after > before ? "increased" : "decreased";
    const message = `${group}.${metric} ${direction} from ${before} to ${after}`;
    (improved ? improvements : regressions).push(message);
  }
}

function main() {
  const root = path.resolve(__dirname, "../..");
  const baseline = JSON.parse(fs.readFileSync(path.join(root, "quality-baseline.json"), "utf8"));
  const current = JSON.parse(fs.readFileSync(path.join(root, "quality-snapshot.json"), "utf8"));
  const result = compareSnapshots(baseline, current);

  for (const message of result.improvements) console.log(`IMPROVEMENT: ${message}`);
  for (const message of result.regressions) console.error(`REGRESSION: ${message}`);

  if (result.regressions.length > 0) {
    console.error(`Quality ratchet failed with ${result.regressions.length} regression(s).`);
    process.exitCode = 1;
  } else {
    console.log("Quality ratchet passed: no protected metric regressed.");
  }
}

if (require.main === module) main();

module.exports = { compareSnapshots };

