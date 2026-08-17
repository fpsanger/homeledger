# Graph Report - homeledger  (2026-08-17)

## Corpus Check
- 279 files · ~66,656 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1379 nodes · 3144 edges · 64 communities (58 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6f6cc3a0`
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
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 63|Community 63]]

## God Nodes (most connected - your core abstractions)
1. `createRepositories()` - 68 edges
2. `errorResponse()` - 66 edges
3. `cn()` - 34 edges
4. `Button` - 28 edges
5. `PrismaCreditCardPurchaseRepository` - 26 edges
6. `DELETE()` - 22 edges
7. `parseCurrencyBR()` - 22 edges
8. `Select` - 20 edges
9. `Input` - 20 edges
10. `formatDatePtBR()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `updateCreditCardUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateCreditCardUseCase.ts
- `PUT()` --calls--> `updateExpenseUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateExpenseUseCase.ts
- `BulkAddPage()` --calls--> `buttonVariants`  [EXTRACTED]
  app/transactions/bulk-add/page.tsx → components/ui/button.tsx
- `GET()` --calls--> `getCreditCardBillUseCase()`  [EXTRACTED]
  app/api/credit-cards/bill/route.ts → application/use-cases/GetCreditCardBillUseCase.ts
- `PUT()` --calls--> `updateLoyaltyProgramUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/loyalty/UpdateLoyaltyProgramUseCase.ts

## Communities (64 total, 6 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.06
Nodes (58): GET(), GET(), POST(), POST(), GET(), POST(), DELETE(), GET() (+50 more)

### Community 1 - "UI Pages & Components"
Cohesion: 0.05
Nodes (56): createCategory(), CreateCategoryInput, createExpense(), CreateExpenseInput, createIncome(), CreateIncomeInput, createInvestment(), CreateInvestmentInput (+48 more)

### Community 2 - "Application Use Cases"
Cohesion: 0.06
Nodes (76): InvalidBillingItemError, BillingItem, createInstallmentBillingItem(), CreateInstallmentInput, createRefundBillingItem(), CreateRefundInput, createTransactionBillingItem(), CreateTransactionInput (+68 more)

### Community 3 - "Billing Import Pipeline"
Cohesion: 0.05
Nodes (40): BillingImportWizard(), ImportSummary, Step1Data, STEPS, WizardStep, BANK_LABELS, BANK_NAME_MATCHERS, BANK_OPTIONS (+32 more)

### Community 4 - "Category & Transaction Domain"
Cohesion: 0.06
Nodes (46): Category, CategoryEditDialog(), Props, Category, CategoryForm(), Props, Category, CreditCardOption (+38 more)

### Community 5 - "Credit Card Management"
Cohesion: 0.05
Nodes (44): formatDatePtBR(), BackButton(), AddTransactionModal(), buildTransactionRowActions(), computeEditFormInitialState(), EDITABLE_TYPES, EditTransactionModal(), FifoData (+36 more)

### Community 6 - "Billing Import Wizard"
Cohesion: 0.07
Nodes (33): GET(), MonthlyViewQuery, parseMonthlyViewQuery(), POST(), VALID_PAYMENT_METHODS, VALID_TYPES, IRecurringTransactionRepository, RecurringTransactionRecord (+25 more)

### Community 7 - "Recurring Transactions"
Cohesion: 0.11
Nodes (32): formatAmountBR(), CreditCard, EditInstallmentForm(), fmtCurrency(), fmtDate(), Installment, MONTH_ABBR, Person (+24 more)

### Community 8 - "Transaction Form UI"
Cohesion: 0.1
Nodes (18): CategorizationPipeline, MerchantHistoryCategorizer, upsertMerchantHistory(), findCategoryByKeywords(), MerchantRule, MerchantRuleCategorizer, normalizeText(), RULES (+10 more)

### Community 9 - "AI Categorization Pipeline"
Cohesion: 0.09
Nodes (22): MONTH_NAMES, Props, TooltipEntry, AnnualCard(), FIELD_CONFIG, formatAmount(), MONTH_NAMES, Props (+14 more)

### Community 10 - "Annual Report Charts"
Cohesion: 0.1
Nodes (17): Closure, ClosureManagerDialog(), MONTH_NAMES, CreditCard, CreditCardForm(), Props, submitButtonLabel(), CreditCard (+9 more)

### Community 11 - "Credit Card Purchase Repository"
Cohesion: 0.1
Nodes (22): BulkAddActionsProps, BulkAddClient(), BulkAddRowsProps, CreditCard, Props, BulkAddRow(), BulkAddPage(), Category (+14 more)

### Community 12 - "Credit Card UI"
Cohesion: 0.12
Nodes (20): CategoryList(), CategoriesPage(), CategoryRecord, getCategories(), ANNUAL_CARD_ROWS, ANNUAL_CARDS, CHART_CARDS, getPeople() (+12 more)

### Community 13 - "Shared Form Components"
Cohesion: 0.11
Nodes (27): parseCurrencyBR(), Category, ClosureRecord, computeBillingMonths(), computeCreditCrossDuplicateValues(), computeDuplicateCheckValues(), CreditCard, deriveDuplicateMatch() (+19 more)

### Community 14 - "Expense & Income Forms"
Cohesion: 0.1
Nodes (20): buildRowActions(), Category, DesktopProps, fmtCurrency(), fmtDate(), matchesCategoryFilter(), matchesFilters(), matchesRangeFilters() (+12 more)

### Community 15 - "Loyalty Program Detail"
Cohesion: 0.09
Nodes (18): BillEntry, BillInstallmentItem, BillSortDir, BillSortKey, BillViewProps, CardInstallmentDesktopProps, CardInstallmentMobileProps, CardInstallmentSharedProps (+10 more)

### Community 16 - "Monthly Transaction Table"
Cohesion: 0.17
Nodes (20): cn(), buttonVariants, Calendar(), CalendarDayButton(), Category, CategoryComboboxProps, Command, CommandEmpty (+12 more)

### Community 18 - "App Layout & Navigation"
Cohesion: 0.18
Nodes (16): GET(), POST(), ClosureType, createCreditCard(), CreateCreditCardInput, CreditCardClosureRecord, CreditCardRecord, validateClosureFields() (+8 more)

### Community 19 - "Category & Person Lists"
Cohesion: 0.1
Nodes (15): useFilteredSortedInstallments(), useInstallmentActions(), ActionItem, CreditCardItem, DesktopProps, fmt(), Installment, InstallmentFilters (+7 more)

### Community 20 - "Monthly View Summary"
Cohesion: 0.14
Nodes (15): getLoyaltyProgramReportUseCase(), applyAdjustment(), applyExpire(), applyRedeem(), applyTransferOut(), computeLoyaltyFifo(), consumeLots(), CostLot (+7 more)

### Community 21 - "Installments List"
Cohesion: 0.15
Nodes (12): dmSerifDisplay, geistMono, geistSans, metadata, Theme, ThemeContext, ThemeProvider(), useTheme() (+4 more)

### Community 22 - "Installments Page"
Cohesion: 0.12
Nodes (9): HEADER_COLS, ROW_COLS, ROWS, PURCHASE_CARDS, COL_KEYS, ROWS_4, ROWS_5, SUMMARY_CARDS (+1 more)

### Community 23 - "Loyalty Transfer Table"
Cohesion: 0.12
Nodes (11): EXPENSE_COLORS, INCOME_COLORS, IncomeExpenseBalanceCard(), MONTH_NAMES, Person, Props, TooltipEntry, TooltipPayloadEntry (+3 more)

### Community 24 - "Unified Transaction Form"
Cohesion: 0.16
Nodes (15): formatAmount(), Installment, MonthlySummaryCard(), Props, Transaction, Category, DashboardPage(), getAnnualReport() (+7 more)

### Community 25 - "Category Breakdown Chart"
Cohesion: 0.21
Nodes (12): Category, ViewMode, Person, DropdownItem, DropdownMenu(), DropdownMenuProps, Table, TableBody (+4 more)

### Community 26 - "Transaction Repository"
Cohesion: 0.22
Nodes (11): createLoyaltyProgram(), CreateLoyaltyProgramInput, LoyaltyProgramRecord, LoyaltyProgramType, createLoyaltyProgramUseCase(), Input, listLoyaltyProgramsUseCase(), Input (+3 more)

### Community 27 - "Loading Skeletons"
Cohesion: 0.15
Nodes (12): Category, CategoryCreateDialog(), Props, Props, LoyaltyProgramForm(), PRESET_COLORS, Props, TYPES (+4 more)

### Community 28 - "Monthly View Page"
Cohesion: 0.18
Nodes (8): createLoyaltyTransfer(), CreateLoyaltyTransferInput, LoyaltyTransferRecord, createLoyaltyTransferUseCase(), Input, ILoyaltyTransferRepository, PrismaLoyaltyTransferRepository, toRecord()

### Community 29 - "Edit Installment Form"
Cohesion: 0.22
Nodes (6): DuplicateCategoryError, NotFoundError, TRANSFER_TYPES, Input, TRANSFER_TYPES, ILoyaltyTransactionRepository

### Community 30 - "Category Create Dialog"
Cohesion: 0.24
Nodes (6): useCrossEntityDuplicateCheck(), CreditCardPurchaseRecord, CreditCardPurchaseWithInstallments, ICreditCardPurchaseRepository, InstallmentRecord, findCrossEntityDuplicate()

### Community 31 - "Loyalty Program List"
Cohesion: 0.21
Nodes (11): AnnualBalanceCard(), AnnualBalanceChart(), ChartProps, CustomTooltip(), fmtFull(), fmtSigned(), MONTH_NAMES, Props (+3 more)

### Community 32 - "Category Edit Dialog"
Cohesion: 0.18
Nodes (10): AccessibleChart(), Props, CustomTooltip(), fmtFull(), MONTH_NAMES, MonthlyExpensesCard(), Person, PERSON_COLORS (+2 more)

### Community 33 - "Home Page"
Cohesion: 0.16
Nodes (11): formatBrl(), LoyaltyPageClient(), Program, Props, Summary, Transfer, LoyaltyProgramCreateDialog(), LoyaltyProgramList() (+3 more)

### Community 34 - "Monthly View Route"
Cohesion: 0.19
Nodes (3): closureToRecord(), PrismaCreditCardRepository, toRecord()

### Community 35 - "Description Normalizer"
Cohesion: 0.22
Nodes (11): InstallmentsList(), InstallmentsTabs(), Props, Tab, getCategories(), getCreditCards(), getPeople(), getPurchases() (+3 more)

### Community 36 - "Monthly View API Endpoint"
Cohesion: 0.15
Nodes (8): Category, CreditCard, EditState, Installment, MONTH_NAMES, Person, Props, Purchase

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (11): createLoyaltyTransaction(), CreateLoyaltyTransactionInput, LoyaltyTransactionRecord, LoyaltyTransactionType, TRANSFER_TYPES, validateLoyaltyTransactionInput(), validatePointsAndCostRules(), validateTransferIdRules() (+3 more)

### Community 38 - "Community 38"
Cohesion: 0.31
Nodes (8): createCreditCardRefund(), CreateCreditCardRefundInput, CreditCardRefundRecord, CreditCardRefundSource, ICreditCardRefundRepository, resolveFirstDueMonth(), createCreditCardRefundUseCase(), Input

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (10): cancelInstallmentPurchase(), CreateInstallmentPurchaseInput, createInstallments(), CreateInstallmentsInput, InstallmentDraft, InstallmentDraftWithPurchaseId, InstallmentPurchaseResult, PurchaseDraft (+2 more)

### Community 40 - "Community 40"
Cohesion: 0.2
Nodes (11): BAR_COLORS, buildCategoryBreakdown(), Category, CategoryBreakdownChart(), COLORS, CustomTooltip(), fmt(), Installment (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.21
Nodes (9): CustomTooltip(), fmtFull(), fmtPct(), InvestmentOverviewCard(), MONTH_NAMES, Person, PERSON_COLORS, Props (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.2
Nodes (8): Installment, Person, Props, Transaction, MONTH_NAMES, MonthNav(), Person, Props

### Community 43 - "Community 43"
Cohesion: 0.29
Nodes (9): Category, CreditCard, getCategories(), getCreditCards(), getMonthlyView(), getPeople(), Person, SearchParams (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.24
Nodes (7): EMPTY_SUMMARY, getLoyaltyPrograms(), getTransfers(), LoyaltyPage(), LoyaltyProgramRecord, Summary, Transfer

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (6): useCreditCardDuplicateCheck(), createInstallmentPurchase(), findDuplicateCreditCardPurchase(), resolveClosureForDate(), createInstallmentPurchaseUseCase(), Input

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (7): LoyaltyTransferDialog(), Program, Props, Transfer, TransfersPageClient(), PageHeader(), Props

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): CreditCard, INCOME_SOURCES, PAYMENT_METHODS, Props, ROW_TYPES

### Community 50 - "Community 50"
Cohesion: 0.52
Nodes (5): Installment, InstallmentFilters, SortDir, SortKey, toDateMs()

### Community 51 - "Community 51"
Cohesion: 0.43
Nodes (5): CardInstallmentTable(), BillInstallmentItem, BillSortDir, BillSortKey, useInstallmentFilters()

### Community 52 - "Community 52"
Cohesion: 0.38
Nodes (6): computeTransferPreview(), formatBrl(), LoyaltyTransferForm(), Program, Props, TransferPreview

### Community 53 - "Community 53"
Cohesion: 0.38
Nodes (6): BillInstallmentItem, CreditCardBillEntry, getCreditCardBillUseCase(), groupInstallmentsByCard(), groupRefundsByCard(), Input

### Community 54 - "Community 54"
Cohesion: 0.47
Nodes (5): getPrograms(), getTransfers(), LoyaltyTransfersPage(), Program, Transfer

### Community 56 - "Community 56"
Cohesion: 0.6
Nodes (3): fmt(), InstallmentSummaryPanel(), SummaryCard()

### Community 57 - "Community 57"
Cohesion: 0.4
Nodes (5): BillView(), CardHeaderRow(), formatCurrency(), formatItemsSummary(), formatMonth()

### Community 58 - "Community 58"
Cohesion: 0.67
Nodes (3): fmtCurrency(), TransactionAmount(), TransactionAmountProps

## Knowledge Gaps
- **394 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `PURCHASE_CARDS`, `LoyaltyProgramRecord` (+389 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TransactionRecord` connect `UI Pages & Components` to `AI Categorization Pipeline`, `Credit Card Management`, `Billing Import Wizard`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `formatDatePtBR()` connect `Credit Card Management` to `Monthly View API Endpoint`, `Recurring Transactions`, `Shared Form Components`, `Expense & Income Forms`, `Loyalty Program Detail`, `Category & Person Lists`, `Category Breakdown Chart`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `createRepositories()` connect `API Route Handlers` to `UI Pages & Components`, `Application Use Cases`, `Billing Import Wizard`, `App Layout & Navigation`, `Transaction Repository`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _394 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `UI Pages & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Application Use Cases` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._