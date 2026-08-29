const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { analyzeSources } = require("./analyze.cjs");
const {
  countSizeViolations,
  runBiomeSizeAnalysis,
  sizeViolationDetails,
} = require("./biome.cjs");

const root = path.resolve(__dirname, "../..");
const config = JSON.parse(fs.readFileSync(path.join(root, "quality.config.json"), "utf8"));
const jest = path.join(root, "node_modules/jest/bin/jest.js");

execFileSync(process.execPath, [jest, "--coverage", "--coverageReporters=json-summary", "--runInBand"], {
  cwd: root,
  stdio: "inherit",
});

const coverageSummary = JSON.parse(
  fs.readFileSync(path.join(root, "coverage/coverage-summary.json"), "utf8"),
).total;
const analysis = analyzeSources(root, config);
const biomeReport = runBiomeSizeAnalysis(root);
const sizeViolations = countSizeViolations(biomeReport);
const sizeDetails = sizeViolationDetails(biomeReport);
const snapshot = {
  coverage: {
    statements: coverageSummary.statements.pct,
    branches: coverageSummary.branches.pct,
    functions: coverageSummary.functions.pct,
    lines: coverageSummary.lines.pct,
  },
  violations: {
    architecture: analysis.architecture.length,
    circularDependencies: analysis.circularDependencies.length,
    complexity: analysis.complexity.length,
    oversizedFiles: sizeViolations.oversizedFiles,
    oversizedFunctions: sizeViolations.oversizedFunctions,
  },
  details: { ...analysis, ...sizeDetails },
};

const target = path.join(root, "quality-snapshot.json");
fs.writeFileSync(target, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Quality snapshot written to ${path.relative(root, target)}`);
console.log(JSON.stringify({ coverage: snapshot.coverage, violations: snapshot.violations }, null, 2));
