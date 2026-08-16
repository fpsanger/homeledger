const { execFileSync } = require("node:child_process");
const path = require("node:path");

const FILE_RULE = "lint/nursery/noExcessiveLinesPerFile";
const FUNCTION_RULE = "lint/complexity/noExcessiveLinesPerFunction";

function runBiomeSizeAnalysis(root) {
  const biome = path.join(root, "node_modules/@biomejs/biome/bin/biome");
  const output = execFileSync(
    biome,
    ["lint", "--config-path=quality.biome.json", "--reporter=json", "src"],
    { cwd: root, encoding: "utf8" },
  );
  return JSON.parse(output);
}

function countSizeViolations(report) {
  return {
    oversizedFiles: report.diagnostics.filter((item) => item.category === FILE_RULE).length,
    oversizedFunctions: report.diagnostics.filter((item) => item.category === FUNCTION_RULE).length,
  };
}

function sizeViolationDetails(report) {
  return {
    oversizedFiles: report.diagnostics.filter((item) => item.category === FILE_RULE),
    oversizedFunctions: report.diagnostics.filter((item) => item.category === FUNCTION_RULE),
  };
}

module.exports = { countSizeViolations, runBiomeSizeAnalysis, sizeViolationDetails };
