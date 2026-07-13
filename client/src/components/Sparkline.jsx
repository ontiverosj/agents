// Minimal inline SVG sparkline of opportunity-score history.
export default function Sparkline({ points, width = 96, height = 28 }) {
  if (!points || points.length < 2) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>;

  const values = points.map((p) => p.opportunity_score);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - 3 - ((v - min) / range) * (height - 6)).toFixed(1)}`)
    .join(' ');

  const rising = values[values.length - 1] >= values[0];
  return (
    <svg width={width} height={height} aria-label={`Score trend: ${rising ? 'rising' : 'falling'}`}>
      <path d={path} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(values.length - 1) * step}
        cy={height - 3 - ((values[values.length - 1] - min) / range) * (height - 6)}
        r="2.5"
        fill="var(--series-1)"
      />
    </svg>
  );
}
