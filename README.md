# HomeLedger

A household personal-finance application — people, incomes, expenses, hierarchical categories,
recurring transactions, credit-card purchases with installments and statements, loyalty/miles
programs, and monthly and annual reporting. Built end to end as a production-style system:
Clean Architecture, strict TypeScript, test-first domain logic, mechanically enforced quality
gates, and fully automated deployment.

---

## Why it was built

Households that share money (and especially ones using Brazilian credit cards, with their
installment-heavy "parcelado" purchases and monthly *faturas*) are poorly served by generic
budgeting apps. The questions that matter are simple to ask and hard to answer:

- What have we actually spent this month, **including installments from purchases made months ago**?
- What do we still owe on cards, per person and combined?
- How is the year trending?

HomeLedger answers those directly. It is deliberately scoped as a **single fixed household with no
login or multi-tenant model**; every financial record belongs to one person, and "my expenses" vs.
"household" are equally first-class views. The product principles (numbers first, unambiguous
paid/unpaid and income/expense states that never rely on colour alone, WCAG AA) are written down in
[PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md); the business rules in [SPEC.md](SPEC.md).

It is also a deliberate engineering exercise: a real domain with non-trivial money rules, treated
with the discipline of a production system.

## How it works

| Concept | Behaviour |
| --- | --- |
| **Person** | A household member. Every record belongs to exactly one person. |
| **Transaction** | An income or expense with amount, date, description, payment method (cash, debit, credit, PIX, bank transfer, boleto) and an optional category. Expenses must use a *leaf* category. |
| **Category** | Hierarchical tree; validated so expenses never land on a parent node. |
| **Credit card** | Fixed- or variable-closure cards. A purchase's *fatura* (bill month) is computed from the closing day, or chosen explicitly for variable cards. |
| **Purchase & installments** | A R$ 1,200 purchase in 12x becomes 12 monthly installments. Rounding is stated, never hidden (R$ 100 in 3x → 33,33 · 33,33 · 33,34). Purchases can be split across people and moved between bills until an installment is paid. |
| **Recurring transactions** | A rule with a period, calculated per month, editable "from month X onward" with a confirmation step that shows the before/after periods. |
| **Monthly view** | One page combining normal transactions, income, recurring occurrences and installments due that month — without duplicating a purchase across views. |
| **Annual report / dashboard** | Aggregations over the same domain services. |
| **Statement import** | Parses card statements (Bradesco, BTG, C6 CSV, plus PDF text via `unpdf`), classifies and reconciles rows against existing purchases. A hybrid regex-first parser can fall back to a local LLM (Ollama). |
| **Auto-categorization** | A pipeline: merchant rules → merchant history → optional local LLM. |
| **Duplicate detection** | Domain services flag likely duplicate expenses, card purchases, recurring rules and loyalty entries, including across entity types. |
| **Loyalty programs** | Points/miles programs, transfers between programs and FIFO lot accounting. |
| **Bulk entry** | One page for many expenses, incomes and multi-card purchases submitted together, with partial-failure handling and retry. |

## Technologies

**Application**
- TypeScript (strict), Node.js 22
- Next.js 14 (App Router, route handlers) · React 18
- Tailwind CSS · shadcn/ui · Base UI · Recharts · cmdk · Sonner
- PWA support (`@ducanh2912/next-pwa`)
- date-fns · unpdf (PDF text extraction)

**Data**
- PostgreSQL 16 · Prisma 7 (driver adapter `@prisma/adapter-pg`)
- Versioned, backward-compatible SQL migrations (25 and counting)

**Quality & testing**
- Jest + ts-jest + React Testing Library (unit, component, repository and API-route tests)
- Playwright (end-to-end flows and API contracts)
- Stryker mutation testing on the financial-critical code (weekly, advisory)
- Biome (lint + format) · `tsc --noEmit`
- A custom **quality ratchet** (`scripts/quality/*.cjs`) that fails the build if layering,
  circular dependencies, cyclomatic complexity, file/function size or coverage regress

**Delivery & operations**
- GitHub Actions CI: tests, lint, typecheck, ratchet, build, Prisma validation, migrations applied
  to an empty Postgres 16, Playwright, and a PR-diff risk reviewer
- Automatic release tagging; Dependabot for npm and Actions
- Continuous deployment of `develop` to a self-hosted Linux host over **Tailscale**, using a
  self-hosted GitHub runner, atomic release symlink swaps, `prisma migrate deploy`, and
  **automatic rollback** if `/api/health` does not answer within 60 seconds
- `systemd` service plus a health-check timer with dead-man's-switch heartbeat
- Docker Compose for local Postgres

## Code structure

```text
src/
  domain/          Pure business rules. No React, Next.js, Prisma or outer-layer imports.
    entities/        Person, Category, CreditCard, Transaction, Loyalty*, ...
    services/        MonthlyView, AnnualReport, InstallmentPurchase, RecurringTransaction,
                     CategoryTree, LoyaltyFifo, duplicate-detection rules
    repositories/    Interfaces (ports) only
  application/     Use cases orchestrating domain contracts (≈35: CreateInstallmentPurchase,
                   GetMonthlyView, ReconcileStatement, MarkInstallmentsPaid, ...)
  infrastructure/  Adapters: Prisma repositories, schema + migrations, statement parsers,
                   categorization pipeline, optional Ollama integration
  app/             Next.js pages and REST route handlers (/api/...), incl. /api/health
  components/      Feature-organised UI (transactions, credit-cards, monthly-view, dashboard, ...)
  hooks/ lib/      Client hooks and small utilities
tests/             Mirrors src/ — domain, application, infrastructure, components, app/api,
                   plus e2e (Playwright) and quality-tooling tests
scripts/           Quality ratchet, mutation report, PR diff analyzer
deploy/            deploy.sh, systemd units, health check
docs/              Deployment guide and PR workflow
```

The dependency rule is enforced by tooling, not just convention: the domain layer cannot import
outward, and the CI ratchet fails if that (or complexity, size or coverage) gets worse.

## What this project demonstrates

- **Domain modelling of money**: installments, rounding, billing cycles, recurring rules,
  FIFO lots — developed test-first, covered by mutation testing.
- **Clean/Hexagonal Architecture** in a full-stack Next.js codebase, with ports in the domain and
  Prisma adapters in infrastructure.
- **Engineering discipline**: strict typing, a ratcheting quality baseline, conventional commits,
  PR-based flow into `develop`, changelog kept current, ~400 commits of incremental history.
- **Safe database evolution**: every schema change ships a versioned migration, validated in CI
  against an empty database, and designed to be compatible with the previous release so rollbacks
  are safe.
- **DevOps ownership**: CI/CD, self-hosted runner, zero-downtime-style release swaps, rollback,
  health checks, private networking — no public exposure by design.
- **Product and UX judgment**: documented principles, accessibility targets, and iterative UX
  refinement (linked amount fields, bulk entry, bill-month handling) recorded in
  [CHANGELOG.md](CHANGELOG.md).
- **AI-assisted development with guardrails**: [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md)
  define a completion contract (`npm run agent:check`) that coding agents must pass — an example
  of making AI tooling accountable to the same gates as humans.
- **Pragmatic use of LLMs**: local Ollama as an optional fallback for statement parsing and
  categorization, behind deterministic rules first.

## Skills demonstrated

| Area | Keywords |
| --- | --- |
| Languages | TypeScript, JavaScript, SQL, Bash |
| Frontend | Next.js, React, App Router, Tailwind CSS, shadcn/ui, Recharts, PWA, accessibility (WCAG AA) |
| Backend | Node.js, REST APIs, input validation, use cases, repository pattern |
| Data | PostgreSQL, Prisma, schema migrations, data modelling |
| Architecture | Clean Architecture, Hexagonal / Ports & Adapters, DDD, SOLID |
| Testing | TDD, Jest, React Testing Library, Playwright, mutation testing (Stryker), coverage |
| Quality | Biome, static analysis, complexity and circular-dependency checks, quality gates |
| DevOps | GitHub Actions, CI/CD, self-hosted runners, Docker, systemd, Tailscale, rollback, health checks |
| Domain | Fintech, credit-card billing, installments, recurring payments, reconciliation, statement parsing, FIFO accounting |
| AI | LLM integration (Ollama), classification, AI-assisted development with guardrails |
| Practices | Conventional Commits, semantic versioning, changelog, PR-based flow |

## Design decisions worth discussing

- **Installments and rounding:** a purchase becomes monthly records; the remainder goes on the last installment and is always shown.
- **Backward-compatible migrations:** rollback reverts code, not schema, so every migration must work with the previous release.
- **Quality ratchet instead of fixed thresholds:** metrics may only improve, so legacy code is not blocked but cannot get worse.
- **Domain isolation:** the domain layer cannot import Next.js, React or Prisma, and tooling enforces it.
- **LLMs behind deterministic rules:** rules and history categorize first; a local model is only a fallback.

## Getting started

Requires Node.js 22 (`nvm use`) and Docker.

```bash
npm install
cp .env.example .env
docker compose up -d          # PostgreSQL 16 on port 5433
npx prisma migrate dev
npm run dev                   # http://localhost:3000
```

Default local connection: `postgresql://homeledger:homeledger@localhost:5433/homeledger`.

### Scripts

```bash
npm run dev            # Next.js dev server
npm run build          # production build
npm test               # Jest
npm run lint           # Biome
npm run typecheck      # tsc --noEmit
npm run agent:check    # lint, typecheck, quality ratchet, build, Prisma validation
npm run verify         # agent:check + Playwright e2e (needs Postgres + browsers)
npm run mutation:test  # Stryker on financial-critical scope
```

### Quality ratchet

`npm run quality:ratchet` snapshots current metrics and compares them to `quality-baseline.json`;
regressions fail, improvements are reported. After reviewing an improvement,
`npm run quality:baseline:update` promotes it.

### Delivery flow

```text
feature/* or fix/* → PR → develop (CI green → auto-deploy) → PR → master (tag + GitHub Release)
```

Details in [docs/deployment.md](docs/deployment.md). The deployed instance has **no authentication**
— the tailnet is the access control — so it must never be exposed publicly.

## Status

Private personal project in active development (`2.x`). Functional and deployed to the author's
self-hosted instance; not hardened as a public multi-user SaaS.
