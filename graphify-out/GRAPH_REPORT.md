# Graph Report - homeledger  (2026-08-23)

## Corpus Check
- 287 files · ~69,180 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1424 nodes · 3381 edges · 66 communities (61 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6dac4b08`
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
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 65|Community 65]]

## God Nodes (most connected - your core abstractions)
1. `createRepositories()` - 68 edges
2. `errorResponse()` - 66 edges
3. `usePrivacy()` - 43 edges
4. `cn()` - 36 edges
5. `Button` - 31 edges
6. `PrismaCreditCardPurchaseRepository` - 26 edges
7. `parseCurrencyBR()` - 25 edges
8. `maskCurrency()` - 24 edges
9. `DELETE()` - 22 edges
10. `Select` - 22 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `updateCreditCardUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateCreditCardUseCase.ts
- `PUT()` --calls--> `updateLoyaltyProgramUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/loyalty/UpdateLoyaltyProgramUseCase.ts
- `PUT()` --calls--> `updateLoyaltyTransactionUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/loyalty/UpdateLoyaltyTransactionUseCase.ts
- `DELETE()` --calls--> `deleteLoyaltyProgramUseCase()`  [INFERRED]
  app/api/credit-card-refunds/[id]/route.ts → application/use-cases/loyalty/DeleteLoyaltyProgramUseCase.ts
- `DELETE()` --calls--> `deleteLoyaltyTransactionUseCase()`  [INFERRED]
  app/api/credit-card-refunds/[id]/route.ts → application/use-cases/loyalty/DeleteLoyaltyTransactionUseCase.ts

## Communities (66 total, 5 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.05
Nodes (76): InvalidBillingItemError, BillingItem, createInstallmentBillingItem(), CreateInstallmentInput, createRefundBillingItem(), CreateRefundInput, createTransactionBillingItem(), CreateTransactionInput (+68 more)

### Community 1 - "UI Pages & Components"
Cohesion: 0.05
Nodes (48): createCategory(), CreateCategoryInput, createExpense(), CreateExpenseInput, createIncome(), CreateIncomeInput, createInvestment(), CreateInvestmentInput (+40 more)

### Community 2 - "Application Use Cases"
Cohesion: 0.05
Nodes (42): AnnualBarChart(), MONTH_NAMES, Props, TooltipEntry, AnnualCard(), FIELD_CONFIG, formatAmount(), MONTH_NAMES (+34 more)

### Community 3 - "Billing Import Pipeline"
Cohesion: 0.07
Nodes (46): useDuplicateCheck(), parseCurrencyBR(), isDuplicateTransaction(), DuplicateWarning(), Category, ExpenseForm(), PAYMENT_METHODS, Person (+38 more)

### Community 4 - "Category & Transaction Domain"
Cohesion: 0.09
Nodes (29): Category, Props, Category, Props, Closure, MONTH_NAMES, CreditCard, CreditCardForm() (+21 more)

### Community 5 - "Credit Card Management"
Cohesion: 0.07
Nodes (36): BackButton(), AddTransactionModal(), buildTransactionRowActions(), computeEditFormInitialState(), EDITABLE_TYPES, EditTransactionModal(), FifoData, formatBrl() (+28 more)

### Community 6 - "Billing Import Wizard"
Cohesion: 0.11
Nodes (30): GET(), GET(), POST(), POST(), GET(), POST(), DELETE(), GET() (+22 more)

### Community 7 - "Recurring Transactions"
Cohesion: 0.11
Nodes (30): AnnualBalanceCard(), AnnualBalanceChart(), ChartProps, CustomTooltip(), fmtFull(), fmtSigned(), MONTH_NAMES, Props (+22 more)

### Community 8 - "Transaction Form UI"
Cohesion: 0.13
Nodes (16): DuplicateCategoryError, NotFoundError, DELETE(), PATCH(), PaymentMethod, PUT(), VALID_PAYMENT_METHODS, deleteLoyaltyTransferUseCase() (+8 more)

### Community 9 - "AI Categorization Pipeline"
Cohesion: 0.11
Nodes (31): formatAmountBR(), CreditCard, EditInstallmentForm(), fmtCurrency(), fmtDate(), Installment, MONTH_ABBR, Person (+23 more)

### Community 10 - "Annual Report Charts"
Cohesion: 0.1
Nodes (18): CategorizationPipeline, MerchantHistoryCategorizer, upsertMerchantHistory(), findCategoryByKeywords(), MerchantRule, MerchantRuleCategorizer, normalizeText(), RULES (+10 more)

### Community 11 - "Credit Card Purchase Repository"
Cohesion: 0.14
Nodes (25): CreditCard, Props, CategoryLike, getFullPath(), cn(), Calendar(), CalendarDayButton(), Category (+17 more)

### Community 12 - "Credit Card UI"
Cohesion: 0.1
Nodes (24): CategoryForm(), CategoryList(), CategoriesPage(), CategoryRecord, getCategories(), ANNUAL_CARD_ROWS, ANNUAL_CARDS, CHART_CARDS (+16 more)

### Community 13 - "Shared Form Components"
Cohesion: 0.08
Nodes (22): AccessibleChart(), Props, EXPENSE_COLORS, INCOME_COLORS, IncomeExpenseBalanceCard(), MONTH_NAMES, Person, Props (+14 more)

### Community 14 - "Expense & Income Forms"
Cohesion: 0.09
Nodes (19): BulkAddCreditCardPurchaseClient(), CreditCard, Props, Section, SectionsAction, SectionsState, submitToRows(), useBulkAddForm() (+11 more)

### Community 15 - "Loyalty Program Detail"
Cohesion: 0.09
Nodes (22): buildRowActions(), Category, DesktopProps, fmtCurrency(), fmtDate(), matchesCategoryFilter(), matchesFilters(), matchesRangeFilters() (+14 more)

### Community 16 - "Monthly Transaction Table"
Cohesion: 0.1
Nodes (20): BulkAddActionsProps, BulkAddClient(), BulkAddRowsProps, CreditCard, Props, BulkAddRow(), CreditCard, INCOME_SOURCES (+12 more)

### Community 17 - "Bill View Component"
Cohesion: 0.12
Nodes (15): createLoyaltyProgram(), CreateLoyaltyProgramInput, LoyaltyProgramRecord, LoyaltyProgramType, createLoyaltyProgramUseCase(), Input, deleteLoyaltyProgramUseCase(), listLoyaltyProgramsUseCase() (+7 more)

### Community 18 - "App Layout & Navigation"
Cohesion: 0.13
Nodes (20): createLoyaltyTransaction(), CreateLoyaltyTransactionInput, LoyaltyTransactionRecord, LoyaltyTransactionType, TRANSFER_TYPES, validateLoyaltyTransactionInput(), validatePointsAndCostRules(), validateTransferIdRules() (+12 more)

### Community 19 - "Category & Person Lists"
Cohesion: 0.08
Nodes (19): BillEntry, BillInstallmentItem, BillSortDir, BillSortKey, BillViewProps, CardInstallmentDesktopProps, CardInstallmentMobileProps, CardInstallmentSharedProps (+11 more)

### Community 20 - "Monthly View Summary"
Cohesion: 0.09
Nodes (18): useFilteredSortedInstallments(), useInstallmentActions(), ActionItem, CreditCardItem, DesktopProps, fmt(), Installment, InstallmentFilters (+10 more)

### Community 21 - "Installments List"
Cohesion: 0.09
Nodes (14): BANK_LABELS, BANK_NAME_MATCHERS, BANK_OPTIONS, BankMismatchHint(), CreditCard, CURRENT_YEAR, inferBankFromCardName(), MONTH_ABBREVIATIONS (+6 more)

### Community 23 - "Loyalty Transfer Table"
Cohesion: 0.19
Nodes (14): ClosureType, createCreditCard(), CreateCreditCardInput, CreditCardClosureRecord, CreditCardRecord, validateClosureFields(), ICreditCardRepository, ResolvedClosure (+6 more)

### Community 24 - "Unified Transaction Form"
Cohesion: 0.14
Nodes (13): createLoyaltyTransfer(), CreateLoyaltyTransferInput, LoyaltyTransferRecord, createLoyaltyTransferUseCase(), Input, listLoyaltyTransfersUseCase(), ILoyaltyTransferRepository, PrismaLoyaltyTransferRepository (+5 more)

### Community 25 - "Category Breakdown Chart"
Cohesion: 0.13
Nodes (14): dmSerifDisplay, geistMono, geistSans, metadata, PrivacyContext, PrivacyProvider(), Theme, ThemeContext (+6 more)

### Community 26 - "Transaction Repository"
Cohesion: 0.14
Nodes (16): Category, DashboardPage(), getAnnualReport(), getCategories(), getMonthlyView(), getPeople(), Person, SearchParams (+8 more)

### Community 27 - "Loading Skeletons"
Cohesion: 0.19
Nodes (13): CategoryEditDialog(), Category, ViewMode, Person, DropdownItem, DropdownMenu(), DropdownMenuProps, Table (+5 more)

### Community 28 - "Monthly View Page"
Cohesion: 0.13
Nodes (11): Category, CreditCard, EditState, Installment, MONTH_NAMES, Person, Props, Purchase (+3 more)

### Community 29 - "Edit Installment Form"
Cohesion: 0.15
Nodes (13): applyAdjustment(), applyExpire(), applyRedeem(), applyTransferOut(), consumeLots(), CostLot, EnrichedTransaction, FifoData (+5 more)

### Community 30 - "Category Create Dialog"
Cohesion: 0.16
Nodes (13): LoyaltyTransferDialog(), Program, Props, LoyaltyTransferTable(), Program, Props, Transfer, TransfersPageClient() (+5 more)

### Community 31 - "Loyalty Program List"
Cohesion: 0.24
Nodes (6): useCrossEntityDuplicateCheck(), CreditCardPurchaseRecord, CreditCardPurchaseWithInstallments, ICreditCardPurchaseRepository, InstallmentRecord, findCrossEntityDuplicate()

### Community 32 - "Category Edit Dialog"
Cohesion: 0.21
Nodes (10): BillingImportWizard(), ImportSummary, STEPS, WizardStep, Step4Import(), Props, Step5Done(), ImportSummary (+2 more)

### Community 33 - "Home Page"
Cohesion: 0.16
Nodes (11): Category, CategoryCreateDialog(), Props, LoyaltyProgramCreateDialog(), Props, LoyaltyProgramForm(), PRESET_COLORS, Props (+3 more)

### Community 34 - "Monthly View Route"
Cohesion: 0.33
Nodes (11): BulkAddCreditCardPage(), BulkAddPage(), Category, CreditCard, getCategories(), getCreditCards(), getPeople(), Person (+3 more)

### Community 35 - "Description Normalizer"
Cohesion: 0.19
Nodes (3): closureToRecord(), PrismaCreditCardRepository, toRecord()

### Community 36 - "Monthly View API Endpoint"
Cohesion: 0.31
Nodes (8): createPerson(), GET(), POST(), IPersonRepository, PersonRecord, createPersonUseCase(), Input, listPeopleUseCase()

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (12): BAR_COLORS, buildCategoryBreakdown(), Category, CategoryBreakdownChart(), COLORS, CustomTooltip(), fmt(), Installment (+4 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (7): InstallmentForm, ItemForm, ItemStatus, Props, RefundForm, TransactionForm, InstallmentBillingItem

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (11): InstallmentsList(), InstallmentsTabs(), Props, Tab, getCategories(), getCreditCards(), getPeople(), getPurchases() (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.18
Nodes (10): formatBrl(), LoyaltyPageClient(), Program, Props, Summary, Transfer, LoyaltyProgramList(), Program (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (10): cancelInstallmentPurchase(), CreateInstallmentPurchaseInput, createInstallments(), CreateInstallmentsInput, InstallmentDraft, InstallmentDraftWithPurchaseId, InstallmentPurchaseResult, PurchaseDraft (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.31
Nodes (8): createCreditCardRefund(), CreateCreditCardRefundInput, CreditCardRefundRecord, CreditCardRefundSource, ICreditCardRefundRepository, resolveFirstDueMonth(), createCreditCardRefundUseCase(), Input

### Community 43 - "Community 43"
Cohesion: 0.26
Nodes (8): POST(), VALID_PAYMENT_METHODS, VALID_SOURCES, POST(), VALID_SOURCES, POST(), parseDateUTC(), IncomeSource

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (10): buildInvestmentSummary(), CustomTooltip(), fmtFull(), fmtPct(), InvestmentOverviewCard(), MONTH_NAMES, Person, PERSON_COLORS (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (5): HEADER_COLS, ROW_COLS, ROWS, PURCHASE_CARDS, Skeleton()

### Community 46 - "Community 46"
Cohesion: 0.24
Nodes (6): formatDatePtBR(), formatDate(), Program, Props, Transfer, buildInstallmentRowView()

### Community 47 - "Community 47"
Cohesion: 0.24
Nodes (6): ClosureManagerDialog(), CreditCard, CreditCardList(), Props, CreditCardsPage(), getCards()

### Community 48 - "Community 48"
Cohesion: 0.24
Nodes (7): EMPTY_SUMMARY, getLoyaltyPrograms(), getTransfers(), LoyaltyPage(), LoyaltyProgramRecord, Summary, Transfer

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (9): Category, CreditCard, getCategories(), getCreditCards(), getMonthlyView(), getPeople(), Person, SearchParams (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (6): useCreditCardDuplicateCheck(), createInstallmentPurchase(), findDuplicateCreditCardPurchase(), resolveClosureForDate(), createInstallmentPurchaseUseCase(), Input

### Community 52 - "Community 52"
Cohesion: 0.25
Nodes (6): BANK_LABELS, Category, Props, SOURCE_BADGE, Step2Review(), CategorySource

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (4): COL_KEYS, ROWS_4, ROWS_5, SUMMARY_CARDS

### Community 55 - "Community 55"
Cohesion: 0.52
Nodes (5): Installment, InstallmentFilters, SortDir, SortKey, toDateMs()

### Community 56 - "Community 56"
Cohesion: 0.43
Nodes (5): CardInstallmentTable(), BillInstallmentItem, BillSortDir, BillSortKey, useInstallmentFilters()

### Community 57 - "Community 57"
Cohesion: 0.38
Nodes (6): BillInstallmentItem, CreditCardBillEntry, getCreditCardBillUseCase(), groupInstallmentsByCard(), groupRefundsByCard(), Input

### Community 58 - "Community 58"
Cohesion: 0.38
Nodes (6): computeTransferPreview(), formatBrl(), LoyaltyTransferForm(), Program, Props, TransferPreview

### Community 60 - "Community 60"
Cohesion: 0.4
Nodes (6): BillView(), CardHeaderRow(), formatCurrency(), formatItemsSummary(), formatMonth(), useMaskedCurrency()

### Community 61 - "Community 61"
Cohesion: 0.4
Nodes (3): Step1Data, Props, Step3Reconcile()

## Knowledge Gaps
- **403 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `PURCHASE_CARDS`, `LoyaltyProgramRecord` (+398 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TransactionRecord` connect `UI Pages & Components` to `Billing Import Pipeline`, `Application Use Cases`, `Community 43`, `Credit Card Management`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `createRepositories()` connect `Billing Import Wizard` to `API Route Handlers`, `Application Use Cases`, `Monthly View API Endpoint`, `Transaction Form UI`, `Community 43`, `Bill View Component`, `App Layout & Navigation`, `Unified Transaction Form`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `usePrivacy()` connect `Recurring Transactions` to `Credit Card Management`, `Community 37`, `Community 40`, `AI Categorization Pipeline`, `Community 44`, `Shared Form Components`, `Loyalty Program Detail`, `Category & Person Lists`, `Monthly View Summary`, `Category Breakdown Chart`, `Community 58`, `Community 60`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _403 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `UI Pages & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Application Use Cases` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._