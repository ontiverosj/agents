import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmt } from '../api.js';
import ScoreBadge from '../components/ScoreBadge.jsx';

export default function AddNiche() {
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.discover(query.trim());
      setPreview(result);
      setName(query.trim().replace(/\b\w/g, (c) => c.toUpperCase()));
      setHashtags(query.trim().toLowerCase().replace(/[^a-z0-9]+/g, ''));
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const track = async () => {
    setBusy(true);
    setError(null);
    try {
      const tags = hashtags.split(/[,\s]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean);
      const niche = await api.createNiche({ name: name.trim(), hashtags: tags });
      navigate(`/niche/${niche.id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const stats = preview?.previewStats;

  return (
    <div style={{ maxWidth: 760 }}>
      <h1>Track a new niche</h1>
      <p className="subtitle">Search a topic to preview how it performs on TikTok before tracking it.</p>
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={search} className="row" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="e.g. budget meal prep, dog training, ai tools…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="btn primary" type="submit" disabled={busy || !query.trim()}>
          {busy && !preview ? 'Searching…' : 'Search'}
        </button>
      </form>

      {preview && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Preview: “{preview.query}”</h2>
              <ScoreBadge value={stats?.opportunity_score} />
            </div>
            <div className="row" style={{ gap: 24, flexWrap: 'wrap', color: 'var(--ink-2)', fontSize: 13 }}>
              <span>Median views: <strong>{fmt.num(stats?.median_views)}</strong></span>
              <span>Engagement: <strong>{fmt.pct(stats?.avg_engagement_rate)}</strong></span>
              <span>Big-creator share: <strong>{fmt.pct(stats?.creator_saturation)}</strong></span>
              <span>
                Est. retention: <strong>{stats ? Math.round(stats.est_watch_score) : '—'}</strong>{' '}
                <span className="estimate-tag" title="Estimated from public engagement signals, not actual watch-time data.">est.</span>
              </span>
            </div>
            <div style={{ marginTop: 14 }}>
              {preview.sampleVideos.slice(0, 5).map((v) => (
                <div key={v.externalId} className="hook-item">
                  <div className="row between">
                    <span style={{ maxWidth: 480, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.caption || '(no caption)'}
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {fmt.num(v.stats.views)} views · {fmt.pct(v.engagementRate)} eng
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Track it</h2>
            <label htmlFor="niche-name">Niche name</label>
            <input id="niche-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <label htmlFor="niche-tags">Hashtags to monitor (comma or space separated)</label>
            <input id="niche-tags" type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="budgetmealprep, mealprep" />
            <div style={{ marginTop: 16 }}>
              <button className="btn primary" onClick={track} disabled={busy || !name.trim() || !hashtags.trim()}>
                {busy ? 'Tracking… (first data pull)' : 'Track this niche'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
