# Repository Map

## Overview

Homeledger is a personal finance system for a single household.

Main goals:

- simple household financial control
- people-based expense tracking
- monthly financial visualization
- credit-card installment handling
- recurring transactions
- categories and subcategories

There is no authentication or workspace model.

---

## Architecture

The project follows Clean Architecture.

### Domain

Location:

`src/domain/`

Contains:

- entities
- value objects
- domain services
- rules
- errors
- repository contracts

Domain contains pure business behavior and must not depend on other layers.

### Application

Location:

`src/application/`

Contains:

- use cases
- DTOs
- orchestration

Application depends on Domain.

### Infrastructure

Location:

`src/infrastructure/`

Contains:

- Prisma
- database schema
- migrations
- repository implementations
- statement parsers
- external technical integrations

### Next.js / UI

Locations:

`src/app/`

Contains:

- App Router pages
- layouts
- route handlers

`src/components/`

Contains:

- reusable UI components

Business logic must not live in UI code.

---

## Database

Prisma schema:

`src/infrastructure/database/schema.prisma`

Database migrations:

`src/infrastructure/database/`

All database schema changes must use migrations.

---

## Tests

Tests live under:

`tests/`

Tests mirror source concepts.

Examples:

`src/domain/entities/Category.ts`

→

`tests/domain/entities/Category.test.ts`

Domain behavior uses TDD.

---

## Key Domain Concepts

### Person

Represents a household member.

Financial records belong to a Person.

### Transaction

Represents an Income or Expense.

Contains financial information such as:

- amount
- date
- description
- payment method
- person
- optional category

### Category

Used to classify financial records.

Supports categories and subcategories.

### Credit Card Purchase

Represents a credit-card purchase.

The original purchase stores the full purchase amount.

Purchases may have one or more installments.

### Installment

Represents the amount affecting a specific monthly financial view for a credit-card purchase.

### Recurring Transaction

Represents a recurrence rule used to generate or calculate financial occurrences.

### Monthly View

Represents financial movements affecting a specific month.

May include:

- normal expenses
- incomes
- credit-card installments
- recurring transaction occurrences

---

## Core Architecture Rules

- Domain must not depend on Application.
- Domain must not depend on Infrastructure.
- Domain must not depend on UI.
- Application depends on Domain.
- Infrastructure contains technical implementations.
- UI accesses business behavior through Application.
- Business rules belong in Domain or Application.
- Database changes require migrations.

---

## Business Rule Authority

`SPEC.md` is the authoritative source for Homeledger business rules.

The repository map describes structure, not expected financial behavior.

When code and `SPEC.md` disagree, investigate the conflict instead of assuming that existing code is correct.

---

## Knowledge Graph

The repository has a Graphify knowledge graph under:

`graphify-out/`

Before broad codebase investigation read:

`graphify-out/GRAPH_REPORT.md`

If available, use:

`graphify-out/wiki/index.md`

For relationships between concepts prefer:

```bash
graphify query "<question>"