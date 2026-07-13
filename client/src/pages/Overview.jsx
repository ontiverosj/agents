import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, fmt } from '../api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';
import Sparkline from '../components/Sparkline.jsx';

export default function Overview() {
  const [niches, setNiches] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const load = () => api.listNiches().then(setNiches).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const refreshAll = async () => {
    setRefreshing(true);
    setError(null);
    try {
      for (const n of niches) await api.refreshNiche(n.id);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (error && !niches) return <div className="error-banner">{error}</div>;
  if (!niches) return <div className="loading">Loading niches…</div>;

  return (
    <div>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div>
          <h1>Niche leaderboard</h1>
          <p className="subtitle" style={{ margin: 0 }}>
            Ranked by opportunity score — demand, engagement, competition, momentum and estimated retention.
          </p>
        </div>
        {niches.length > 0 && (
          <button className="btn" onClick={refreshAll} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : '↻ Refresh all'}
          </button>
        )}
      </div>
      {error && <div className="error-banner">{error}</div>}

      {niches.length === 0 ? (
        <div className="card empty">
          <p>No niches tracked yet.</p>
          <Link to="/add" className="btn primary">Track your first niche</Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Niche</th>
                  <th className="num">Opportunity</th>
                  <th className="num">Median views</th>
                  <th className="num">Engagement</th>
                  <th className="num">
                    Est. retention{' '}
                    <span className="estimate-tag" title="Estimated from public engagement signals — TikTok does not expose real watch time for other creators' videos.">?</span>
                  </th>
                  <th className="num">Big-creator share</th>
                  <th>Trend</th>
                  <th>Last refreshed</th>
                </tr>
              </thead>
              <tbody>
                {niches.map((n, i) => {
                  const s = n.latestScore;
                  return (
                    <tr key={n.id} className="clickable" onClick={() => navigate(`/niche/${n.id}`)}>
                      <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                      <td>
                        <strong>{n.name}</strong>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {n.hashtags.map((t) => `#${t}`).join(' ')}
                        </div>
                      </td>
                      <td className="num"><ScoreBadge value={s?.opportunity_score} /></td>
                      <td className="num">{fmt.num(s?.median_views)}</td>
                      <td className="num">{fmt.pct(s?.avg_engagement_rate)}</td>
                      <td className="num">{s ? Math.round(s.est_watch_score) : '—'}</td>
                      <td className="num">{fmt.pct(s?.creator_saturation)}</td>
                      <td><Sparkline points={n.sparkline} /></td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{fmt.date(n.last_refreshed_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
