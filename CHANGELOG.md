# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning while it remains in active personal development.

## [Unreleased]

### Changed

- Refined project documentation for local maintenance and release tracking.

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
