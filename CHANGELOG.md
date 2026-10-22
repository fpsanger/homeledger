# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning while it remains in active personal development.

## [Unreleased]

### Added

- Pushes to `develop` that pass CI now deploy themselves to the self-hosted instance reached over Tailscale. `.github/workflows/deploy.yml` runs on a self-hosted GitHub Actions runner on that host and calls `deploy/deploy.sh`, which builds each commit into `/srv/homeledger/releases/<sha>`, runs `prisma migrate deploy`, repoints the `current` symlink atomically, restarts `homeledger.service`, and rolls back to the previous release if the service does not answer `/api/health` within 60 seconds. The build runs before migrations, so a failed build cannot leave the schema ahead of the running code; migrations must therefore be backward-compatible with the previous release, since a rollback reverts code and not schema. Manual redeploys and rollbacks are available from the workflow's `ref` input. Host setup, the systemd units and the operational caveats are documented in `docs/deployment.md`.
- `GET /api/health` returns `200 {"status":"ok"}` once the database answers a `SELECT 1`, and `503 {"status":"error","error":...}` when it does not. It backs the deploy health gate and the uptime timer.
- A `homeledger-healthcheck` systemd timer probes `/api/health` every five minutes, restarts the app once if the probe fails, and on success pings an optional `HOMELEDGER_HEARTBEAT_URL`. That heartbeat acts as a dead man's switch, so a host that is off or without power is also detected.

- Recurring transactions can now be edited from a chosen month onward. The "Editar" action is available on recurring rows in the transactions table and opens a dialog whose "Alterar a partir de" month defaults to the month of the clicked row and is clamped to the recurrence's own period. Value, description, category and payment method can be changed, and a confirmation step shows the resulting periods before anything is written (e.g. "Mantém · jan/2026 — mar/2026 · R$ 1.200,00" and "Passa a · abr/2026 — dez/2026 · R$ 1.450,00"). Months before the chosen one keep their original values. `PATCH /api/recurring-transactions/[id]` now requires `effectiveFrom` (`YYYY-MM`) and validates that `amount` is a positive number; a new `GET /api/recurring-transactions/[id]` returns a single rule.

- Credit-card purchases and refunds now have a "Fatura (mês)" field for the bill they land on. For FIXED-closure cards it is pre-filled from the closure day and can be changed; for VARIABLE-closure cards the user picks it (it starts on the purchase month). The installment preview follows the chosen bill. `POST /api/installments` and `POST /api/credit-card-refunds` accept an optional `billingMonth` (`YYYY-MM`), which is required for VARIABLE cards.
- Bulk credit-card purchases (`/credit-cards/bulk-add`) have one "Fatura" per card section, applied to every row, so many purchases for the same bill can be entered at once. A row can switch to its own bill with the "Outra fatura" button. VARIABLE sections default to the current month; FIXED sections can be left empty to compute each row's bill from its date.
- Installment rows on the mixed bulk-add page also accept a "Fatura (mês)", which is pre-filled when a VARIABLE card is picked. The statement import now sends each item's exact bill, derived from the statement month and installment number.

### Changed

- The credit-card purchase form no longer asks how the value will be informed. The "Como informar o valor" selector — a second full-width tab strip stacked under the Despesa/Receita/Compra com Cartão tabs — is gone, and with it the entry mode it set. "Parcelas" now sits directly above "Valor total" and "Valor da parcela", both of which are filled in and editable: typing either one recomputes the other from the installment count, and changing the count moves whichever figure was not typed last. Switching no longer clears what was already entered. "Parcelas" lists plain `1x…12x` and can be chosen before any amount exists, instead of showing "Informe o valor primeiro"; with a single installment only one "Valor" field is shown. Rounding is stated rather than hidden: R$ 100,00 in 3x shows R$ 33,33 per installment and the note "última parcela R$ 33,34". The 12-row installment preview is replaced by a one-line bill range (e.g. "out/2026 a set/2027") with a "ver parcelas" disclosure, and the bordered box around "Dividir com outras pessoas" was removed.

- Bulk add is now one page. `/transactions/bulk-add` has a "Despesas e receitas" section (PIX, dinheiro, débito, boleto and the other payment methods, plus incomes, each row with its own person) and a "Compras no cartão" section (one block per card, `Adicionar cartão`), both visible at once and sent together with a single "Enviar tudo". A sticky footer shows how many entries are waiting and the spending total, and each section header shows its own signed subtotal. Rows are flat divided lists instead of a card inside a card, with column headers from the `xl` breakpoint and visible field labels below it.
- Card purchases in bulk use the same linked amounts as the single credit-card form. "Parcelas" (1x–12x, default 1x) sits next to "Valor total" and "Valor da parcela": typing either one recomputes the other, and changing the count moves whichever was not typed last. With a single installment only "Valor" is shown ("à vista" in place of the installment amount). A line under the row states the split, e.g. `3× R$ 33,33 · última R$ 33,34`, so rounding is never hidden. The submitted `totalAmount` is always the linked total.
- Each card block in bulk add has its own "Pessoa" (defaults to the person selected in the header), so purchases of different people can be logged together. The block's "Fatura", the per-purchase "Outra fatura" override and "Copiar compra" are unchanged.
- Untouched starter rows (no amount, description or category) are skipped on submit instead of failing validation, so a cards-only or normal-only submission works without deleting the empty row. With nothing filled in, "Enviar tudo" says "Nada para enviar.".
- After a fully successful bulk submit the page now returns to `/transactions` (the credit-card bulk page already did; the normal one used to stay on the page). If any row fails, the page stays, keeps the saved rows locked and flags the failed ones for retry.

### Fixed

- Entering a credit-card purchase by its installment amount could submit a stale total. After picking a total, editing the installment value again updated only the displayed figure, leaving the purchase's `totalAmount` at the previously derived value. The total and the installment amount are now derived from each other, so the submitted total always matches what is on screen.
- Dialogs no longer close when the dimmed area around them is clicked, so a stray click can no longer discard a half-filled form. They still close with Escape, the header close button, and their own Cancel/Save actions. The mobile navigation drawer keeps its tap-outside dismiss.
- Native dropdown lists now follow the selected theme instead of staying white with near-invisible text in dark mode. Chrome on Windows paints a `<select>` popup from the control’s own `background-color` and `color` and ignores `color-scheme`, so `select`, `option` and `optgroup` are now given the theme’s background and foreground explicitly, and the shared `Select` wrapper no longer uses a transparent background. The document also declares `color-scheme` (`light` on `:root`, `dark` on `.dark`), which themes native scrollbars and date inputs. This covers the selects in the loyalty forms, the billing-import wizard and the date picker’s month/year pickers, which never went through the shared wrapper.
- Editing a bounded recurring transaction no longer discards its end date. The replacement rule created by the edit inherits the original `endDate`, so a 12-month recurrence edited part-way through still ends when it was meant to instead of becoming open-ended.
- Splitting a recurring transaction is now atomic: closing the old rule and creating its replacement run in a single database transaction (`IRecurringTransactionRepository.saveSplit`), so a failure can no longer leave a recurrence closed with no replacement.
- An edit effective from a month outside the recurrence's period is rejected, which also prevents an already-split recurrence from producing two overlapping rules that would double-count a month.
- Popovers built on the shared `PopoverContent` primitive no longer render with a transparent background: the `popover` color token (used by `bg-popover`) was missing from the theme and is now defined with the card surface colors in light and dark mode.

### Removed

- The separate credit-card bulk page: `/credit-cards/bulk-add` now redirects to `/transactions/bulk-add`, and the "Comprar em vários cartões" link is gone. The "Parcelamento" row type was removed from the normal bulk section; installment and à vista card purchases are entered in "Compras no cartão".
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
