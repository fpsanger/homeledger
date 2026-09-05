// Advisory-only, scoped mutation testing. Run manually (`npm run mutation:test`) or via the
// non-required scheduled workflow (.github/workflows/mutation.yml) — never as part of
// `npm run agent:check`/`verify:fast`, since it is far slower than the required fast loop.
// Scope starts with three high-value domain services so reports stay fast and actionable.
// See AGENTS.md's "Mutation testing" note for rationale.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "npm",
  testRunner: "jest",
  jest: {
    configFile: "package.json",
  },
  coverageAnalysis: "perTest",
  reporters: ["html", "json", "clear-text", "progress"],
  htmlReporter: {
    fileName: "reports/mutation/mutation.html",
  },
  jsonReporter: {
    fileName: "reports/mutation/mutation.json",
  },
  mutate: [
    "src/domain/services/InstallmentPurchase.ts",
    "src/domain/services/RecurringTransaction.ts",
    "src/domain/services/MonthlyView.ts",
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 60,
  },
};
