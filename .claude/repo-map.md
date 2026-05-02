# Repository Map

## Overview

This project is a financial control system focused on:
- simplicity
- shared workspaces (family usage)
- monthly expense visualization
- credit card installment handling

---

## Architecture

Clean Architecture (layered):

- domain → pure business rules
- application → use cases
- infrastructure → database / external APIs
- presentation → UI / API routes

---

## Structure

/src
  /domain
    /entities
    /value-objects
    /services
    /rules

  /application
    /use-cases
    /dto

  /infrastructure
    /database
    /repositories
    /migrations

  /presentation
    /api
    /ui

---

## Key Concepts

- Workspace (multi-user shared data)
- Transactions (income / expense)
- Installments (credit card logic)
- Monthly aggregation
- Categories / Subcategories

---

## Rules

- domain must NOT depend on other layers
- application orchestrates domain
- infrastructure implements interfaces
- presentation only calls application

---

## Testing Strategy

- domain → unit tests (TDD)
- application → integration tests
- UI → minimal logic