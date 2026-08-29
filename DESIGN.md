---
name: HomeLedger
description: Calm, precise household finance tracker for a single family.
colors:
  primary: "#0b6544"
  primary-dark: "#29a376"
  background: "#f6f9f7"
  background-dark: "#0f131a"
  card: "#ffffff"
  card-dark: "#151b23"
  foreground: "#151d28"
  foreground-dark: "#f5f5f5"
  secondary: "#edeff3"
  muted-foreground: "#627084"
  accent: "#cdf4e6"
  accent-foreground: "#084932"
  accent-dark: "#1c4033"
  border: "#d7dde4"
  ring: "#147b55"
  destructive: "#ef4444"
  income: "#147b55"
  expense: "#ef4343"
typography:
  display:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.5rem–2.25rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.875rem–1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
  mono:
    fontFamily: "Geist Mono, monospace"
rounded:
  sm: "calc(0.5rem - 4px)"
  md: "calc(0.5rem - 2px)"
  lg: "0.5rem"
  xl: "0.75rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#fafafa"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.75rem"
    height: "2.25rem"
---

# Design System: HomeLedger

## 1. Overview

**Creative North Star: "The Ledger's Calm"**

HomeLedger reads like a well-kept household ledger: quiet, precise, and legible at a glance. The palette is a single deep emerald green (#0b6544) carried through primary actions, income figures, and focus states, set against a near-white sage background with soft, barely-there radial gradients that keep the surface from feeling clinical. Numbers get the spotlight — amounts are set in semibold Geist Sans with tight tracking and tabular numerals, so the eye lands on money first and controls second without a second typeface competing for attention.

This is a private household tool, not a product being sold. It explicitly rejects hero-metric SaaS dashboard clichés, gradient text, confetti or celebratory gamification around spending, and any visual noise that competes with the numbers. Motion is present but restrained: micro-interactions (button press scale, row hover, card lift) confirm interaction without ever choreographing attention away from the data.

**Key Characteristics:**
- Single-hue emerald system: one green (#0b6544 light / #29a376 dark) carries primary, ring, and income meaning
- One typeface, Geist, throughout — money figures step up to semibold weight and tight tracking rather than switching to a second face
- Flat cards with barely-visible borders and shadow-sm, lifting only on hover
- Full light/dark theme parity via HSL CSS custom properties
- Income/expense color-coded but never color-only (see Do's and Don'ts)

## 2. Colors

A single-hue committed palette: one emerald green does double duty as brand primary and "money is fine" signal, kept to a small footprint against a quiet sage-tinted neutral base.

### Primary
- **Ledger Green** (#0b6544 light / #29a376 dark): primary buttons, links, focus rings, active nav state, and the semantic "income" color. Used deliberately, not washed across large surfaces.

### Neutral
- **Sage Mist** (#f6f9f7): app background, layered with two soft radial gradients (emerald top-left, cool gray bottom-right) at low opacity — never a flat, dead surface.
- **Paper White** (#ffffff): card and surface background in light mode.
- **Ink** (#151d28): primary text color, light mode.
- **Slate Mist** (#627084): muted/secondary text — captions, helper text, table secondary columns.
- **Hairline** (#d7dde4): borders, dividers, input strokes.
- **Deep Slate** (#0f131a / card #151b23): background/card surfaces in dark mode, paired with #f5f5f5 foreground text.

### Semantic
- **Income Green** (#147b55): positive amounts (`.amount-positive`).
- **Expense Red** (#ef4343): negative amounts (`.amount-negative`), also destructive actions (#ef4444).
- **Mint Accent** (#cdf4e6 light / #1c4033 dark): selected/active chip and highlight backgrounds, paired with a deep-green foreground (#084932) for contrast.

### Named Rules
**The One Hue Rule.** Emerald is the only saturated color in the system. It marks primary action, focus, and income — nothing else earns saturated color. Red is reserved strictly for expenses and destructive/error states.

## 3. Typography

**Display Font:** Geist Sans (with system-ui fallback)
**Body Font:** Geist Sans (with system-ui fallback)
**Label/Mono Font:** Geist Mono

**Character:** One rounded, humanist sans throughout. Money figures don't switch typeface — they step up in weight (semibold) and tighten tracking, which reads as confident and rounded without a serif competing for the reader's attention.

### Hierarchy
- **Display / Amount** (600, 1.5rem–2.25rem, tight line-height, -0.02em tracking, tabular numerals): large monetary figures — dashboard totals, monthly summary cards.
- **Title** (600, 1rem–1.125rem, tight tracking): card titles, section headers (`CardTitle`).
- **Body** (400, 0.875rem–1rem, 1.5 line-height): table cells, descriptions, form labels. Cap prose at 65–75ch where it appears.
- **Label** (500, 0.75rem): form field labels, badges, table headers.
- **Tabular numerals**: `font-feature-settings: "tnum" 1` is set globally on `body` — all numeric columns align on a fixed grid. Never disable this for money.

### Named Rules
**The Weight-For-Money Rule.** Monetary amounts are marked by semibold weight + tight tracking + tabular numerals (`font-semibold tracking-tight tabular-nums`), never by a second typeface. One face, one voice — money is louder, not different.

## 4. Elevation

Flat by default, soft on interaction. Cards sit nearly flush with the background (`shadow-sm shadow-black/[0.04]` in light mode, no shadow at all in dark mode — depth there comes from the border and the lighter card fill against the deep slate background). Depth appears only as a response to state: `.card-hover` lifts 1px and gains a soft ambient shadow on hover; buttons scale down 3% on press.

### Shadow Vocabulary
- **Card rest** (`shadow-sm` + `shadow-black/[0.04]`, light only): barely-there separation from background.
- **Card hover** (`box-shadow: 0 4px 16px rgba(0,0,0,0.08)` + `translateY(-1px)`): the only elevated state in the system.

### Named Rules
**The Flat-By-Default Rule.** Nothing floats at rest. Shadows exist solely as hover/interaction feedback, never as a static decorative layer.

## 5. Components

### Buttons
- **Shape:** rounded-md (6px, `calc(var(--radius) - 2px)`)
- **Primary:** Ledger Green background, `#fafafa` text, `h-9 px-4 py-2` default size; `hover:bg-primary/90`
- **Secondary:** Sage-neutral background (#edeff3), ink text, `hover:bg-secondary/80`
- **Outline / Ghost:** transparent or bordered, fill with accent mint on hover
- **Hover / Focus:** color-only hover states (no shadow lift); `focus-visible:ring-2 ring-ring` (emerald ring); active press scales to 97%

### Cards / Containers
- **Corner Style:** rounded-xl (12px)
- **Background:** Paper White (light) / Deep Card Slate (dark)
- **Shadow Strategy:** see Elevation — flat at rest, soft lift on `.card-hover`
- **Border:** 1px hairline, `black/[0.06]` light / `white/[0.08]` dark — nearly invisible, present for definition not decoration
- **Internal Padding:** 1.5rem (`p-6`) header/content blocks

### Inputs / Fields
- **Style:** transparent background, 1px hairline border, rounded-md, `h-9`, `px-3 py-1`
- **Focus:** `ring-1 ring-ring` (emerald), no border color shift
- **Disabled:** 50% opacity, pointer-events none
- **Currency input:** monetary fields use tabular numerals to stay aligned in tables

### Tables (signature component)
- Row hover uses a fast (0.1s) `bg-muted/50` fill, no shadow — built for scanning transaction lists quickly, not for card-like emphasis.

### Navigation
- Top nav (`TopNav`), sticky, uses primary green for active-state text/icon, sans body font throughout.

## 6. Do's and Don'ts

### Do:
- **Do** set every monetary amount in semibold Geist with tight tracking and tabular numerals — this is the one typographic signal that a number is money.
- **Do** keep emerald green as the only saturated color; income, primary actions, and focus rings all share it deliberately.
- **Do** pair every income/expense color cue with a sign (+/-) or icon — color alone must never carry the meaning (WCAG AA, PRODUCT.md accessibility requirement).
- **Do** keep cards and surfaces flat at rest; reserve shadow and lift for hover/interaction only.
- **Do** respect `prefers-reduced-motion` for all transitions (button press, card hover, row hover).

### Don't:
- **Don't** use hero-metric SaaS dashboard patterns (giant stat + small label + gradient accent) — PRODUCT.md names this explicitly as an anti-reference.
- **Don't** use gradient text (`background-clip: text`) anywhere — PRODUCT.md anti-reference.
- **Don't** add confetti, celebration animations, or gamified feedback around spending or saving — this is a sober finance tool, not a rewards app.
- **Don't** introduce a second saturated accent color; expand the emerald family (tints/shades) instead of adding new hues.
- **Don't** introduce a second typeface for money or anything else — one sans family, varied by weight, is the whole system.
- **Don't** apply shadow or elevation to a card that isn't hovered/active — flat is the resting state.
