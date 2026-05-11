# Graph Report - .  (2026-05-10)

## Corpus Check
- Corpus is ~22,854 words - fits in a single context window. You may not need a graph.

## Summary
- 613 nodes · 1308 edges · 24 communities (23 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Credit Card & Category UI|Credit Card & Category UI]]
- [[_COMMUNITY_API Routes Layer|API Routes Layer]]
- [[_COMMUNITY_Income & Expense Use Cases|Income & Expense Use Cases]]
- [[_COMMUNITY_Installment Purchase Domain|Installment Purchase Domain]]
- [[_COMMUNITY_Credit Card Use Cases|Credit Card Use Cases]]
- [[_COMMUNITY_Recurring Transactions|Recurring Transactions]]
- [[_COMMUNITY_Category Edit UI|Category Edit UI]]
- [[_COMMUNITY_Annual Report Dashboard|Annual Report Dashboard]]
- [[_COMMUNITY_Transaction Page & Edit Forms|Transaction Page & Edit Forms]]
- [[_COMMUNITY_Installment Tabs & Bill View|Installment Tabs & Bill View]]
- [[_COMMUNITY_Categories & People Pages|Categories & People Pages]]
- [[_COMMUNITY_Category Domain & Repository|Category Domain & Repository]]
- [[_COMMUNITY_App Layout & Fonts|App Layout & Fonts]]
- [[_COMMUNITY_Person Domain & Repository|Person Domain & Repository]]
- [[_COMMUNITY_Dashboard Page|Dashboard Page]]
- [[_COMMUNITY_Monthly Tabs Card|Monthly Tabs Card]]
- [[_COMMUNITY_Category Breakdown Chart|Category Breakdown Chart]]
- [[_COMMUNITY_Monthly Expenses Card|Monthly Expenses Card]]
- [[_COMMUNITY_Annual Balance Card|Annual Balance Card]]
- [[_COMMUNITY_Income Expense Balance Card|Income Expense Balance Card]]
- [[_COMMUNITY_Monthly Summary Card|Monthly Summary Card]]
- [[_COMMUNITY_Spec Monthly View|Spec Monthly View]]

## God Nodes (most connected - your core abstractions)
1. `createRepositories()` - 41 edges
2. `errorResponse()` - 41 edges
3. `PrismaCreditCardPurchaseRepository` - 18 edges
4. `Button` - 17 edges
5. `TransactionRecord` - 15 edges
6. `DELETE()` - 14 edges
7. `cn()` - 13 edges
8. `PrismaCreditCardRepository` - 13 edges
9. `Select` - 12 edges
10. `Card` - 11 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `updateCreditCardUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateCreditCardUseCase.ts
- `PUT()` --calls--> `updateExpenseUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateExpenseUseCase.ts
- `PUT()` --calls--> `updateIncomeUseCase()`  [EXTRACTED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateIncomeUseCase.ts
- `DELETE()` --calls--> `deleteCreditCardUseCase()`  [INFERRED]
  app/api/categories/[id]/route.ts → application/use-cases/DeleteCreditCardUseCase.ts
- `DELETE()` --calls--> `deleteTransactionUseCase()`  [INFERRED]
  app/api/categories/[id]/route.ts → application/use-cases/DeleteTransactionUseCase.ts

## Communities (24 total, 1 thin omitted)

### Community 0 - "Credit Card & Category UI"
Cohesion: 0.05
Nodes (59): Category, Closure, ClosureManagerDialog(), MONTH_NAMES, CreditCard, CreditCardForm(), Props, CreditCard (+51 more)

### Community 1 - "API Routes Layer"
Cohesion: 0.1
Nodes (34): GET(), GET(), GET(), POST(), GET(), POST(), GET(), globalForPrisma (+26 more)

### Community 2 - "Income & Expense Use Cases"
Cohesion: 0.06
Nodes (32): createExpense(), CreateExpenseInput, createIncome(), CreateIncomeInput, POST(), VALID_PAYMENT_METHODS, VALID_SOURCES, POST() (+24 more)

### Community 3 - "Installment Purchase Domain"
Cohesion: 0.06
Nodes (24): POST(), POST(), CreditCardPurchaseRecord, CreditCardPurchaseWithInstallments, ICreditCardPurchaseRepository, InstallmentRecord, PrismaCreditCardPurchaseRepository, purchaseToRecord() (+16 more)

### Community 4 - "Credit Card Use Cases"
Cohesion: 0.08
Nodes (23): DELETE(), GET(), POST(), ClosureType, createCreditCard(), CreateCreditCardInput, CreditCardClosureRecord, CreditCardRecord (+15 more)

### Community 5 - "Recurring Transactions"
Cohesion: 0.08
Nodes (29): POST(), VALID_PAYMENT_METHODS, VALID_TYPES, IRecurringTransactionRepository, RecurringTransactionRecord, UpdateableFields, PrismaRecurringTransactionRepository, toRecord() (+21 more)

### Community 6 - "Category Edit UI"
Cohesion: 0.1
Nodes (26): Category, CategoryEditDialog(), Props, Category, CreditCardItem, fmt(), Installment, InstallmentTable() (+18 more)

### Community 7 - "Annual Report Dashboard"
Cohesion: 0.1
Nodes (19): AnnualBalanceChart(), AnnualBarChart(), MONTH_NAMES, Props, TooltipEntry, AnnualCard(), FIELD_CONFIG, formatAmount() (+11 more)

### Community 8 - "Transaction Page & Edit Forms"
Cohesion: 0.1
Nodes (25): CreditCard, EditInstallmentForm(), fmtCurrency(), fmtDate(), Installment, MONTH_ABBR, Person, Props (+17 more)

### Community 9 - "Installment Tabs & Bill View"
Cohesion: 0.12
Nodes (16): BillEntry, BillInstallmentItem, BillView(), Category, formatCurrency(), formatMonth(), Person, InstallmentsList() (+8 more)

### Community 10 - "Categories & People Pages"
Cohesion: 0.15
Nodes (16): CategoryForm(), CategoryList(), CategoriesPage(), CategoryRecord, getCategories(), getPeople(), PeoplePage(), PersonRecord (+8 more)

### Community 11 - "Category Domain & Repository"
Cohesion: 0.18
Nodes (9): createCategory(), CreateCategoryInput, CategoryRecord, ICategoryRepository, PrismaCategoryRepository, PrismaCategoryRow, toRecord(), createCategoryUseCase() (+1 more)

### Community 12 - "App Layout & Fonts"
Cohesion: 0.15
Nodes (11): dmSerifDisplay, geistMono, geistSans, metadata, Theme, ThemeContext, ThemeProvider(), useTheme() (+3 more)

### Community 13 - "Person Domain & Repository"
Cohesion: 0.21
Nodes (6): createPerson(), IPersonRepository, PersonRecord, PrismaPersonRepository, createPersonUseCase(), Input

### Community 14 - "Dashboard Page"
Cohesion: 0.22
Nodes (11): Category, DashboardPage(), getAnnualReport(), getCategories(), getMonthlyView(), getPeople(), Person, SearchParams (+3 more)

### Community 15 - "Monthly Tabs Card"
Cohesion: 0.18
Nodes (9): Installment, Person, Props, Transaction, MONTH_NAMES, MonthNav(), Person, Props (+1 more)

### Community 16 - "Category Breakdown Chart"
Cohesion: 0.2
Nodes (10): BAR_COLORS, Category, CategoryBreakdownChart(), COLORS, CustomTooltip(), fmt(), Installment, Props (+2 more)

### Community 17 - "Monthly Expenses Card"
Cohesion: 0.25
Nodes (8): CustomTooltip(), fmtFull(), MONTH_NAMES, MonthlyExpensesCard(), Props, Card, CardDescription, CardFooter

### Community 18 - "Annual Balance Card"
Cohesion: 0.27
Nodes (8): AnnualBalanceCard(), ChartProps, CustomTooltip(), fmtFull(), fmtSigned(), MONTH_NAMES, Props, AnnualReportSection()

### Community 19 - "Income Expense Balance Card"
Cohesion: 0.22
Nodes (4): IncomeExpenseBalanceCard(), MONTH_NAMES, Props, TooltipEntry

### Community 20 - "Monthly Summary Card"
Cohesion: 0.4
Nodes (5): formatAmount(), Installment, MonthlySummaryCard(), Props, Transaction

## Knowledge Gaps
- **182 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `Person`, `SearchParams` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TransactionRecord` connect `Income & Expense Use Cases` to `Recurring Transactions`, `Annual Report Dashboard`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `Button` connect `Credit Card & Category UI` to `Transaction Page & Edit Forms`, `Installment Tabs & Bill View`, `Category Edit UI`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `PrismaCreditCardPurchaseRepository` connect `Installment Purchase Domain` to `API Routes Layer`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Credit Card & Category UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `API Routes Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Income & Expense Use Cases` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._