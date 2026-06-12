# Graph Report - .  (2026-06-11)

## Corpus Check
- Large corpus: 246 files · ~55,989 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 879 nodes · 1835 edges · 37 communities (33 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Route Handlers|API Route Handlers]]
- [[_COMMUNITY_UI Pages & Components|UI Pages & Components]]
- [[_COMMUNITY_Application Use Cases|Application Use Cases]]
- [[_COMMUNITY_Billing Import Pipeline|Billing Import Pipeline]]
- [[_COMMUNITY_Category & Transaction Domain|Category & Transaction Domain]]
- [[_COMMUNITY_Credit Card Management|Credit Card Management]]
- [[_COMMUNITY_Billing Import Wizard|Billing Import Wizard]]
- [[_COMMUNITY_Recurring Transactions|Recurring Transactions]]
- [[_COMMUNITY_Transaction Form UI|Transaction Form UI]]
- [[_COMMUNITY_AI Categorization Pipeline|AI Categorization Pipeline]]
- [[_COMMUNITY_Annual Report Charts|Annual Report Charts]]
- [[_COMMUNITY_Credit Card Purchase Repository|Credit Card Purchase Repository]]
- [[_COMMUNITY_Credit Card UI|Credit Card UI]]
- [[_COMMUNITY_Shared Form Components|Shared Form Components]]
- [[_COMMUNITY_Expense & Income Forms|Expense & Income Forms]]
- [[_COMMUNITY_Loyalty Program Detail|Loyalty Program Detail]]
- [[_COMMUNITY_Monthly Transaction Table|Monthly Transaction Table]]
- [[_COMMUNITY_Bill View Component|Bill View Component]]
- [[_COMMUNITY_App Layout & Navigation|App Layout & Navigation]]
- [[_COMMUNITY_Category & Person Lists|Category & Person Lists]]
- [[_COMMUNITY_Monthly View Summary|Monthly View Summary]]
- [[_COMMUNITY_Installments List|Installments List]]
- [[_COMMUNITY_Installments Page|Installments Page]]
- [[_COMMUNITY_Loyalty Transfer Table|Loyalty Transfer Table]]
- [[_COMMUNITY_Unified Transaction Form|Unified Transaction Form]]
- [[_COMMUNITY_Category Breakdown Chart|Category Breakdown Chart]]
- [[_COMMUNITY_Transaction Repository|Transaction Repository]]
- [[_COMMUNITY_Loading Skeletons|Loading Skeletons]]
- [[_COMMUNITY_Monthly View Page|Monthly View Page]]
- [[_COMMUNITY_Edit Installment Form|Edit Installment Form]]
- [[_COMMUNITY_Category Create Dialog|Category Create Dialog]]
- [[_COMMUNITY_Loyalty Program List|Loyalty Program List]]
- [[_COMMUNITY_Category Edit Dialog|Category Edit Dialog]]
- [[_COMMUNITY_Monthly View API Endpoint|Monthly View API Endpoint]]

## God Nodes (most connected - your core abstractions)
1. `createRepositories()` - 41 edges
2. `errorResponse()` - 41 edges
3. `PrismaCreditCardPurchaseRepository` - 26 edges
4. `Button` - 17 edges
5. `DELETE()` - 15 edges
6. `TransactionRecord` - 15 edges
7. `cn()` - 13 edges
8. `PrismaCreditCardRepository` - 13 edges
9. `parseDateUTC()` - 13 edges
10. `formatDatePtBR()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `updateCreditCardUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateCreditCardUseCase.ts
- `POST()` --calls--> `createCreditCardUseCase()`  [EXTRACTED]
  app/api/credit-cards/route.ts → application/use-cases/CreateCreditCardUseCase.ts
- `PUT()` --calls--> `updateExpenseUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateExpenseUseCase.ts
- `PUT()` --calls--> `updateIncomeUseCase()`  [EXTRACTED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateIncomeUseCase.ts
- `DELETE()` --calls--> `deleteCreditCardUseCase()`  [INFERRED]
  app/api/credit-card-purchases/[id]/route.ts → application/use-cases/DeleteCreditCardUseCase.ts

## Communities (37 total, 4 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.06
Nodes (48): GET(), GET(), GET(), POST(), GET(), POST(), GET(), GET() (+40 more)

### Community 1 - "UI Pages & Components"
Cohesion: 0.05
Nodes (59): CategoryList(), CategoriesPage(), CategoryRecord, getCategories(), AnnualBalanceCard(), ChartProps, CustomTooltip(), fmtFull() (+51 more)

### Community 2 - "Application Use Cases"
Cohesion: 0.05
Nodes (42): POST(), POST(), VALID_SOURCES, CreditCardPurchaseRecord, CreditCardPurchaseWithInstallments, ICreditCardPurchaseRepository, InstallmentRecord, IncomeSource (+34 more)

### Community 3 - "Billing Import Pipeline"
Cohesion: 0.07
Nodes (52): InvalidBillingItemError, BillingItem, createInstallmentBillingItem(), CreateInstallmentInput, createTransactionBillingItem(), CreateTransactionInput, TransactionBillingItem, isCSVFile() (+44 more)

### Community 4 - "Category & Transaction Domain"
Cohesion: 0.07
Nodes (31): DuplicateCategoryError, NotFoundError, createCategory(), CreateCategoryInput, createExpense(), CreateExpenseInput, createIncome(), CreateIncomeInput (+23 more)

### Community 5 - "Credit Card Management"
Cohesion: 0.09
Nodes (20): DELETE(), ClosureType, createCreditCard(), CreateCreditCardInput, CreditCardClosureRecord, CreditCardRecord, ICreditCardRepository, closureToRecord() (+12 more)

### Community 6 - "Billing Import Wizard"
Cohesion: 0.08
Nodes (28): BillingImportWizard(), ImportSummary, Step1Data, STEPS, WizardStep, BANK_LABELS, BANK_OPTIONS, CreditCard (+20 more)

### Community 7 - "Recurring Transactions"
Cohesion: 0.09
Nodes (23): POST(), VALID_PAYMENT_METHODS, VALID_TYPES, IRecurringTransactionRepository, RecurringTransactionRecord, UpdateableFields, PrismaRecurringTransactionRepository, toRecord() (+15 more)

### Community 8 - "Transaction Form UI"
Cohesion: 0.09
Nodes (25): CategoryLike, getFullPath(), Category, InvestmentForm(), Person, Category, PAYMENT_METHODS, Person (+17 more)

### Community 9 - "AI Categorization Pipeline"
Cohesion: 0.12
Nodes (17): CategorizationPipeline, MerchantHistoryCategorizer, upsertMerchantHistory(), findCategoryByKeywords(), MerchantRule, MerchantRuleCategorizer, normalizeText(), RULES (+9 more)

### Community 10 - "Annual Report Charts"
Cohesion: 0.11
Nodes (17): AnnualBalanceChart(), AnnualBarChart(), MONTH_NAMES, Props, TooltipEntry, AnnualCard(), FIELD_CONFIG, formatAmount() (+9 more)

### Community 12 - "Credit Card UI"
Cohesion: 0.15
Nodes (14): Closure, ClosureManagerDialog(), MONTH_NAMES, CreditCard, CreditCardList(), Props, CreditCardsPage(), getCards() (+6 more)

### Community 13 - "Shared Form Components"
Cohesion: 0.17
Nodes (14): Category, Props, CreditCard, CreditCardForm(), Props, Category, CreditCard, Person (+6 more)

### Community 14 - "Expense & Income Forms"
Cohesion: 0.14
Nodes (15): useDuplicateCheck(), Category, ExpenseForm(), PAYMENT_METHODS, Person, Category, INCOME_SOURCES, IncomeForm() (+7 more)

### Community 15 - "Loyalty Program Detail"
Cohesion: 0.12
Nodes (14): EDITABLE_TYPES, FifoData, formatBrl(), formatPts(), LoyaltyProgramDetail(), Program, Props, SortDir (+6 more)

### Community 16 - "Monthly Transaction Table"
Cohesion: 0.12
Nodes (12): Category, fmtCurrency(), MONTH_ABBR, PAYMENT_LABELS, Person, SortDir, SortKey, Transaction (+4 more)

### Community 17 - "Bill View Component"
Cohesion: 0.13
Nodes (12): BillEntry, BillInstallmentItem, BillSortDir, BillSortKey, BillView(), BillViewProps, Category, CreditCardFull (+4 more)

### Community 18 - "App Layout & Navigation"
Cohesion: 0.15
Nodes (11): dmSerifDisplay, geistMono, geistSans, metadata, Theme, ThemeContext, ThemeProvider(), useTheme() (+3 more)

### Community 19 - "Category & Person Lists"
Cohesion: 0.25
Nodes (12): Category, ViewMode, Person, DropdownItem, DropdownMenu(), DropdownMenuProps, Table, TableBody (+4 more)

### Community 20 - "Monthly View Summary"
Cohesion: 0.15
Nodes (9): CreditCardItem, fmt(), Installment, InstallmentFilters, InstallmentTable(), Person, SortDir, SortKey (+1 more)

### Community 21 - "Installments List"
Cohesion: 0.15
Nodes (8): Category, CreditCard, EditState, Installment, MONTH_NAMES, Person, Props, Purchase

### Community 22 - "Installments Page"
Cohesion: 0.22
Nodes (11): InstallmentsList(), InstallmentsTabs(), Props, Tab, getCategories(), getCreditCards(), getPeople(), getPurchases() (+3 more)

### Community 23 - "Loyalty Transfer Table"
Cohesion: 0.2
Nodes (7): formatDatePtBR(), formatDate(), formatDate(), Program, Props, Transfer, fmtDate()

### Community 24 - "Unified Transaction Form"
Cohesion: 0.17
Nodes (10): Category, CreditCard, EditMode, FormType, INCOME_SOURCES, InitialValues, MONTH_NAMES_PT, PAYMENT_METHODS (+2 more)

### Community 25 - "Category Breakdown Chart"
Cohesion: 0.2
Nodes (10): BAR_COLORS, Category, CategoryBreakdownChart(), COLORS, CustomTooltip(), fmt(), Installment, Props (+2 more)

### Community 28 - "Monthly View Page"
Cohesion: 0.29
Nodes (9): Category, CreditCard, getCategories(), getCreditCards(), getMonthlyView(), getPeople(), Person, SearchParams (+1 more)

### Community 29 - "Edit Installment Form"
Cohesion: 0.28
Nodes (8): CreditCard, EditInstallmentForm(), fmtCurrency(), fmtDate(), Installment, MONTH_ABBR, Person, Props

### Community 30 - "Category Create Dialog"
Cohesion: 0.4
Nodes (4): Category, CategoryCreateDialog(), Props, CategoryForm()

### Community 31 - "Loyalty Program List"
Cohesion: 0.4
Nodes (3): Program, Props, TYPE_LABELS

### Community 32 - "Category Edit Dialog"
Cohesion: 0.5
Nodes (3): Category, CategoryEditDialog(), Props

## Knowledge Gaps
- **263 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `Person`, `SearchParams` (+258 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TransactionRecord` connect `Application Use Cases` to `API Route Handlers`, `Annual Report Charts`, `Category & Transaction Domain`, `Recurring Transactions`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `CategoryCombobox()` connect `Transaction Form UI` to `Billing Import Wizard`, `Shared Form Components`, `Expense & Income Forms`, `Installments List`, `Unified Transaction Form`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `PrismaCreditCardPurchaseRepository` connect `Credit Card Purchase Repository` to `API Route Handlers`, `Application Use Cases`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `DELETE()` (e.g. with `deleteCreditCardUseCase()` and `deleteTransactionUseCase()`) actually correct?**
  _`DELETE()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _263 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `UI Pages & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._