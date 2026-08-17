# Graph Report - homeledger  (2026-08-17)

## Corpus Check
- 274 files · ~64,930 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1342 nodes · 3060 edges · 58 communities (52 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `05125352`
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
- [[_COMMUNITY_Community 57|Community 57]]

## God Nodes (most connected - your core abstractions)
1. `createRepositories()` - 68 edges
2. `errorResponse()` - 66 edges
3. `cn()` - 34 edges
4. `Button` - 26 edges
5. `PrismaCreditCardPurchaseRepository` - 26 edges
6. `DELETE()` - 22 edges
7. `Select` - 19 edges
8. `Input` - 19 edges
9. `parseCurrencyBR()` - 18 edges
10. `formatDatePtBR()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `updateCreditCardUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateCreditCardUseCase.ts
- `CalendarDayButton()` --calls--> `cn()`  [EXTRACTED]
  components/ui/calendar.tsx → lib/utils.ts
- `GET()` --calls--> `getCreditCardBillUseCase()`  [EXTRACTED]
  app/api/credit-cards/bill/route.ts → application/use-cases/GetCreditCardBillUseCase.ts
- `PUT()` --calls--> `updateExpenseUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateExpenseUseCase.ts
- `PUT()` --calls--> `updateLoyaltyProgramUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/loyalty/UpdateLoyaltyProgramUseCase.ts

## Communities (58 total, 6 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.05
Nodes (75): GET(), GET(), POST(), POST(), GET(), POST(), DELETE(), GET() (+67 more)

### Community 1 - "UI Pages & Components"
Cohesion: 0.05
Nodes (45): useCreditCardDuplicateCheck(), POST(), VALID_PAYMENT_METHODS, VALID_TYPES, CreditCardPurchaseRecord, CreditCardPurchaseWithInstallments, ICreditCardPurchaseRepository, InstallmentRecord (+37 more)

### Community 2 - "Application Use Cases"
Cohesion: 0.06
Nodes (75): InvalidBillingItemError, BillingItem, createInstallmentBillingItem(), CreateInstallmentInput, createRefundBillingItem(), CreateRefundInput, createTransactionBillingItem(), CreateTransactionInput (+67 more)

### Community 3 - "Billing Import Pipeline"
Cohesion: 0.05
Nodes (41): BillingImportWizard(), ImportSummary, Step1Data, STEPS, WizardStep, BANK_LABELS, BANK_NAME_MATCHERS, BANK_OPTIONS (+33 more)

### Community 4 - "Category & Transaction Domain"
Cohesion: 0.06
Nodes (42): DuplicateCategoryError, createCategory(), CreateCategoryInput, createExpense(), CreateExpenseInput, createIncome(), CreateIncomeInput, createInvestment() (+34 more)

### Community 5 - "Credit Card Management"
Cohesion: 0.05
Nodes (42): formatBrl(), LoyaltyPageClient(), Program, Props, Summary, Transfer, LoyaltyProgramCreateDialog(), Props (+34 more)

### Community 6 - "Billing Import Wizard"
Cohesion: 0.07
Nodes (35): BackButton(), AddTransactionModal(), buildTransactionRowActions(), computeEditFormInitialState(), EDITABLE_TYPES, EditTransactionModal(), FifoData, formatBrl() (+27 more)

### Community 7 - "Recurring Transactions"
Cohesion: 0.11
Nodes (31): formatAmountBR(), CreditCard, EditInstallmentForm(), fmtCurrency(), fmtDate(), Installment, MONTH_ABBR, Person (+23 more)

### Community 8 - "Transaction Form UI"
Cohesion: 0.1
Nodes (18): CategorizationPipeline, MerchantHistoryCategorizer, upsertMerchantHistory(), findCategoryByKeywords(), MerchantRule, MerchantRuleCategorizer, normalizeText(), RULES (+10 more)

### Community 9 - "AI Categorization Pipeline"
Cohesion: 0.1
Nodes (20): useFilteredSortedInstallments(), useInstallmentActions(), ActionItem, CreditCardItem, DesktopProps, fmt(), Installment, InstallmentFilters (+12 more)

### Community 10 - "Annual Report Charts"
Cohesion: 0.09
Nodes (22): buildRowActions(), Category, DesktopProps, fmtCurrency(), fmtDate(), matchesCategoryFilter(), matchesFilters(), matchesRangeFilters() (+14 more)

### Community 11 - "Credit Card Purchase Repository"
Cohesion: 0.11
Nodes (27): parseCurrencyBR(), Category, ClosureRecord, computeBillingMonths(), computeCreditCrossDuplicateValues(), computeDuplicateCheckValues(), CreditCard, deriveDuplicateMatch() (+19 more)

### Community 12 - "Credit Card UI"
Cohesion: 0.08
Nodes (19): BillEntry, BillInstallmentItem, BillSortDir, BillSortKey, BillViewProps, CardInstallmentDesktopProps, CardInstallmentMobileProps, CardInstallmentSharedProps (+11 more)

### Community 13 - "Shared Form Components"
Cohesion: 0.13
Nodes (19): CategoriesPage(), CategoryRecord, getCategories(), ANNUAL_CARD_ROWS, ANNUAL_CARDS, CHART_CARDS, getPeople(), PeoplePage() (+11 more)

### Community 14 - "Expense & Income Forms"
Cohesion: 0.15
Nodes (21): CategoryLike, getFullPath(), cn(), Category, CategoryCombobox(), CategoryComboboxProps, Command, CommandEmpty (+13 more)

### Community 15 - "Loyalty Program Detail"
Cohesion: 0.13
Nodes (19): useCrossEntityDuplicateCheck(), useDuplicateCheck(), isDuplicateTransaction(), DuplicateWarning(), Match, Category, ExpenseForm(), PAYMENT_METHODS (+11 more)

### Community 17 - "Bill View Component"
Cohesion: 0.13
Nodes (15): Category, CategoryCreateDialog(), Props, Category, Props, Category, CategoryForm(), Props (+7 more)

### Community 18 - "App Layout & Navigation"
Cohesion: 0.11
Nodes (15): AnnualBalanceCard(), AnnualBalanceChart(), ChartProps, CustomTooltip(), fmtFull(), fmtSigned(), MONTH_NAMES, Props (+7 more)

### Community 19 - "Category & Person Lists"
Cohesion: 0.13
Nodes (16): Category, CreditCardOption, Person, Props, Category, CreditCard, Person, Category (+8 more)

### Community 20 - "Monthly View Summary"
Cohesion: 0.22
Nodes (12): ClosureType, createCreditCard(), CreateCreditCardInput, CreditCardClosureRecord, CreditCardRecord, validateClosureFields(), ICreditCardRepository, Input (+4 more)

### Community 21 - "Installments List"
Cohesion: 0.17
Nodes (15): CategoryEditDialog(), Category, CategoryList(), ViewMode, Person, PersonList(), DropdownItem, DropdownMenu() (+7 more)

### Community 22 - "Installments Page"
Cohesion: 0.13
Nodes (17): formatAmount(), Installment, MonthlySummaryCard(), Props, Transaction, Category, DashboardPage(), getAnnualReport() (+9 more)

### Community 23 - "Loyalty Transfer Table"
Cohesion: 0.14
Nodes (13): Closure, ClosureManagerDialog(), MONTH_NAMES, CreditCard, CreditCardList(), Props, CreditCardsPage(), getCards() (+5 more)

### Community 24 - "Unified Transaction Form"
Cohesion: 0.19
Nodes (14): createCreditCardRefund(), CreateCreditCardRefundInput, CreditCardRefundRecord, CreditCardRefundSource, ICreditCardRefundRepository, resolveFirstDueMonth(), createCreditCardRefundUseCase(), Input (+6 more)

### Community 25 - "Category Breakdown Chart"
Cohesion: 0.14
Nodes (15): cancelInstallmentPurchase(), createInstallmentPurchase(), CreateInstallmentPurchaseInput, createInstallments(), CreateInstallmentsInput, InstallmentDraft, InstallmentDraftWithPurchaseId, InstallmentPurchaseResult (+7 more)

### Community 26 - "Transaction Repository"
Cohesion: 0.12
Nodes (9): HEADER_COLS, ROW_COLS, ROWS, PURCHASE_CARDS, COL_KEYS, ROWS_4, ROWS_5, SUMMARY_CARDS (+1 more)

### Community 27 - "Loading Skeletons"
Cohesion: 0.15
Nodes (12): dmSerifDisplay, geistMono, geistSans, metadata, Theme, ThemeContext, ThemeProvider(), useTheme() (+4 more)

### Community 28 - "Monthly View Page"
Cohesion: 0.2
Nodes (9): NotFoundError, LoyaltyTransactionType, Input, TRANSFER_TYPES, TRANSFER_TYPES, Input, TRANSFER_TYPES, ILoyaltyTransactionRepository (+1 more)

### Community 29 - "Edit Installment Form"
Cohesion: 0.12
Nodes (11): EXPENSE_COLORS, INCOME_COLORS, IncomeExpenseBalanceCard(), MONTH_NAMES, Person, Props, TooltipEntry, TooltipPayloadEntry (+3 more)

### Community 30 - "Category Create Dialog"
Cohesion: 0.16
Nodes (12): applyAdjustment(), applyExpire(), applyRedeem(), applyTransferOut(), consumeLots(), CostLot, EnrichedTransaction, FifoData (+4 more)

### Community 31 - "Loyalty Program List"
Cohesion: 0.18
Nodes (13): AnnualCard(), FIELD_CONFIG, formatAmount(), MONTH_NAMES, Props, Amount(), AnnualStat(), formatAmount() (+5 more)

### Community 32 - "Category Edit Dialog"
Cohesion: 0.19
Nodes (3): closureToRecord(), PrismaCreditCardRepository, toRecord()

### Community 33 - "Home Page"
Cohesion: 0.18
Nodes (10): AccessibleChart(), Props, CustomTooltip(), fmtFull(), MONTH_NAMES, MonthlyExpensesCard(), Person, PERSON_COLORS (+2 more)

### Community 34 - "Monthly View Route"
Cohesion: 0.25
Nodes (8): createLoyaltyTransaction(), createLoyaltyTransfer(), CreateLoyaltyTransferInput, LoyaltyTransferRecord, createLoyaltyTransferUseCase(), Input, ILoyaltyTransferRepository, computeLoyaltyFifo()

### Community 35 - "Description Normalizer"
Cohesion: 0.26
Nodes (8): createLoyaltyProgram(), CreateLoyaltyProgramInput, LoyaltyProgramRecord, LoyaltyProgramType, createLoyaltyProgramUseCase(), Input, Input, ILoyaltyProgramRepository

### Community 36 - "Monthly View API Endpoint"
Cohesion: 0.22
Nodes (11): InstallmentsList(), InstallmentsTabs(), Props, Tab, getCategories(), getCreditCards(), getPeople(), getPurchases() (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.19
Nodes (10): CustomTooltip(), fmtFull(), fmtPct(), InvestmentOverviewCard(), MONTH_NAMES, Person, PERSON_COLORS, Props (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (8): Category, CreditCard, EditState, Installment, MONTH_NAMES, Person, Props, Purchase

### Community 39 - "Community 39"
Cohesion: 0.2
Nodes (11): BAR_COLORS, buildCategoryBreakdown(), Category, CategoryBreakdownChart(), COLORS, CustomTooltip(), fmt(), Installment (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.2
Nodes (8): Installment, Person, Props, Transaction, MONTH_NAMES, MonthNav(), Person, Props

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (6): Button, ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), FilterGroup

### Community 42 - "Community 42"
Cohesion: 0.24
Nodes (6): formatDatePtBR(), formatDate(), Program, Props, Transfer, buildInstallmentRowView()

### Community 43 - "Community 43"
Cohesion: 0.29
Nodes (9): Category, CreditCard, getCategories(), getCreditCards(), getMonthlyView(), getPeople(), Person, SearchParams (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.43
Nodes (5): CardInstallmentTable(), BillInstallmentItem, BillSortDir, BillSortKey, useInstallmentFilters()

### Community 48 - "Community 48"
Cohesion: 0.38
Nodes (6): CreateLoyaltyTransactionInput, LoyaltyTransactionRecord, TRANSFER_TYPES, validateLoyaltyTransactionInput(), validatePointsAndCostRules(), validateTransferIdRules()

### Community 50 - "Community 50"
Cohesion: 0.6
Nodes (4): GET(), POST(), createCreditCardUseCase(), listCreditCardsUseCase()

### Community 51 - "Community 51"
Cohesion: 0.4
Nodes (5): BillView(), CardHeaderRow(), formatCurrency(), formatItemsSummary(), formatMonth()

### Community 52 - "Community 52"
Cohesion: 0.6
Nodes (3): fmt(), InstallmentSummaryPanel(), SummaryCard()

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (3): fmtCurrency(), TransactionAmount(), TransactionAmountProps

## Knowledge Gaps
- **380 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `PURCHASE_CARDS`, `LoyaltyProgramRecord` (+375 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TransactionRecord` connect `UI Pages & Components` to `API Route Handlers`, `Category & Transaction Domain`, `Loyalty Program Detail`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `createRepositories()` connect `API Route Handlers` to `UI Pages & Components`, `Community 50`, `Application Use Cases`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `formatDatePtBR()` connect `Community 42` to `Billing Import Wizard`, `Recurring Transactions`, `Community 38`, `AI Categorization Pipeline`, `Annual Report Charts`, `Credit Card Purchase Repository`, `Credit Card UI`, `Loyalty Program Detail`, `Installments List`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _380 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `UI Pages & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Application Use Cases` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._