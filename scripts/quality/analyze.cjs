const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const FORBIDDEN_IMPORTS = {
  domain: new Set(["application", "infrastructure", "app", "components", "hooks", "lib"]),
  application: new Set(["infrastructure", "app", "components", "hooks"]),
  infrastructure: new Set(["app", "components", "hooks"]),
};
const FORBIDDEN_DOMAIN_PACKAGES = ["react", "react-dom", "next", "@prisma", "prisma"];

function isForbiddenDomainPackage(specifier) {
  return FORBIDDEN_DOMAIN_PACKAGES.some(
    (forbidden) => specifier === forbidden || specifier.startsWith(`${forbidden}/`),
  );
}

function analyzeSources(root, config) {
  const sourceRoot = path.join(root, "src");
  const files = listSourceFiles(sourceRoot);
  const fileSet = new Set(files);
  const dependencies = new Map(files.map((file) => [file, []]));
  const result = {
    architecture: [],
    circularDependencies: [],
    complexity: [],
  };

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const relativeFile = normalize(path.relative(root, file));
    const source = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    visitModuleSpecifiers(source, (specifier) => {
      const dependency = resolveSourceImport(root, file, specifier, fileSet);
      if (dependency) {
        dependencies.get(file).push(dependency);
        const fromLayer = layerOf(root, file);
        const toLayer = layerOf(root, dependency);
        if (FORBIDDEN_IMPORTS[fromLayer]?.has(toLayer)) {
          result.architecture.push({
            file: relativeFile,
            imports: normalize(path.relative(root, dependency)),
          });
        }
      } else if (layerOf(root, file) === "domain" && isForbiddenDomainPackage(specifier)) {
        result.architecture.push({ file: relativeFile, imports: specifier });
      }
    });
    source.forEachChild((node) => {
      visitFunctions(node, source, relativeFile, config.limits, result);
    });
  }

  result.circularDependencies = findCircularDependencies(dependencies).map((cycle) =>
    cycle.map((file) => normalize(path.relative(root, file))),
  );
  for (const entries of Object.values(result)) entries.sort(compareEntries);
  return result;
}

function visitFunctions(node, source, file, limits, result) {
  if (isFunctionWithBody(node)) {
    const startLine = lineNumber(source, node.getStart(source));
    const complexity = cyclomaticComplexity(node.body);
    const name = functionName(node, source);
    if (complexity > limits.cyclomaticComplexity) {
      result.complexity.push({ file, name, line: startLine, complexity });
    }
    node.body.forEachChild((child) => visitFunctions(child, source, file, limits, result));
    return;
  }
  node.forEachChild((child) => visitFunctions(child, source, file, limits, result));
}

function cyclomaticComplexity(body) {
  let complexity = 1;
  walk(body);
  return complexity;

  function walk(node) {
    if (node !== body && isFunctionWithBody(node)) return;
    if (
      ts.isIfStatement(node) ||
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isCatchClause(node) ||
      ts.isConditionalExpression(node) ||
      (ts.isCaseClause(node) && node.expression) ||
      (ts.isBinaryExpression(node) &&
        [
          ts.SyntaxKind.AmpersandAmpersandToken,
          ts.SyntaxKind.BarBarToken,
          ts.SyntaxKind.QuestionQuestionToken,
        ].includes(node.operatorToken.kind))
    ) {
      complexity += 1;
    }
    node.forEachChild(walk);
  }
}

function findCircularDependencies(graph) {
  let index = 0;
  const stack = [];
  const onStack = new Set();
  const indices = new Map();
  const lowLinks = new Map();
  const cycles = [];

  for (const node of [...graph.keys()].sort()) if (!indices.has(node)) connect(node);
  return cycles.sort(compareEntries);

  function connect(node) {
    indices.set(node, index);
    lowLinks.set(node, index++);
    stack.push(node);
    onStack.add(node);

    for (const dependency of [...new Set(graph.get(node))].sort()) {
      if (!indices.has(dependency)) {
        connect(dependency);
        lowLinks.set(node, Math.min(lowLinks.get(node), lowLinks.get(dependency)));
      } else if (onStack.has(dependency)) {
        lowLinks.set(node, Math.min(lowLinks.get(node), indices.get(dependency)));
      }
    }

    if (lowLinks.get(node) !== indices.get(node)) return;
    const component = [];
    let member;
    do {
      member = stack.pop();
      onStack.delete(member);
      component.push(member);
    } while (member !== node);
    const selfCycle = component.length === 1 && graph.get(node).includes(node);
    if (component.length > 1 || selfCycle) cycles.push(component.sort());
  }
}

function listSourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return listSourceFiles(target);
      return SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension)) &&
        !entry.name.endsWith(".d.ts")
        ? [target]
        : [];
    })
    .sort();
}

function resolveSourceImport(root, importer, specifier, fileSet) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(root, "src", specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(importer), specifier);
  else return null;

  for (const candidate of [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ]) {
    if (fileSet.has(candidate)) return candidate;
  }
  return null;
}

function moduleSpecifier(node) {
  if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
    return ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : null;
  }
  if (
    ts.isImportEqualsDeclaration(node) &&
    ts.isExternalModuleReference(node.moduleReference) &&
    node.moduleReference.expression &&
    ts.isStringLiteral(node.moduleReference.expression)
  ) {
    return node.moduleReference.expression.text;
  }
  if (
    ts.isCallExpression(node) &&
    node.arguments.length === 1 &&
    ts.isStringLiteral(node.arguments[0]) &&
    (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      (ts.isIdentifier(node.expression) && node.expression.text === "require"))
  ) {
    return node.arguments[0].text;
  }
  return null;
}

function visitModuleSpecifiers(node, visitor) {
  const specifier = moduleSpecifier(node);
  if (specifier) visitor(specifier);
  node.forEachChild((child) => visitModuleSpecifiers(child, visitor));
}

function isFunctionWithBody(node) {
  return (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node) ||
      ts.isConstructorDeclaration(node)) &&
    node.body
  );
}

function functionName(node, source) {
  if (node.name) return node.name.getText(source);
  if (ts.isVariableDeclaration(node.parent) && node.parent.name) return node.parent.name.getText(source);
  return "<anonymous>";
}

function layerOf(root, file) {
  return normalize(path.relative(path.join(root, "src"), file)).split("/")[0];
}

function lineNumber(source, position) {
  return source.getLineAndCharacterOfPosition(position).line + 1;
}

function normalize(value) {
  return value.split(path.sep).join("/");
}

function compareEntries(a, b) {
  return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

module.exports = { analyzeSources };
