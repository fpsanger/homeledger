---
target: dashboard (src/app/dashboard/page.tsx)
total_score: 19
p0_count: 2
p1_count: 2
timestamp: 2026-07-02T21-15-43Z
slug: src-app-dashboard-page-tsx
---
## Method: dual-agent (A: a7fbed716560616b4 · B: ab6ba086d06852afe)

Target: src/app/dashboard/page.tsx + src/components/dashboard/*. Source-only review (no dev server/DB running, no live screenshot).

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | No loading state anywhere; every nav/filter action is a full blocking reload |
| 2 | Match System / Real World | 3 | Correct pt-BR/BRL vocabulary throughout |
| 3 | User Control and Freedom | 2 | Annual vs monthly time context are unsynced, no reset/link |
| 4 | Consistency and Standards | 1 | AnnualCard bypasses Card entirely; hardcoded Tailwind colors instead of tokens |
| 5 | Error Prevention | 2 | Fetch failures silently degrade to empty arrays |
| 6 | Recognition Rather Than Recall | 3 | Labels visible, no memorization required |
| 7 | Flexibility and Efficiency | 2 | Person filter lives only in TopNav, decoupled from dashboard |
| 8 | Aesthetic and Minimalist Design | 1 | 4 major sections compete equally, no focal point |
| 9 | Error Recovery | 1 | Only annual report has a fallback message; rest fail silently |
| 10 | Help and Documentation | 2 | No tooltip on ambiguous terms (e.g. "Taxa") |
| Total | | 19/40 | Poor band |

### Anti-Patterns Verdict — Partial AI slop

LLM: No gradient text, no gamification — top-level anti-refs respected. But AnnualCard.tsx reintroduces side-stripe + icon-badge card cliché as default first-seen content. Six uppercase-eyebrow instances. Chart tooltip/legend/formatter code duplicated near-verbatim across 4 files.

Detector: exit code 2, 8 findings, zero false positives.
- 5x side-tab: AnnualCard.tsx:33,38,43, MonthlySummaryCard.tsx:53,63
- 3x design-system-color: AnnualBarChart.tsx:120-122, IncomeExpenseBalanceCard.tsx:199-200 (undocumented blue hsl(215...) values)

### Priority Issues

[P0] Color system violates the One Hue Rule pervasively — IncomeExpenseBalanceCard, CategoryBreakdownChart, InvestmentOverviewCard, MonthlyExpensesCard, AnnualBarChart each invent their own palette (7-8 distinct hues). Fix: replace with emerald tints/shades + neutral grays. → /impeccable colorize

[P0] AnnualCard.tsx reintroduces banned side-stripe/icon-badge template as default first-seen content, outside the Card system, static shadow violates Flat-By-Default. → /impeccable polish

[P1] Token drift — hardcoded Tailwind palette classes (text-emerald-500, bg-green-50/bg-red-50) instead of --income/--expense tokens; breaks dark-mode parity. → /impeccable audit

[P1] Inconsistent Serif-For-Money application — only MonthlySummaryCard uses .amount-display; AnnualCard, AnnualBalanceCard, MonthlyExpensesCard totals use plain sans. → /impeccable typeset

[P2] No loading/error states — silent-empty failure masks outages as "no data"; every nav/filter is a full blocking reload. → /impeccable harden

### Persona Red Flags

Alex (power user): person identity color unstable across charts — same person gets different hue in each chart. Global person filter triggers full router.refresh(), loses scroll position.

Sam (accessibility): text-emerald-500 on white likely below WCAG AA contrast for MonthlySummaryCard; CategoryBreakdownChart tooltip hardcoded bg-zinc-900 regardless of theme.

"Ana checking her solo view" (project-specific persona): no on-page indicator of which person/combined scope is active — PageHeader is static regardless of TopNav's cookie-backed person filter. Risk for a household tool whose principle is solo/shared should "feel like the same app."

### Minor Observations

- YearNav.tsx/MonthNav.tsx near-identical, could unify.
- CustomTooltip/fmtFull/fmtCompact/MONTH_NAMES duplicated across 4 chart files.
- "Despesas por Categoria" section uses bare <h3> instead of CardTitle.

### Questions to Consider

- Was DESIGN.md written after these chart components shipped, or has the dashboard never been checked against it?
- Should there be a visible on-page indicator of active person/combined scope, given the toggle is currently invisible and cookie-based?
