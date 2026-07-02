// Chart color ramps for dashboard data viz.
// Per DESIGN.md's One Hue Rule: emerald (income, hue 158) and expense red (hue 0) are
// the only saturated hues in the system. Per-person breakdowns vary lightness/chroma
// within those two hues instead of introducing new colors, and a person's index maps
// to the same shade across every chart so their color reads consistently everywhere.

export const INCOME_PERSON_SHADES = [
  "hsl(158 72% 22%)",
  "hsl(158 65% 34%)",
  "hsl(158 55% 46%)",
  "hsl(158 45% 60%)",
];

export const EXPENSE_PERSON_SHADES = [
  "hsl(0 84% 46%)",
  "hsl(0 78% 56%)",
  "hsl(0 70% 66%)",
  "hsl(0 60% 76%)",
];

// Category-ranking bars: categories here are always expense breakdowns, so the ramp
// stays in the expense-red family (dark = largest share, light = smallest).
export const CATEGORY_SHADES = [
  "hsl(0 70% 30%)",
  "hsl(0 68% 36%)",
  "hsl(0 66% 42%)",
  "hsl(0 64% 48%)",
  "hsl(0 62% 54%)",
  "hsl(0 58% 60%)",
  "hsl(0 54% 66%)",
  "hsl(0 48% 74%)",
];

// Net balance/saldo line: neither income nor expense, so it stays neutral rather than
// introducing a third saturated hue.
export const BALANCE_LINE_COLOR = "hsl(var(--foreground))";

export function personShade(shades: string[], index: number): string {
  return shades[index % shades.length];
}
