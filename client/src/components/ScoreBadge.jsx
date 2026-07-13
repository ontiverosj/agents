// Opportunity score is a magnitude → sequential blue ramp, darker = stronger.
// Ordinal steps stay within the dark-surface-legible band of the reference ramp.
const STEPS = [
  { min: 70, bg: '#1c5cab' },
  { min: 55, bg: '#256abf' },
  { min: 40, bg: '#2a78d6' },
  { min: 25, bg: '#3987e5' },
  { min: 0, bg: '#5598e7' },
];

export default function ScoreBadge({ value }) {
  if (value == null) return <span className="score-badge" style={{ background: '#383835' }}>—</span>;
  const step = STEPS.find((s) => value >= s.min) || STEPS[STEPS.length - 1];
  return (
    <span className="score-badge" style={{ background: step.bg }} title={`Opportunity score: ${value.toFixed(1)} / 100`}>
      {Math.round(value)}
    </span>
  );
}
