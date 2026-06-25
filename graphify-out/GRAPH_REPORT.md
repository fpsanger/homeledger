# Graph Report - homeledger  (2026-06-15)

## Corpus Check
- 247 files · ~56,198 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1094 nodes · 2492 edges · 50 communities (46 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7188b57b`
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
- [[_COMMUNITY_Community 49|Community 49]]

## God Nodes (most connected - your core abstractions)
1. `createRepositories()` - 65 edges
2. `errorResponse()` - 63 edges
3. `cn()` - 32 edges
4. `PrismaCreditCardPurchaseRepository` - 26 edges
5. `Button` - 24 edges
6. `DELETE()` - 20 edges
7. `Input` - 18 edges
8. `Select` - 17 edges
9. `TransactionRecord` - 16 edges
10. `PUT()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `PUT()` --calls--> `updateCreditCardUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateCreditCardUseCase.ts
- `PUT()` --calls--> `updateLoyaltyProgramUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/loyalty/UpdateLoyaltyProgramUseCase.ts
- `DELETE()` --calls--> `deleteLoyaltyProgramUseCase()`  [INFERRED]
  app/api/recurring-transactions/[id]/route.ts → application/use-cases/loyalty/DeleteLoyaltyProgramUseCase.ts
- `POST()` --calls--> `createCreditCardUseCase()`  [EXTRACTED]
  app/api/credit-cards/route.ts → application/use-cases/CreateCreditCardUseCase.ts
- `PUT()` --calls--> `updateExpenseUseCase()`  [INFERRED]
  app/api/incomes/[id]/route.ts → application/use-cases/UpdateExpenseUseCase.ts

## Communities (50 total, 4 thin omitted)

### Community 0 - "API Route Handlers"
Cohesion: 0.05
Nodes (46): createCategory(), CreateCategoryInput, createExpense(), CreateExpenseInput, createIncome(), CreateIncomeInput, createInvestment(), CreateInvestmentInput (+38 more)

### Community 1 - "UI Pages & Components"
Cohesion: 0.07
Nodes (52): InvalidBillingItemError, BillingItem, createInstallmentBillingItem(), CreateInstallmentInput, createTransactionBillingItem(), CreateTransactionInput, TransactionBillingItem, isCSVFile() (+44 more)

### Community 2 - "Application Use Cases"
Cohesion: 0.05
Nodes (23): useCreditCardDuplicateCheck(), CreditCardPurchaseRecord, CreditCardPurchaseWithInstallments, ICreditCardPurchaseRepository, InstallmentRecord, PrismaCreditCardPurchaseRepository, purchaseToRecord(), cancelInstallmentPurchase() (+15 more)

### Community 3 - "Billing Import Pipeline"
Cohesion: 0.06
Nodes (35): LoyaltyPageClient(), Program, Props, Transfer, LoyaltyProgramCreateDialog(), Props, LoyaltyProgramForm(), PRESET_COLORS (+27 more)

### Community 4 - "Category & Transaction Domain"
Cohesion: 0.09
Nodes (22): DELETE(), POST(), ClosureType, createCreditCard(), CreateCreditCardInput, CreditCardClosureRecord, CreditCardRecord, ICreditCardRepository (+14 more)

### Community 5 - "Credit Card Management"
Cohesion: 0.07
Nodes (28): BillingImportWizard(), ImportSummary, Step1Data, STEPS, WizardStep, BANK_LABELS, BANK_OPTIONS, CreditCard (+20 more)

### Community 6 - "Billing Import Wizard"
Cohesion: 0.08
Nodes (25): IRecurringTransactionRepository, RecurringTransactionRecord, UpdateableFields, PrismaRecurringTransactionRepository, toRecord(), buildMonthlyView(), MonthlyViewInput, MonthlyViewResult (+17 more)

### Community 7 - "Recurring Transactions"
Cohesion: 0.12
Nodes (26): GET(), GET(), POST(), POST(), GET(), POST(), GET(), GET() (+18 more)

### Community 8 - "Transaction Form UI"
Cohesion: 0.1
Nodes (18): CategorizationPipeline, MerchantHistoryCategorizer, upsertMerchantHistory(), findCategoryByKeywords(), MerchantRule, MerchantRuleCategorizer, normalizeText(), RULES (+10 more)

### Community 9 - "AI Categorization Pipeline"
Cohesion: 0.14
Nodes (16): DuplicateCategoryError, NotFoundError, DELETE(), PATCH(), PaymentMethod, PUT(), VALID_PAYMENT_METHODS, deleteLoyaltyTransactionUseCase() (+8 more)

### Community 10 - "Annual Report Charts"
Cohesion: 0.12
Nodes (19): Category, Props, Closure, ClosureManagerDialog(), MONTH_NAMES, CreditCard, CreditCardForm(), Props (+11 more)

### Community 11 - "Credit Card Purchase Repository"
Cohesion: 0.11
Nodes (22): useCrossEntityDuplicateCheck(), useDuplicateCheck(), parseCurrencyBR(), Category, ExpenseForm(), PAYMENT_METHODS, Person, IncomeForm() (+14 more)

### Community 12 - "Credit Card UI"
Cohesion: 0.1
Nodes (16): EXPENSE_COLORS, INCOME_COLORS, IncomeExpenseBalanceCard(), MONTH_NAMES, Person, Props, TooltipEntry, TooltipPayloadEntry (+8 more)

### Community 13 - "Shared Form Components"
Cohesion: 0.11
Nodes (20): formatAmount(), Installment, MonthlySummaryCard(), Props, Transaction, Category, DashboardPage(), getAnnualReport() (+12 more)

### Community 14 - "Expense & Income Forms"
Cohesion: 0.11
Nodes (19): formatAmountBR(), CreditCard, EditInstallmentForm(), fmtCurrency(), fmtDate(), Installment, MONTH_ABBR, Person (+11 more)

### Community 15 - "Loyalty Program Detail"
Cohesion: 0.12
Nodes (18): Category, Props, Category, INCOME_SOURCES, Person, Category, InvestmentForm(), Person (+10 more)

### Community 16 - "Monthly Transaction Table"
Cohesion: 0.14
Nodes (17): AnnualBalanceCard(), AnnualBalanceChart(), ChartProps, CustomTooltip(), fmtFull(), fmtSigned(), MONTH_NAMES, Props (+9 more)

### Community 17 - "Bill View Component"
Cohesion: 0.17
Nodes (14): createLoyaltyProgram(), CreateLoyaltyProgramInput, LoyaltyProgramRecord, LoyaltyProgramType, createLoyaltyProgramUseCase(), Input, deleteLoyaltyProgramUseCase(), listLoyaltyProgramsUseCase() (+6 more)

### Community 18 - "App Layout & Navigation"
Cohesion: 0.15
Nodes (11): createLoyaltyTransfer(), CreateLoyaltyTransferInput, LoyaltyTransferRecord, createLoyaltyTransferUseCase(), Input, listLoyaltyTransfersUseCase(), ILoyaltyTransferRepository, PrismaLoyaltyTransferRepository (+3 more)

### Community 19 - "Category & Person Lists"
Cohesion: 0.12
Nodes (15): BillEntry, BillInstallmentItem, BillSortDir, BillSortKey, BillView(), BillViewProps, Category, CreditCardFull (+7 more)

### Community 20 - "Monthly View Summary"
Cohesion: 0.18
Nodes (14): createLoyaltyTransaction(), CreateLoyaltyTransactionInput, LoyaltyTransactionRecord, LoyaltyTransactionType, TRANSFER_TYPES, createLoyaltyTransactionUseCase(), Input, TRANSFER_TYPES (+6 more)

### Community 21 - "Installments List"
Cohesion: 0.17
Nodes (16): Category, CategoryCreateDialog(), Props, CategoryEditDialog(), CategoryForm(), Category, CategoryList(), ViewMode (+8 more)

### Community 22 - "Installments Page"
Cohesion: 0.18
Nodes (9): createPerson(), GET(), POST(), IPersonRepository, PersonRecord, PrismaPersonRepository, createPersonUseCase(), Input (+1 more)

### Community 23 - "Loyalty Transfer Table"
Cohesion: 0.15
Nodes (12): dmSerifDisplay, geistMono, geistSans, metadata, Theme, ThemeContext, ThemeProvider(), useTheme() (+4 more)

### Community 24 - "Unified Transaction Form"
Cohesion: 0.12
Nodes (13): Category, fmtCurrency(), MONTH_ABBR, PAYMENT_LABELS, Person, SortDir, SortKey, Transaction (+5 more)

### Community 25 - "Category Breakdown Chart"
Cohesion: 0.12
Nodes (14): EDITABLE_TYPES, FifoData, formatBrl(), formatPts(), LoyaltyProgramDetail(), Program, Props, SortDir (+6 more)

### Community 26 - "Transaction Repository"
Cohesion: 0.13
Nodes (11): CreditCardItem, fmt(), Installment, InstallmentFilters, InstallmentTable(), Person, SortDir, SortKey (+3 more)

### Community 27 - "Loading Skeletons"
Cohesion: 0.18
Nodes (13): CategoriesPage(), CategoryRecord, getCategories(), getPeople(), PeoplePage(), PersonRecord, PersonForm(), CardContent (+5 more)

### Community 28 - "Monthly View Page"
Cohesion: 0.26
Nodes (12): cn(), ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), DatePickerProps, Popover(), PopoverContent() (+4 more)

### Community 29 - "Edit Installment Form"
Cohesion: 0.13
Nodes (11): Category, CreditCard, EditState, Installment, MONTH_NAMES, Person, Props, Purchase (+3 more)

### Community 30 - "Category Create Dialog"
Cohesion: 0.13
Nodes (10): AnnualBarChart(), MONTH_NAMES, Props, TooltipEntry, AnnualCard(), FIELD_CONFIG, formatAmount(), MONTH_NAMES (+2 more)

### Community 31 - "Loyalty Program List"
Cohesion: 0.21
Nodes (12): CategoryLike, getFullPath(), Category, CategoryCombobox(), CategoryComboboxProps, Command, CommandEmpty, CommandGroup (+4 more)

### Community 32 - "Category Edit Dialog"
Cohesion: 0.22
Nodes (11): InstallmentsList(), InstallmentsTabs(), Props, Tab, getCategories(), getCreditCards(), getPeople(), getPurchases() (+3 more)

### Community 33 - "Home Page"
Cohesion: 0.21
Nodes (9): CustomTooltip(), fmtFull(), fmtPct(), InvestmentOverviewCard(), MONTH_NAMES, Person, PERSON_COLORS, Props (+1 more)

### Community 34 - "Monthly View Route"
Cohesion: 0.26
Nodes (9): getLoyaltyProgramReportUseCase(), GET(), computeLoyaltyFifo(), consumeLots(), CostLot, EnrichedTransaction, FifoData, LoyaltyFifoResult (+1 more)

### Community 35 - "Description Normalizer"
Cohesion: 0.27
Nodes (7): POST(), VALID_PAYMENT_METHODS, VALID_SOURCES, POST(), VALID_SOURCES, POST(), parseDateUTC()

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (8): CustomTooltip(), fmtFull(), MONTH_NAMES, MonthlyExpensesCard(), Person, PERSON_COLORS, Props, TooltipPayloadEntry

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (7): formatDatePtBR(), formatDate(), formatDate(), Program, Props, Transfer, fmtDate()

### Community 39 - "Community 39"
Cohesion: 0.24
Nodes (9): BackButton(), EnrichedTransaction, FifoData, getProgram(), getReport(), LoyaltyProgramPage(), Program, Report (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.2
Nodes (10): BAR_COLORS, Category, CategoryBreakdownChart(), COLORS, CustomTooltip(), fmt(), Installment, Props (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (9): Category, CreditCard, getCategories(), getCreditCards(), getMonthlyView(), getPeople(), Person, SearchParams (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (3): CreditCardList(), CreditCardsPage(), getCards()

### Community 45 - "Community 45"
Cohesion: 0.5
Nodes (3): DropdownItem, DropdownMenu(), DropdownMenuProps

## Knowledge Gaps
- **319 isolated node(s):** `geistSans`, `geistMono`, `dmSerifDisplay`, `metadata`, `LoyaltyProgramRecord` (+314 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `TransactionRecord` connect `API Route Handlers` to `Monthly Transaction Table`, `Description Normalizer`, `Billing Import Wizard`, `Recurring Transactions`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `PrismaCreditCardPurchaseRepository` connect `Application Use Cases` to `AI Categorization Pipeline`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `cn()` connect `Monthly View Page` to `Monthly View API Endpoint`, `Annual Report Charts`, `Credit Card UI`, `Community 45`, `Loyalty Program Detail`, `Installments List`, `Loading Skeletons`, `Edit Installment Form`, `Loyalty Program List`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `dmSerifDisplay` to the rest of the system?**
  _319 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `UI Pages & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Application Use Cases` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._