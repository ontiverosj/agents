import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { api, fmt } from '../api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';
import MetricCard from '../components/MetricCard.jsx';
import VideoTable from '../components/VideoTable.jsx';

const AXIS = { stroke: '#383835', tick: { fill: '#898781', fontSize: 11 } };

function ChartTooltip({ active, payload, label, format = fmt.num }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="t">{fmt.date(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey}>
          {p.name}: <strong>{format(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function NicheDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [niche, setNiche] = useState(null);
  const [series, setSeries] = useState(null);
  const [videos, setVideos] = useState([]);
  const [sort, setSort] = useState('views');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [n, ts, vids] = await Promise.all([api.getNiche(id), api.timeseries(id), api.videos(id, sort)]);
      setNiche(n);
      setSeries(ts);
      setVideos(vids);
    } catch (e) {
      setError(e.message);
    }
  }, [id, sort]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.refreshNiche(id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!window.confirm(`Stop tracking "${niche.name}"?`)) return;
    await api.archiveNiche(id);
    navigate('/');
  };

  if (error && !niche) return <div className="error-banner">{error}</div>;
  if (!niche) return <div className="loading">Loading…</div>;

  const s = niche.latestScore;
  const totals = (series?.totals || []).map((r) => ({ ...r, t: r.t }));
  const scores = series?.scores || [];

  return (
    <div>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div className="row">
          <ScoreBadge value={s?.opportunity_score} />
          <h1 style={{ margin: 0 }}>{niche.name}</h1>
        </div>
        <div className="row">
          <button className="btn" onClick={refresh} disabled={busy}>{busy ? 'Refreshing…' : '↻ Refresh'}</button>
          <Link to={`/niche/${id}/plan`} className="btn primary">Game plan →</Link>
          <button className="btn danger" onClick={archive}>Archive</button>
        </div>
      </div>
      <p className="subtitle">
        {niche.hashtags.map((t) => `#${t}`).join(' ')} · {s?.video_count || 0} videos tracked · last refreshed {fmt.date(niche.last_refreshed_at)}
      </p>
      {error && <div className="error-banner">{error}</div>}

      <div className="grid cols-5" style={{ marginBottom: 14 }}>
        <MetricCard label="Median views" value={fmt.num(s?.median_views)} hint="Demand — audience size signal" />
        <MetricCard label="Engagement" value={fmt.pct(s?.avg_engagement_rate)} hint="Weighted likes, comments, shares, saves" />
        <MetricCard label="Big-creator share" value={fmt.pct(s?.creator_saturation)} hint="Videos from 500K+ accounts (lower = easier entry)" />
        <MetricCard label="View velocity" value={`${fmt.num(s?.view_velocity)}/hr`} hint="Momentum — median views gained per hour" />
        <MetricCard label="Retention score" value={s ? Math.round(s.est_watch_score) : '—'} hint="0–100, from engagement depth" estimate />
      </div>

      <div className="grid cols-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <h2>Total views across tracked videos</h2>
          {totals.length < 2 ? (
            <div className="empty">Need at least two refreshes to chart a trend — refresh again later (the scheduler also does this automatically).</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={totals} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3987e5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3987e5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2c2c2a" vertical={false} />
                <XAxis dataKey="t" tickFormatter={fmt.shortDate} {...AXIS} />
                <YAxis tickFormatter={fmt.num} width={52} {...AXIS} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#52514e' }} />
                <Area type="monotone" dataKey="views" name="Views" stroke="#3987e5" strokeWidth={2} fill="url(#viewsFill)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h2>Opportunity score over time</h2>
          {scores.length < 2 ? (
            <div className="empty">Score history builds as refreshes accumulate.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scores} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#2c2c2a" vertical={false} />
                <XAxis dataKey="computed_at" tickFormatter={fmt.shortDate} {...AXIS} />
                <YAxis domain={[0, 100]} width={36} {...AXIS} />
                <Tooltip content={<ChartTooltip format={(v) => v.toFixed(1)} />} cursor={{ stroke: '#52514e' }} labelFormatter={fmt.date} />
                <Line type="monotone" dataKey="opportunity_score" name="Opportunity" stroke="#3987e5" strokeWidth={2} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="est_watch_score" name="Est. retention" stroke="#199e70" strokeWidth={2} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {scores.length >= 2 && (
            <div className="row" style={{ fontSize: 12, color: 'var(--ink-2)', gap: 16, marginTop: 6 }}>
              <span><span style={{ color: '#3987e5' }}>●</span> Opportunity</span>
              <span><span style={{ color: '#199e70' }}>●</span> Est. retention</span>
            </div>
          )}
        </div>
      </div>

      <VideoTable videos={videos} sort={sort} onSort={setSort} />
    </div>
  );
}
