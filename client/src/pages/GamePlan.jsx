import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmt } from '../api.js';

export default function GamePlan() {
  const { id } = useParams();
  const [niche, setNiche] = useState(null);
  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [noPlanYet, setNoPlanYet] = useState(false);

  const load = useCallback(async () => {
    const n = await api.getNiche(id).catch((e) => { setError(e.message); return null; });
    setNiche(n);
    try {
      setPlan(await api.latestPlan(id));
      setNoPlanYet(false);
    } catch {
      setNoPlanYet(true);
    }
    setHistory(await api.listPlans(id).catch(() => []));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      setPlan(await api.generatePlan(id));
      setNoPlanYet(false);
      setHistory(await api.listPlans(id).catch(() => []));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const showVersion = async (planId) => {
    if (!planId) return;
    setPlan(await api.getPlan(planId).catch(() => plan));
  };

  if (!niche) return <div className="loading">Loading…</div>;
  const p = plan?.plan;

  return (
    <div>
      <div className="row between" style={{ marginBottom: 4 }}>
        <h1 style={{ margin: 0 }}>Game plan — {niche.name}</h1>
        <div className="row">
          {history.length > 1 && (
            <select
              value={plan?.id || ''}
              onChange={(e) => showVersion(e.target.value)}
              style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px' }}
            >
              {history.map((h) => (
                <option key={h.id} value={h.id}>
                  {fmt.date(h.generatedAt)} ({h.generator})
                </option>
              ))}
            </select>
          )}
          <button className="btn primary" onClick={generate} disabled={busy}>
            {busy ? 'Generating…' : plan ? '↻ Regenerate' : 'Generate game plan'}
          </button>
        </div>
      </div>
      <p className="subtitle">
        <Link to={`/niche/${id}`}>← Back to {niche.name}</Link>
        {plan && (
          <>
            {' · '}
            <span className={`gen-badge ${plan.generator === 'claude' ? 'claude' : ''}`}>
              {plan.generator === 'claude' ? `AI (${plan.model})` : 'template'}
            </span>
            {' · '}generated {fmt.date(plan.generatedAt)}
          </>
        )}
      </p>
      {error && <div className="error-banner">{error}</div>}

      {noPlanYet && !plan && (
        <div className="card empty">
          <p>No game plan yet. Generate one from this niche's tracked videos and stats.</p>
          <button className="btn primary" onClick={generate} disabled={busy}>
            {busy ? 'Generating…' : 'Generate game plan'}
          </button>
        </div>
      )}

      {p && (
        <>
          <div className="grid cols-2 plan-section">
            <div className="card">
              <h2>Niche summary</h2>
              <p style={{ margin: 0, color: 'var(--ink-2)' }}>{p.nicheSummary}</p>
            </div>
            <div className="card">
              <h2>Positioning</h2>
              <p style={{ margin: 0, color: 'var(--ink-2)' }}>{p.positioning}</p>
            </div>
          </div>

          <div className="card plan-section">
            <h2>Hooks to test</h2>
            {p.hooks.map((h, i) => (
              <div className="hook-item" key={i}>
                <div>“{h.text}”</div>
                <div className="why">{h.why}</div>
              </div>
            ))}
          </div>

          <div className="card plan-section">
            <h2>Formats</h2>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(3, p.formats.length)}, 1fr)` }}>
              {p.formats.map((f, i) => (
                <div className="format-card" key={i}>
                  <strong>{f.name}</strong>
                  <div style={{ color: 'var(--ink-2)', fontSize: 13, margin: '4px 0' }}>{f.description}</div>
                  <div className="chip">{f.targetDuration}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card plan-section">
            <div className="row between">
              <h2>Weekly schedule</h2>
              <span style={{ color: 'var(--ink-2)', fontSize: 13 }}>
                {p.postingSchedule.cadence} · best times: {p.postingSchedule.bestTimes.join(', ')}
              </span>
            </div>
            <div className="week-grid">
              {p.postingSchedule.weeklyPlan.map((d, i) => (
                <div className="week-day" key={i}>
                  <div className="day">{d.day}</div>
                  <div className="fmt">{d.format}</div>
                  <div>{d.idea}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card plan-section">
            <h2>Hashtag strategy</h2>
            {[['Primary', p.hashtagStrategy.primary, 'primary'], ['Secondary', p.hashtagStrategy.secondary, ''], ['Broad reach', p.hashtagStrategy.broad, '']].map(
              ([label, tags, cls]) => (
                <div key={label} className="row" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
                  <span style={{ width: 90, color: 'var(--muted)', fontSize: 12, paddingTop: 4 }}>{label}</span>
                  <div className="chips">
                    {(tags || []).map((t) => (
                      <span key={t} className={`chip ${cls}`}>#{String(t).replace(/^#/, '')}</span>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="card plan-section">
            <h2>Video outlines</h2>
            {p.videoOutlines.map((o, i) => (
              <div className="outline" key={i}>
                <strong>{o.title}</strong>
                <div style={{ color: 'var(--series-1)', fontSize: 13, marginTop: 4 }}>Hook: “{o.hook}”</div>
                <ul className="beats">
                  {o.beats.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
                <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>CTA: {o.cta}</div>
              </div>
            ))}
          </div>

          <div className="card plan-section">
            <h2>KPIs to watch</h2>
            <table>
              <thead>
                <tr><th>Metric</th><th>Target</th><th>Timeframe</th></tr>
              </thead>
              <tbody>
                {p.kpis.map((k, i) => (
                  <tr key={i}>
                    <td>{k.metric}</td>
                    <td>{k.target}</td>
                    <td style={{ color: 'var(--ink-2)' }}>{k.timeframe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
