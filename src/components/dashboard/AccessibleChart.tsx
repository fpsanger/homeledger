type Props = {
  summary: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Recharts renders plain SVG with no semantic content, so screen readers get
 * nothing. This pairs the visual chart (hidden from assistive tech) with a
 * `sr-only` list carrying the same data points, so both audiences get the
 * same information.
 */
export function AccessibleChart({ summary, children }: Props) {
  return (
    <div>
      <ul className="sr-only">{summary}</ul>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
