async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const api = {
  health: () => request('/health'),
  listNiches: () => request('/niches'),
  getNiche: (id) => request(`/niches/${id}`),
  createNiche: (data) => request('/niches', { method: 'POST', body: JSON.stringify(data) }),
  archiveNiche: (id) => request(`/niches/${id}`, { method: 'DELETE' }),
  refreshNiche: (id) => request(`/niches/${id}/refresh`, { method: 'POST' }),
  timeseries: (id, days = 30) => request(`/niches/${id}/timeseries?days=${days}`),
  videos: (id, sort = 'views') => request(`/niches/${id}/videos?sort=${sort}`),
  discover: (q) => request(`/discover?q=${encodeURIComponent(q)}`),
  generatePlan: (id) => request(`/niches/${id}/gameplan`, { method: 'POST' }),
  latestPlan: (id) => request(`/niches/${id}/gameplan`),
  listPlans: (id) => request(`/niches/${id}/gameplans`),
  getPlan: (planId) => request(`/gameplans/${planId}`),
};

export const fmt = {
  num(n) {
    if (n == null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return Math.round(n).toLocaleString();
  },
  pct: (x) => (x == null ? '—' : `${(x * 100).toFixed(1)}%`),
  score: (x) => (x == null ? '—' : Math.round(x)),
  date: (iso) => (iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'),
  shortDate: (iso) => (iso ? new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''),
};
