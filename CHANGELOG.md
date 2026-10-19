# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning while it remains in active personal development.

## [Unreleased]

### Added

- Credit-card purchases and refunds now have a "Fatura (mês)" field for the bill they land on. For FIXED-closure cards it is pre-filled from the closure day and can be changed; for VARIABLE-closure cards the user picks it (it starts on the purchase month). The installment preview follows the chosen bill. `POST /api/installments` and `POST /api/credit-card-refunds` accept an optional `billingMonth` (`YYYY-MM`), which is required for VARIABLE cards.
- Bulk credit-card purchases (`/credit-cards/bulk-add`) have one "Fatura" per card section, applied to every row, so many purchases for the same bill can be entered at once. A row can switch to its own bill with the "Outra fatura" button. VARIABLE sections default to the current month; FIXED sections can be left empty to compute each row's bill from its date.
- Installment rows on the mixed bulk-add page also accept a "Fatura (mês)", which is pre-filled when a VARIABLE card is picked. The statement import now sends each item's exact bill, derived from the statement month and installment number.

### Fixed

- Popovers built on the shared `PopoverContent` primitive no longer render with a transparent background: the `popover` color token (used by `bg-popover`) was missing from the theme and is now defined with the card surface colors in light and dark mode.

### Removed

- Removed per-month closure dates for VARIABLE-closure cards: the "Gerenciar Fechamentos" dialog, the `/api/credit-cards/[id]/closures` endpoints, and the "Primeira parcela sempre vai para o mês seguinte" (`alwaysNextMonth`) option. The `CreditCardClosure` table and the `CreditCard.alwaysNextMonth` column are dropped by migration `20261019120000_drop_variable_closures`. Installments and refunds that already exist keep their stored bill month.

## [2.2.0] - 2026-09-05

### Added

- Added a deterministic monthly-ledger E2E scenario, scoped Stryker mutation testing, and diff-aware PR checks for migrations, financial tests, API validation, and harness changes.

- Credit-card installment purchases can now be split between multiple people, each with their own (possibly unequal) share. In the "Nova compra"/"Compra com Cartão" form (`/installments` and elsewhere `UnifiedTransactionForm` is used), toggling "Dividir com outras pessoas" after entering the total replaces the single person field with a list of people and per-person amounts that must sum to the total. If the global person filter is active, that person is pre-seeded as the first split row (still editable/removable) instead of starting empty. Each person's installments are tracked (and can be marked paid) independently; dashboards, bills, and reports attribute each installment to its own person. Editing the total amount of an already-split purchase is not supported yet and is rejected with an error.
- The credit-card purchase form also accepts an alternate entry order: "Informar valor da parcela" lets you type the value of a single installment first, then pick the total from a "Nx = R$ Y" dropdown, instead of entering the total up front and picking the installment count.
- Bulk credit-card purchase rows on `/credit-cards/bulk-add` now accept a single installment (1x, à vista). The installment dropdown offers 1x–12x instead of 2x–12x; new rows still default to 2x.
- Bulk credit-card purchase rows now have a copy button next to the trash icon that starts a new row below, carrying over the category, number of installments and description.

### Changed

- Tightened PR diff heuristics so financial and API changes require corresponding tests or
  route-local validation instead of being satisfied by unrelated test changes.

- Consolidated CI lint, typecheck, tests, quality ratchet, build, and Prisma validation behind the canonical `agent:check` command while keeping database, Playwright, and mutation jobs separate.

- Simplified agent documentation and made local PR review include committed, staged, unstaged, and untracked changes.

- The bulk credit-card purchase page now returns to the transactions page: its `Voltar` link points at `/transactions`, and a batch where every purchase saved navigates there automatically. A batch with failures stays on the page so the failed rows can be fixed.

### Fixed

- Prevented stale totals when switching to installment-value entry and prevented deleting one
  participant from cascading into other participants' split installments.

## [2.1.0] - 2026-08-29

### Added

- Added a repository quality ratchet POC covering test coverage, architecture and circular
  dependency violations, cyclomatic complexity, and source/function size regressions.
- Added a safe `quality:baseline:update` command that promotes reviewed quality improvements while
  refusing snapshots containing regressions.
- Added duplicate detection for investments: same amount/date within 30 days is flagged via `isDuplicate`, with a live warning in `InvestmentForm`, matching existing expense/income checks.
- Added duplicate detection for recurring transactions: an active rule with the same type and amount in the same household is flagged via `isDuplicate` on creation.
- Added `closureNextMonth` flag to credit cards. When enabled, the closure day is treated as falling in the month after the purchase, so all purchases in the current month go to the current month's bill. Fixes incorrect next-month assignment for cards with closure day 1 or other next-month closure configurations.
- Added GitHub Actions CI for tests, Prisma validation, migration replay, Biome checks, TypeScript checks, and production builds.
- The repository now documents and supports the Claude implementation, deterministic CI,
  risk-based Codex review, ready-for-review PR, and human-approval workflow.
- Added a complete `npm run verify` gate and clarified the tested manual Codex review flow and the
  current GitHub branch-protection limitation.
- Added credit card refunds: a standalone credit against a card's bill, entered manually or recognized during statement import, that reduces the bill total for its billing month. Statement imports (PDF and Bradesco/BTG/C6 CSV) now correctly classify credit-card credit/estorno lines as refunds instead of miscategorizing them as personal income.

### Changed

- Simplified repository AI instructions and pull-request workflow around one implementation agent,
  deterministic CI, risk-based independent Codex review, and human-controlled merges.
- Removed stale generated repository-map context, redundant custom agents, duplicate design-skill
  files, and tracked machine-local AI configuration.
- Consolidated duplicate Jest execution, added a fast verification command, pinned GitHub Actions,
  enabled Dependabot updates, and made Playwright create isolated prerequisite fixtures.
- Refined project documentation for local maintenance and release tracking.
- Updated the GitHub Release workflow to create releases from merged `develop` to `master` pull requests using the version from `package.json`.
- Extracted credit card closure-month resolution into a shared `resolveClosureForDate` helper, reused by both installment purchases and refunds.
- Reduced oversized-function/file quality-gate violations: extracted filter/sort state out of `BillView`'s `CardInstallmentTable` into `useInstallmentFilters`, split `Step1Upload` into a data-fetch hook plus presentational sub-components, and split `InstallmentTable` into `useInstallmentActions`, `useFilteredSortedInstallments`, and an `InstallmentSummaryPanel` component. No behavior changes.
- Moved the Pessoa field in the bulk credit-card purchase form (`/credit-cards/bulk-add`) from a single top-level field into each card's own section, shown after the card is added.

### Fixed

- The "Nova transação" and "Novo estorno" dialogs in the credit card bill view now prefill Pessoa from the global person filter, matching the behavior already used in other add forms across the app.

### Removed

- Removed unused code: the orphaned `normalizeDescription` domain service, the superseded `TransactionTabs` component, the deprecated `ClosureManager` wrapper (use `ClosureManagerDialog`), the unused `personShade` helper, the unreferenced `isCircularReference`/`computeUpdatedLevels`/`buildCategoryTree` functions in `CategoryTree`, and the unused `tw-animate-css` dependency. No behavior changes.

## [0.1.0] - 2026-05-14

### Added

- Initialized the Homeledger product as a personal finance app for a single household.
- Added a Next.js 14 application with TypeScript, App Router, Tailwind CSS, and reusable UI components.
- Added PostgreSQL persistence with Prisma 7, Docker Compose, migrations, and a Prisma client singleton.
- Added Clean Architecture layers for domain rules, application use cases, infrastructure repositories, API routes, and UI.
- Added people management for household members.
- Added expense transactions with person, amount, date, description, payment method, and optional category.
- Added income transactions with source classification.
- Added hierarchical categories with path and level calculation.
- Added category tree behavior, including circular-reference checks, leaf validation, deletion checks, and path cascade updates.
- Added monthly financial views that combine regular transactions and credit card installments.
- Added recurring monthly transactions with start and optional end dates.
- Added credit cards with fixed and variable closure dates.
- Added credit card purchases with installment generation.
- Added installment management, including paid/unpaid state, bulk paid/unpaid actions, canceled purchase handling, and monthly filtering.
- Added credit card bill views.
- Added dashboard and annual report views with monthly summaries, income/expense/balance cards, category breakdowns, and annual charts.
- Added duplicate warnings for regular transactions and credit card purchases.
- Added transaction editing flows for expenses, incomes, and installments.
- Added category selection through a reusable category combobox.
- Added toast notifications for user feedback.
- Added PWA support with manifest and app icons.
- Added domain, application, service, and repository tests with Jest and ts-jest.
- Added Biome for linting and formatting.
- Added project specs and implementation plans under `docs/superpowers`.
- Added Graphify output for repository navigation.

### Changed

- Renamed the expenses-focused transaction surface to support both expenses and incomes.
- Made `paymentMethod` nullable for income transactions.
- Consolidated transaction records around the `INCOME` and `EXPENSE` types.
- Updated category uniqueness so root category names are unique without household coupling.
- Updated the monthly view to exclude canceled installments.
- Updated installment rounding so the final installment absorbs cent differences and totals match the purchase amount.
- Updated installment purchase validation for one-time and multi-installment credit card purchases.
- Updated repository contracts and implementations to match the single-household product model.
- Removed stale workspace/user assumptions from the core domain model.

### Fixed

- Fixed installment amount calculation so monthly views do not duplicate full purchase totals across installments.
- Fixed number-of-installments validation for credit card purchase flows.
- Fixed handling for one-installment credit card purchases.
- Fixed duplicate detection coverage for credit card purchases.
- Fixed category editing edge cases around duplicate names and category hierarchy.
- Fixed canceled installments leaking into monthly financial views.
