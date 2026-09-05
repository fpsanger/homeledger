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

function formatViolation(metric, violation) {
  switch (metric) {
    case "architecture":
      return `  - ${violation.file} imports ${violation.imports} (forbidden by layering rules)`;
    case "circularDependencies":
      return `  - cycle: ${violation.join(" -> ")}`;
    case "complexity":
      return `  - ${violation.file}:${violation.line} function \`${violation.name}\` has cyclomatic complexity ${violation.complexity}`;
    case "oversizedFiles":
    case "oversizedFunctions":
      return `  - ${violation.location?.path ?? "unknown file"}:${violation.location?.start?.line ?? "?"} ${violation.message}`;
    default:
      return `  - ${JSON.stringify(violation)}`;
  }
}

function printRegressionDetails(metric, details) {
  const entries = details?.[metric];
  if (!Array.isArray(entries) || entries.length === 0) return;
  for (const entry of entries) console.error(formatViolation(metric, entry));
}

function main() {
  const root = path.resolve(__dirname, "../..");
  const baseline = JSON.parse(fs.readFileSync(path.join(root, "quality-baseline.json"), "utf8"));
  const current = JSON.parse(fs.readFileSync(path.join(root, "quality-snapshot.json"), "utf8"));
  const result = compareSnapshots(baseline, current);

  for (const message of result.improvements) console.log(`IMPROVEMENT: ${message}`);
  for (const message of result.regressions) {
    console.error(`REGRESSION: ${message}`);
    const metric = message.split(".")[1]?.split(" ")[0];
    printRegressionDetails(metric, current.details);
  }

  if (result.regressions.length > 0) {
    console.error(`Quality ratchet failed with ${result.regressions.length} regression(s).`);
    process.exitCode = 1;
  } else {
    console.log("Quality ratchet passed: no protected metric regressed.");
  }
}

if (require.main === module) main();

module.exports = { compareSnapshots, formatViolation };

