const fs = require("node:fs");
const path = require("node:path");

const KILLED_LIKE = new Set(["Killed", "Timeout"]);
const COUNTED = new Set(["Killed", "Timeout", "Survived", "NoCoverage"]);

function scoreForMutants(mutants) {
  const counted = mutants.filter((m) => COUNTED.has(m.status));
  if (counted.length === 0) return null;
  const killed = counted.filter((m) => KILLED_LIKE.has(m.status)).length;
  return (killed / counted.length) * 100;
}

function buildReport(mutationReport) {
  const files = mutationReport.files ?? {};
  const rows = Object.entries(files)
    .map(([file, data]) => ({
      file,
      score: scoreForMutants(data.mutants ?? []),
      mutants: (data.mutants ?? []).length,
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
  return rows;
}

function formatReport(rows) {
  if (rows.length === 0) return "## Mutation score by file\n\nNo mutation report data found.\n";

  const lines = ["## Mutation score by file", "", "| File | Score | Mutants |", "| --- | --- | --- |"];
  for (const row of rows) {
    const score = row.score === null ? "n/a" : `${row.score.toFixed(1)}%`;
    lines.push(`| ${row.file} | ${score} | ${row.mutants} |`);
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const root = path.resolve(__dirname, "../..");
  const reportPath = path.join(root, "reports/mutation/mutation.json");
  if (!fs.existsSync(reportPath)) {
    console.error(`No mutation report found at ${path.relative(root, reportPath)}.`);
    console.error("Run `npm run mutation:test` first.");
    process.exitCode = 1;
    return;
  }

  const mutationReport = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const rows = buildReport(mutationReport);
  const markdown = formatReport(rows);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  }
  console.log(markdown);
}

if (require.main === module) main();

module.exports = { buildReport, formatReport, scoreForMutants };
