# Graph Report - homeledger  (2026-07-08)

## Corpus Check
- 262 files · ~61,139 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1160 nodes · 2676 edges · 51 communities (46 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b8f753d0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Monthly View Route|Monthly View Route]]
- [[_COMMUNITY_Description Normalizer|Description Normalizer]]
- [[_COMMUNITY_Monthly View API Endpoint|Monthly View API Endpoint]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `createRepositories()` - 68 edges
2. `errorResponse()` - 66 edges
3. `cn()` - 32 edges
4. `PrismaCreditCardPurchaseRepository` - 26 edges
5. `Button` - 25 edges
6. `DELETE()` - 22 edges
7. `Select` - 19 edges
8. `Input` - 19 edges
9. `formatDatePtBR()` - 17 edges
10. `TransactionRecord` - 17 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `updateCreditCardUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateCreditCardUseCase.ts
- `PUT()` --calls--> `updateExpenseUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateExpenseUseCase.ts
- `fmtDate()` --calls--> `formatDatePtBR()`  [EXTRACTED]
  components/monthly-view/TransactionTable.tsx → lib/format-date.ts
- `formatDate()` --calls--> `formatDatePtBR()`  [EXTRACTED]
  components/loyalty/LoyaltyTransferTable.tsx → lib/format-date.ts
- `formatDate()` --calls--> `formatDatePtBR()`  [EXTRACTED]
  components/loyalty/LoyaltyProgramDetail.tsx → lib/format-date.ts

## Communities (51 total, 5 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.06
Nodes (68): GET(), GET(), POST(), POST(), GET(), POST(), DELETE(), GET() (+60 more)

### Community 1 - "UI Pages & Components"
Cohesion: 0.06
Nodes (46): DuplicateCategoryError, NotFoundError, createCategory(), CreateCategoryInput, createExpense(), CreateExpenseInput, createIncome(), CreateIncomeInput (+38 more)

### Community 2 - "Application Use Cases"
Cohesion: 0.05
Nodes (38): createLoyaltyProgram(), CreateLoyaltyProgramInput, LoyaltyProgramRecord, LoyaltyProgramType, createLoyaltyTransaction(), CreateLoyaltyTransactionInput, LoyaltyTransactionRecord, LoyaltyTransactionType (+30 more)

### Community 3 - "Billing Import Pipeline"
Cohesion: 0.05
Nodes (47): Category, CategoryCreateDialog(), Props, CategoryEditDialog(), CategoryForm(), Category, ViewMode, ActionItem (+39 more)

### Community 4 - "Category & Transaction Domain"
Cohesion: 0.08
Nodes (27): IRecurringTransactionRepository, RecurringTransactionRecord, UpdateableFields, PrismaRecurringTransactionRepository, toRecord(), findDuplicateRecurringTransaction(), buildMonthlyView(), MonthlyViewInput (+19 more)

### Community 5 - "Credit Card Management"
Cohesion: 0.06
Nodes (31): LoyaltyPageClient(), Program, Props, Transfer, LoyaltyProgramCreateDialog(), Props, LoyaltyProgramForm(), PRESET_COLORS (+23 more)

### Community 6 - "Billing Import Wizard"
Cohesion: 0.08
Nodes (28): BillingImportWizard(), ImportSummary, Step1Data, STEPS, WizardStep, BANK_LABELS, BANK_OPTIONS, CreditCard (+20 more)

### Community 7 - "Recurring Transactions"
Cohesion: 0.12
Nodes (22): Category, Props, Category, Props, Closure, ClosureManagerDialog(), MONTH_NAMES, CreditCard (+14 more)

### Community 8 - "Transaction Form UI"
Cohesion: 0.1
Nodes (18): CategorizationPipeline, MerchantHistoryCategorizer, upsertMerchantHistory(), findCategoryByKeywords(), MerchantRule, MerchantRuleCategorizer, normalizeText(), RULES (+10 more)

### Community 9 - "AI Categorization Pipeline"
Cohesion: 0.07
Nodes (28): BackButton(), AddTransactionModal(), EDITABLE_TYPES, EditTransactionModal(), FifoData, formatBrl(), formatDate(), formatPts() (+20 more)

### Community 10 - "Annual Report Charts"
Cohesion: 0.11
Nodes (24): useCrossEntityDuplicateCheck(), formatDatePtBR(), formatAmountBR(), DuplicateWarning(), Match, CreditCard, EditInstallmentForm(), fmtCurrency() (+16 more)

### Community 11 - "Credit Card Purchase Repository"
Cohesion: 0.12
Nodes (21): CategoryList(), CategoriesPage(), CategoryRecord, getCategories(), Installment, Person, Props, Transaction (+13 more)

### Community 12 - "Credit Card UI"
Cohesion: 0.09
Nodes (19): BillEntry, BillInstallmentItem, BillSortDir, BillSortKey, BillView(), BillViewProps, CardInstallmentDesktopProps, CardInstallmentMobileProps (+11 more)

### Community 14 - "Expense & Income Forms"
Cohesion: 0.15
Nodes (16): InvalidBillingItemError, BillingItem, CreateInstallmentInput, CreateRefundInput, CreateTransactionInput, RefundBillingItem, TransactionBillingItem, isCSVFile() (+8 more)

### Community 15 - "Loyalty Program Detail"
Cohesion: 0.11
Nodes (20): formatAmount(), Installment, MonthlySummaryCard(), Props, Transaction, Category, DashboardPage(), getAnnualReport() (+12 more)

### Community 16 - "Monthly Transaction Table"
Cohesion: 0.12
Nodes (15): Category, PAYMENT_METHODS, Person, Props, RecurringTransactionForm(), Category, CreditCard, Installment (+7 more)

### Community 17 - "Bill View Component"
Cohesion: 0.21
Nodes (15): cn(), Badge(), BadgeProps, badgeVariants, buttonVariants, Calendar(), CalendarDayButton(), DatePicker() (+7 more)

### Community 18 - "App Layout & Navigation"
Cohesion: 0.15
Nodes (12): dmSerifDisplay, geistMono, geistSans, metadata, Theme, ThemeContext, ThemeProvider(), useTheme() (+4 more)

### Community 19 - "Category & Person Lists"
Cohesion: 0.13
Nodes (12): Category, CreditCard, EditState, Installment, MONTH_NAMES, Person, Props, Purchase (+4 more)

### Community 20 - "Monthly View Summary"
Cohesion: 0.17
Nodes (14): useDuplicateCheck(), parseCurrencyBR(), isDuplicateTransaction(), ExpenseForm(), Category, INCOME_SOURCES, IncomeForm(), Person (+6 more)

### Community 21 - "Installments List"
Cohesion: 0.25
Nodes (11): ClosureType, createCreditCard(), CreateCreditCardInput, CreditCardClosureRecord, CreditCardRecord, ICreditCardRepository, createCreditCardUseCase(), Input (+3 more)

### Community 22 - "Installments Page"
Cohesion: 0.24
Nodes (15): createInstallmentBillingItem(), createRefundBillingItem(), createTransactionBillingItem(), extractHeaderYear(), parseAmount(), parseBradescoCsv(), resolveYear(), SKIP_DESCRIPTIONS (+7 more)

### Community 23 - "Loyalty Transfer Table"
Cohesion: 0.25
Nodes (17): BANK_PARSERS, detectBank(), LineParser, parseAmount(), parseBillingText(), parseBradescoLine(), parseBtgLine(), parseC6Line() (+9 more)

### Community 24 - "Unified Transaction Form"
Cohesion: 0.18
Nodes (13): AnnualCard(), FIELD_CONFIG, formatAmount(), MONTH_NAMES, Props, AnnualReportCards(), Props, AnnualReportInput (+5 more)

### Community 25 - "Category Breakdown Chart"
Cohesion: 0.2
Nodes (6): createPerson(), IPersonRepository, PersonRecord, PrismaPersonRepository, createPersonUseCase(), Input

### Community 26 - "Transaction Repository"
Cohesion: 0.23
Nodes (11): createCreditCardRefund(), CreateCreditCardRefundInput, CreditCardRefundRecord, CreditCardRefundSource, ICreditCardRefundRepository, resolveFirstDueMonth(), createCreditCardRefundUseCase(), Input (+3 more)

### Community 27 - "Loading Skeletons"
Cohesion: 0.21
Nodes (12): CategoryLike, getFullPath(), Category, CategoryCombobox(), CategoryComboboxProps, Command, CommandEmpty, CommandGroup (+4 more)

### Community 28 - "Monthly View Page"
Cohesion: 0.26
Nodes (5): CreditCardPurchaseRecord, CreditCardPurchaseWithInstallments, ICreditCardPurchaseRepository, InstallmentRecord, findCrossEntityDuplicate()

### Community 29 - "Edit Installment Form"
Cohesion: 0.16
Nodes (10): Category, CreditCardOption, CreditCardRefundForm(), Person, Props, Category, CreditCard, Person (+2 more)

### Community 30 - "Category Create Dialog"
Cohesion: 0.18
Nodes (11): cancelInstallmentPurchase(), createInstallmentPurchase(), CreateInstallmentPurchaseInput, createInstallments(), CreateInstallmentsInput, InstallmentDraft, InstallmentDraftWithPurchaseId, InstallmentPurchaseResult (+3 more)

### Community 31 - "Loyalty Program List"
Cohesion: 0.19
Nodes (3): closureToRecord(), PrismaCreditCardRepository, toRecord()

### Community 32 - "Category Edit Dialog"
Cohesion: 0.23
Nodes (10): AnnualBalanceCard(), AnnualBalanceChart(), ChartProps, CustomTooltip(), fmtFull(), fmtSigned(), MONTH_NAMES, Props (+2 more)

### Community 33 - "Home Page"
Cohesion: 0.22
Nodes (11): Category, CreditCard, getCategories(), getCreditCards(), getMonthlyView(), getPeople(), Person, SearchParams (+3 more)

### Community 34 - "Monthly View Route"
Cohesion: 0.15
Nodes (8): EXPENSE_COLORS, INCOME_COLORS, IncomeExpenseBalanceCard(), MONTH_NAMES, Person, Props, TooltipEntry, TooltipPayloadEntry

### Community 35 - "Description Normalizer"
Cohesion: 0.22
Nodes (11): InstallmentsList(), InstallmentsTabs(), Props, Tab, getCategories(), getCreditCards(), getPeople(), getPurchases() (+3 more)

### Community 36 - "Monthly View API Endpoint"
Cohesion: 0.21
Nodes (9): CustomTooltip(), fmtFull(), fmtPct(), InvestmentOverviewCard(), MONTH_NAMES, Person, PERSON_COLORS, Props (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.24
Nodes (9): Program, Props, Transfer, TransfersPageClient(), getPrograms(), getTransfers(), LoyaltyTransfersPage(), Program (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (8): CustomTooltip(), fmtFull(), MONTH_NAMES, MonthlyExpensesCard(), Person, PERSON_COLORS, Props, TooltipPayloadEntry

### Community 40 - "Community 40"
Cohesion: 0.2
Nodes (10): BAR_COLORS, Category, CategoryBreakdownChart(), COLORS, CustomTooltip(), fmt(), Installment, Props (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (6): useCreditCardDuplicateCheck(), findDuplicateCreditCardPurchase(), resolveClosureForDate(), ResolvedClosure, createInstallmentPurchaseUseCase(), Input

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (4): AnnualBarChart(), MONTH_NAMES, Props, TooltipEntry

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (7): RawBillingRow, Classification, ClassificationItemSchema, ClassificationResult, classifyRows(), fallbackClassification(), OllamaResponseSchema

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (3): CreditCardList(), CreditCardsPage(), getCards()

## Knowledge Gaps
- **340 isolated node(s):** `geistSans`, `geistMono`, `dmSerifDisplay`, `metadata`, `LoyaltyProgramRecord` (+335 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TransactionRecord` connect `UI Pages & Components` to `API Route Handlers`, `Category & Transaction Domain`, `Annual Report Charts`, `Monthly View Summary`, `Unified Transaction Form`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `createRepositories()` connect `API Route Handlers` to `Expense & Income Forms`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `PrismaCreditCardPurchaseRepository` connect `Shared Form Components` to `API Route Handlers`, `Monthly View Page`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `dmSerifDisplay` to the rest of the system?**
  _340 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `UI Pages & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Application Use Cases` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._