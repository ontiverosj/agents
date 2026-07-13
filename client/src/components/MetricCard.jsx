export default function MetricCard({ label, value, hint, estimate = false }) {
  return (
    <div className="card metric-card">
      <div className="label">
        {label}
        {estimate && (
          <span
            className="estimate-tag"
            title="Estimated from public engagement signals (comments, shares, saves per view). TikTok does not expose real watch time for other creators' videos."
          >
            est.
          </span>
        )}
      </div>
      <div className="value">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
