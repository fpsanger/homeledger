const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { evaluateDiff } = require("./rules.cjs");

function parseArgs(argv) {
  const args = { base: "origin/develop", head: "HEAD" };
  for (const entry of argv) {
    const match = /^--(base|head)=(.*)$/.exec(entry);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function parseNameStatus(output) {
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split("\t");
      return { status: status[0], path: rest[rest.length - 1] };
    });
}

function diffFiles(base, head, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const committed = parseNameStatus(
    execFileSync("git", ["diff", "--name-status", `${base}...${head}`], {
      cwd,
      encoding: "utf8",
    }),
  );
  if (!options.includeWorkingTree) return committed;

  const workingTree = parseNameStatus(
    execFileSync("git", ["diff", "--name-status", "HEAD"], { cwd, encoding: "utf8" }),
  );
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean)
    .map((file) => ({ status: "A", path: file }));

  return [...new Map([...committed, ...workingTree, ...untracked].map((file) => [file.path, file])).values()]
    .sort((a, b) => a.path.localeCompare(b.path));
}

function formatFindings(findings) {
  if (findings.length === 0) {
    return "## PR diff review\n\nNo findings.\n";
  }

  const lines = ["## PR diff review", ""];
  for (const finding of findings) {
    const label = finding.severity === "block" ? "BLOCKING" : "review required";
    lines.push(`### ${finding.rule} (${label})`, "", finding.message, "");
    for (const file of finding.files) lines.push(`- ${file}`);
    lines.push("");
  }
  return lines.join("\n");
}

function main() {
  const root = path.resolve(__dirname, "../..");
  const { base, head } = parseArgs(process.argv.slice(2));
  const files = diffFiles(base, head, { cwd: root, includeWorkingTree: true });
  const findings = evaluateDiff(files);
  const markdown = formatFindings(findings);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  } else {
    console.log(markdown);
  }

  const blocking = findings.filter((f) => f.severity === "block");
  if (blocking.length > 0) {
    for (const finding of blocking) console.error(`BLOCKING: ${finding.rule} — ${finding.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { diffFiles, formatFindings };
