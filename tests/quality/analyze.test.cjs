const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { analyzeSources } = require("../../scripts/quality/analyze.cjs");

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "homeledger-quality-"));
  for (const [relativePath, contents] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  return root;
}

test("counts architecture violations and dependency cycles", () => {
  const root = fixture({
    "src/domain/a.ts": 'import { b } from "@/application/b"; export const a = b;',
    "src/application/b.ts": 'import { c } from "@/infrastructure/c"; export const b = c;',
    "src/infrastructure/c.ts": 'import { b } from "@/application/b"; export const c = b;',
  });

  const result = analyzeSources(root, {
    limits: { cyclomaticComplexity: 10, fileLines: 400, functionLines: 80 },
  });

  assert.equal(result.architecture.length, 2);
  assert.equal(result.circularDependencies.length, 1);
});

test("flags domain imports of forbidden framework packages", () => {
  const root = fixture({
    "src/domain/example.ts": 'import { useState } from "react"; export const x = useState;',
  });

  const result = analyzeSources(root, {
    limits: { cyclomaticComplexity: 10, fileLines: 400, functionLines: 80 },
  });

  assert.equal(result.architecture.length, 1);
  assert.deepEqual(result.architecture[0], { file: "src/domain/example.ts", imports: "react" });
});

test("counts cyclomatic complexity violations", () => {
  const root = fixture({
    "src/domain/example.ts": [
      "export function decide(a: boolean, b: boolean) {",
      "  if (a && b) {",
      "    return 1;",
      "  }",
      "  return 0;",
      "}",
    ].join("\n"),
  });

  const result = analyzeSources(root, {
    limits: { cyclomaticComplexity: 2, fileLines: 5, functionLines: 5 },
  });

  assert.equal(result.complexity.length, 1);
});
