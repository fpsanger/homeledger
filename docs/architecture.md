# Architecture Overview

## 1. Overview

This system is a personal finance platform based on shared workspaces.

Users can:
- create or join workspaces
- manage shared financial data
- track expenses, incomes, credit cards and installments
- visualize monthly financial summaries

The architecture follows a modular, domain-oriented approach.

---

## 2. Architecture Style

We use a **modular layered architecture**:

UI → API → Application → Domain → Infrastructure → Database

Each module is isolated and responsible for a specific domain.

---

## 3. Layers

### 3.1 Presentation Layer

Location:
- Next.js pages
- API routes

Responsibilities:
- receive input
- validate basic data (DTO)
- call application use cases
- return responses

No business rules should be implemented here.

---

### 3.2 Application Layer

Responsibilities:
- orchestrate use cases
- coordinate domain objects
- call repositories

Examples:
- CreateTransaction
- GetMonthlyFinancialView
- InviteWorkspaceMember

---

### 3.3 Domain Layer

Responsibilities:
- core business rules
- validations
- calculations

Examples:
- installment generation
- monthly aggregation logic
- category hierarchy rules

This is the most critical layer of the system.

---

### 3.4 Infrastructure Layer

Responsibilities:
- database access
- ORM configuration
- external integrations

Examples:
- repositories
- database queries
- migrations

---

## 4. Modules

The system is divided into modules:

- workspaces
- transactions
- credit-cards
- categories
- reports
- shared

Each module contains its own layers:
- domain
- application
- infrastructure
- presentation

---

## 5. Core Concepts

### 5.1 Workspace

All data belongs to a workspace.

A workspace can have multiple users.

---

### 5.2 Monthly Financial View

The central concept of the system.

A monthly view must include:
- incomes
- expenses
- recurring transactions
- credit card installments

The system must always calculate values based on the month impact, not creation date.

---

### 5.3 Installments

Credit card purchases can be split into installments.

Each installment:
- affects a specific month
- must be treated as an independent financial event

---

### 5.4 Categories

Categories are hierarchical.

A category can have a parent category.

Unlimited levels are supported.

---

## 6. Design Principles

- Separation of concerns
- Business rules isolated in domain
- No logic in UI
- No direct database access from API
- Explicit use cases
- Modular structure

---

## 7. Future Evolution

The architecture allows:

- multi-level category expansion
- financial analytics
- AI insights
- automation integrations (email, invoices)
- multi-account support