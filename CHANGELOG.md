# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning while it remains in active personal development.

## [Unreleased]

### Added

- Added a repository quality ratchet POC covering test coverage, architecture and circular
  dependency violations, cyclomatic complexity, and source/function size regressions.
- Added a safe `quality:baseline:update` command that promotes reviewed quality improvements while
  refusing snapshots containing regressions.
- Added duplicate detection for investments: same amount/date within 30 days is flagged via `isDuplicate`, with a live warning in `InvestmentForm`, matching existing expense/income checks.
- Added duplicate detection for recurring transactions: an active rule with the same type and amount in the same household is flagged via `isDuplicate` on creation.
- Added `closureNextMonth` flag to credit cards. When enabled, the closure day is treated as falling in the month after the purchase, so all purchases in the current month go to the current month's bill. Fixes incorrect next-month assignment for cards with closure day 1 or other next-month closure configurations.
- Added GitHub Actions CI for tests, Prisma validation, migration replay, Biome checks, TypeScript checks, and production builds.
- Added credit card refunds: a standalone credit against a card's bill, entered manually or recognized during statement import, that reduces the bill total for its billing month. Statement imports (PDF and Bradesco/BTG/C6 CSV) now correctly classify credit-card credit/estorno lines as refunds instead of miscategorizing them as personal income.

### Changed

- Refined project documentation for local maintenance and release tracking.
- Updated the GitHub Release workflow to create releases from merged `develop` to `master` pull requests using the version from `package.json`.
- Extracted credit card closure-month resolution into a shared `resolveClosureForDate` helper, reused by both installment purchases and refunds.
- Reduced oversized-function/file quality-gate violations: extracted filter/sort state out of `BillView`'s `CardInstallmentTable` into `useInstallmentFilters`, split `Step1Upload` into a data-fetch hook plus presentational sub-components, and split `InstallmentTable` into `useInstallmentActions`, `useFilteredSortedInstallments`, and an `InstallmentSummaryPanel` component. No behavior changes.

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
