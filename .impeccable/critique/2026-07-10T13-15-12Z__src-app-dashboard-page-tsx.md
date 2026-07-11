---
target: /dashboard page
total_score: 20
p0_count: 0
p1_count: 3
timestamp: 2026-07-10T13-15-12Z
slug: src-app-dashboard-page-tsx
---
Method: dual-agent (A: general-purpose · B: general-purpose)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good matched `loading.tsx` skeleton, but silent `[]`/`null` fallbacks (`page.tsx:20-46`) make "fetch failed" look identical to "genuinely zero" |
| 2 | Match System / Real World | 3 | Correct pt-BR/BRL formatting; "Positivo/Negativo" pill is redundant with the sign already shown |
| 3 | User Control and Freedom | 2 | Table/Chart toggle isn't URL-persisted; two independent time selectors (year vs month), no "back to today" shortcut |
| 4 | Consistency and Standards | 2 | `AnnualReportSection.tsx:52` hardcodes `text-emerald-500`/`text-rose-500` instead of the shared `.amount-positive`/`.amount-negative` classes used everywhere else |
| 5 | Error Prevention | 2 | Read-only surface (low risk), but silent fetch failures can present stale/empty data as valid |
| 6 | Recognition Rather Than Recall | 3 | Nav shows explicit month/year text, icons reinforce meaning |
| 7 | Flexibility and Efficiency | 1 | No shortcuts, no saved views, one-click-at-a-time paging only |
| 8 | Aesthetic and Minimalist Design | 2 | Calm palette, but 3 separate representations of the same income/expense/balance data (annual table, annual chart, 6-month comparison chart) inflate density |
| 9 | Error Recovery | 1 | Only one error message exists ("Falha ao carregar relatório anual."), plain text, no retry; other fetch failures are invisible |
| 10 | Help and Documentation | 1 | No onboarding/help affordances beyond hover chart tooltips |
| **Total** | | **20/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**Start here.** Does this look AI-generated?

**LLM assessment**: No single obvious tell (no gradient text, no side-stripes, no glassmorphism, no confetti — the literal bans are avoided). But the page reconstructs the banned "hero-metric SaaS dashboard template" (big number + small label + supporting chart/accent) by repetition: `AnnualCard`, `MonthlyExpensesCard`, `InvestmentOverviewCard`, `IncomeExpenseBalanceCard`, and `MonthlySummaryCard` all share the identical eyebrow → big tabular number → chart scaffold, stamped 8 times down one page. A user fluent in Linear/Stripe-quality tools would feel the "everything is a stat tile" sameness even without naming the pattern.

**Deterministic scan**: `detect.mjs --json` against `src/app/dashboard/page.tsx` + `src/components/dashboard/` (1514 lines, 12 files) returned **zero findings**, exit code 0. This is expected, not reassuring — the detector pattern-matches literal bans (gradient-text, side-stripes, etc.), and this page's slop is structural/compositional repetition across separate files, which is exactly the kind of thing a per-file rule scanner cannot see. No false positives to report since there were no findings.

**Visual overlays**: Not run this pass — Assessment B used a standalone screenshot script (no project-local browser tooling), not the live-server + detect.js injection flow, so no in-browser overlay is present in a `[Human]` tab. Evidence below is from direct screenshots instead.

## Overall Impression

The page is clean, on-brand (single emerald hue holds, pt-BR formatting is correct, no literal anti-pattern violations), and the detector is happy — but it over-delivers the same shape of information three times (table, annual chart, 6-month comparison chart) and under-delivers hierarchy: every one of 8 cards competes at the same visual weight, so nothing tells a household member which number to look at first for a "quick check-in." The single biggest opportunity is picking one canonical hero number and demoting the rest, which would fix the AI-slop repetition, the cognitive load score, and the emotional flatness in one move.

## What's Working

- **`lib/dashboardColors.ts`** genuinely enforces the one-hue rule — per-person breakdowns vary lightness within income/expense hues rather than inventing new colors, and the constraint is documented inline.
- **`loading.tsx`** mirrors the real layout precisely (matched skeleton shapes per card) — good perceived performance, no layout shift.
- **Sign+color discipline** — income/expense is consistently conveyed via `.amount-positive`/`.amount-negative` plus explicit sign, not color alone, satisfying the PRODUCT.md accessibility rule (mostly — see P2 below for one place this slips).

## Priority Issues

**[P1] Negative balance value wraps ugly on mobile**
- **Why it matters**: Browser-confirmed at 390×844 — in "Resumo do Mês," the negative balance's leading "-" renders alone on its own line above "R$ 8.657,56," with the "Negativo" pill pushed to a separate line. This directly undercuts DESIGN.md's core rule that money must be "the most legible thing on any screen" — the one piece of information a household member is checking is the one that visually breaks.
- **Fix**: `src/components/dashboard/MonthlySummaryCard.tsx` (the balance `<p>`, roughly lines 33-39) sits in a `flex items-center justify-between` row competing with the badge for width, with no `whitespace-nowrap`/`shrink-0` on the amount. Add `whitespace-nowrap` to the amount, and let the row wrap the badge below instead, or drop to a smaller type size at narrow breakpoints before it wraps mid-number.
- **Suggested command**: `/impeccable adapt`

**[P1] Repeated hero-metric scaffold, 8 times over**
- **Why it matters**: `AnnualCard`, `MonthlyExpensesCard`, `InvestmentOverviewCard`, `IncomeExpenseBalanceCard`, and `MonthlySummaryCard` all share the same eyebrow-label → big tabular number → chart shape (3× in `AnnualReportCards`'s grid, 3× in `page.tsx:106`'s grid, 2× inside `MonthlySummaryCard`). This is the named "hero-metric template" anti-pattern smuggled in through repetition instead of one obvious instance — it's exactly the kind of thing the deterministic scanner returned clean on and only a holistic read catches.
- **Fix**: Pick one canonical summary (likely `MonthlySummaryCard`, since it's the "quick glance" answer) and give it real visual dominance; demote the other 7 to compact inline rows or sparklines rather than full stat-tile treatment.
- **Suggested command**: `/impeccable distill`

**[P1] Five of eight chart cards are invisible to screen readers**
- **Why it matters**: `CategoryBreakdownChart`, `AnnualBalanceChart`, `MonthlyExpensesCard`, `InvestmentOverviewCard`, and `IncomeExpenseBalanceCard` are Recharts SVG with no `aria-label` or table fallback. A screen-reader user gets nothing from 5 of the page's 8 cards on a private household tool meant for every family member, not just sighted ones.
- **Fix**: Add a visually-hidden summary sentence or a `<table>` fallback per chart (e.g. "Despesas de Março: R$X, 12% acima da média").
- **Suggested command**: `/impeccable harden`

**[P2] Design-token discipline breaks in one spot**
- **Why it matters**: `AnnualReportSection.tsx:52` hardcodes `text-emerald-500`/`text-rose-500` instead of the shared `.amount-positive`/`.amount-negative` classes used everywhere else on the page — the one-hue system is otherwise clean, so this is a real (if small) crack, and `--income` (`globals.css:24`) has no `.dark` override the way `--primary` does, worth a contrast check in dark mode.
- **Fix**: Swap the hardcoded Tailwind color utilities for the shared amount classes; add a dark-mode `--income` shade if the contrast check comes back weak.
- **Suggested command**: `/impeccable audit`

**[P2] Two time selectors can silently disagree**
- **Why it matters**: `YearNav` (annual section) and `MonthNav` (monthly section) page independently with no visible link between them — a household member can be looking at "2025" in one card and "March 2026" in another without any cue they're scoped differently. Adds working-memory load exactly where a "quick check-in" tool should minimize it.
- **Fix**: Either sync the two scopes or visually separate them more clearly (e.g. distinct section framing) so it reads as two intentionally different lenses, not a bug.
- **Suggested command**: `/impeccable layout`

## Persona Red Flags

**Jordan (First-Timer)**: Two independent date pickers (`YearNav` + `MonthNav`) with no explanation of what each scopes; `AnnualCard`'s 12-row mini-table is a wall of numbers with no plain-language summary sentence above it. Will hesitate, unsure which number is "the" answer.

**Sam (Accessibility-Dependent)**: 5 of 8 charts are screen-reader-invisible (see P1 above). Nav arrows in `YearNav` are sized under the 44×44pt touch-target minimum — a problem for motor-impairment users as much as for Casey below.

**Casey (Distracted Mobile User)**: The confirmed balance-wrap bug (P1) hits exactly this persona's context — glancing at the phone one-handed, the one number that matters visually breaks. Full stack of 8 chart cards means what should be a 10-second glance becomes a long single-column scroll.

## Minor Observations

- Decorative body radial gradients (`globals.css:58-60`) sit oddly against the "flat-by-default, calm" brief — worth a second look during a `polish` pass, though not a named ban.
- "Positivo/Negativo" pill duplicates information already carried by the sign on the number itself.
- `MonthlyTabsCard.tsx` and `AnnualBarChart.tsx` exist in `components/dashboard/` but aren't referenced by the current render tree — dead code, candidate for removal.
- Toggle state (table/chart view in `AnnualReportSection`) has no `aria-pressed` and resets on reload.

## Questions to Consider

- If every card is a hero-metric tile, which single number should a household glance at first — and why isn't it visually distinguished from the other seven?
- Do you need three representations (table, annual chart, 6-month comparison chart) of the same income/expense/balance data on one page?
- Is this dashboard meant for every household member, or only the sighted, desktop-using ones — given 5 charts are currently invisible to screen readers?
