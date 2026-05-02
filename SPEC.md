# Personal Finance System

This system helps families or shared groups manage personal finances in a simple way.

The main concept is a shared workspace. A user can create a workspace and invite other users by email.

Inside a workspace, members can register incomes, expenses, credit card purchases, installments, recurring transactions and categories.

The system must show a monthly financial view where the user can see all transactions that affect that month, including credit card installments.

# Business Rules

## Workspace

- Every financial record belongs to a workspace.
- A user can own one or more workspaces.
- A user can be invited to another workspace by email.
- A workspace can have many members.
- A member can have a role: Owner, Admin or Member.

## Transactions

- A transaction can be Income or Expense.
- A transaction belongs to one workspace.
- A transaction may belong to one category.
- A transaction has an amount, date, description and payment method.

## Payment Methods

Supported payment methods:
- Cash
- Debit Card
- Credit Card
- PIX
- Bank Transfer
- Boleto

## Credit Card Purchases

- A credit card purchase can be paid in one or more installments.
- The original purchase stores the total amount.
- Each installment affects a specific monthly view.
- The monthly view must show the installment amount, not the full purchase amount, unless it is a one-time purchase.

Example:
A purchase of R$ 1,200 in 12 installments creates 12 monthly installment records of R$ 100.

## Monthly View

- The monthly view shows all financial movements that affect that month.
- It includes:
  - normal expenses
  - incomes
  - recurring transactions
  - credit card installments due in that month
- It should not duplicate the same purchase in multiple views incorrectly.

## Recurring Transactions

- A recurring transaction defines a rule.
- Monthly occurrences can be generated or calculated from the rule.
- Recurring transactions may have an end date or be indefinite.