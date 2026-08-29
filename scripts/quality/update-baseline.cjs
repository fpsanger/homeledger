const fs = require("node:fs");
const path = require("node:path");
const { compareSnapshots } = require("./ratchet.cjs");

function createUpdatedBaseline(baseline, snapshot) {
  const { regressions } = compareSnapshots(baseline, snapshot);

  if (regressions.length > 0) {
    throw new Error(`Cannot update quality baseline: ${regressions.join("; ")}`);
  }

  return {
    coverage: { ...snapshot.coverage },
    violations: { ...snapshot.violations },
  };
}

function main() {
  const root = path.resolve(__dirname, "../..");
  const baselinePath = path.join(root, "quality-baseline.json");
  const snapshotPath = path.join(root, "quality-snapshot.json");
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const updatedBaseline = createUpdatedBaseline(baseline, snapshot);

  fs.writeFileSync(baselinePath, `${JSON.stringify(updatedBaseline, null, 2)}\n`);
  console.log("Quality baseline updated from quality-snapshot.json.");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createUpdatedBaseline };
