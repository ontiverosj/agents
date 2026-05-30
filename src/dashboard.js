// Pure, dependency-free HTML renderer for the leads dashboard.
// Takes the output of computeMetrics() and returns a self-contained HTML page
// (inline CSS, Chart.js via CDN). No Express/Airtable imports so it can be
// dry-run standalone.

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(n) {
  const value = Number(n) || 0;
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(value % 1e6 === 0 ? 0 : 1) + 'M';
  if (value >= 1e3) return '$' + (value / 1e3).toFixed(value % 1e3 === 0 ? 0 : 1) + 'K';
  return '$' + value.toLocaleString('en-US');
}

function kpiCard(label, value, sub) {
  return `
        <div class="card kpi">
          <div class="kpi-value">${escapeHtml(value)}</div>
          <div class="kpi-label">${escapeHtml(label)}</div>
          ${sub ? `<div class="kpi-sub">${escapeHtml(sub)}</div>` : ''}
        </div>`;
}

function recentRows(recent) {
  if (!recent.length) {
    return '<tr><td colspan="5" class="empty">No leads yet.</td></tr>';
  }
  return recent
    .map((lead) => {
      const date = lead.dateAdded ? new Date(lead.dateAdded) : null;
      const dateStr = date && !isNaN(date) ? date.toISOString().slice(0, 10) : '—';
      return `
          <tr>
            <td>${escapeHtml(lead.businessName || lead.ownerName || 'Unnamed')}</td>
            <td>${escapeHtml(lead.industry || '—')}</td>
            <td><span class="pill">${escapeHtml(lead.leadStatus || 'Unknown')}</span></td>
            <td>${escapeHtml(lead.priority || '—')}</td>
            <td>${escapeHtml(dateStr)}</td>
          </tr>`;
    })
    .join('');
}

function renderDashboard(metrics, options = {}) {
  const { kpis, byStatus, bySource, byPriority, byIndustry, recent } = metrics;
  const { warning = null, generatedAt = new Date() } = options;

  const avgScore = kpis.avgQualityScore === null ? '—' : kpis.avgQualityScore.toFixed(1);

  const chartData = {
    status: byStatus,
    source: bySource,
    priority: byPriority,
    industry: byIndustry,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Executive Dashboard — Personal Brand</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg: #0b0f17; --panel: #131a26; --panel-2: #1a2334;
      --text: #e6edf6; --muted: #8a97ab; --accent: #5b8cff; --line: #243049;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; background: var(--bg); color: var(--text);
      font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    header {
      padding: 28px 32px 18px; border-bottom: 1px solid var(--line);
      display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 8px;
    }
    header h1 { font-size: 22px; margin: 0; }
    header .meta { color: var(--muted); font-size: 13px; }
    .wrap { padding: 24px 32px 48px; max-width: 1200px; margin: 0 auto; }
    .warning {
      background: #3a2a12; border: 1px solid #6b4e1f; color: #f3d79b;
      padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-size: 14px;
    }
    .grid { display: grid; gap: 16px; }
    .kpis { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: 8px; }
    .charts { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-top: 16px; }
    .card {
      background: var(--panel); border: 1px solid var(--line);
      border-radius: 14px; padding: 18px 20px;
    }
    .kpi-value { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; }
    .kpi-label { color: var(--muted); font-size: 13px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi-sub { color: var(--accent); font-size: 13px; margin-top: 6px; }
    .card h3 { margin: 0 0 12px; font-size: 14px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; }
    canvas { max-height: 260px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .card.table-card { padding-bottom: 8px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); font-size: 14px; }
    th { color: var(--muted); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.4px; }
    td.empty { color: var(--muted); text-align: center; padding: 28px; }
    .pill { background: var(--panel-2); border: 1px solid var(--line); border-radius: 999px; padding: 2px 10px; font-size: 12px; }
    a.refresh { color: var(--accent); text-decoration: none; font-size: 13px; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Executive Dashboard</h1>
      <div class="meta">Personal brand — leads &amp; acquisition pipeline</div>
    </div>
    <div class="meta">
      Updated ${escapeHtml(generatedAt.toISOString().replace('T', ' ').slice(0, 16))} UTC
      &nbsp;·&nbsp; <a class="refresh" href="">Refresh</a>
    </div>
  </header>
  <div class="wrap">
    ${warning ? `<div class="warning">${escapeHtml(warning)}</div>` : ''}

    <div class="grid kpis">
      ${kpiCard('Total leads', kpis.total.toLocaleString('en-US'))}
      ${kpiCard('New this week', kpis.newThisWeek.toLocaleString('en-US'))}
      ${kpiCard('Qualified', kpis.qualified.toLocaleString('en-US'))}
      ${kpiCard('Pipeline value', formatMoney(kpis.pipelineValue))}
      ${kpiCard('Avg quality score', avgScore, 'out of 100')}
    </div>

    <div class="grid charts">
      <div class="card"><h3>Pipeline by status</h3><canvas id="statusChart"></canvas></div>
      <div class="card"><h3>Lead source</h3><canvas id="sourceChart"></canvas></div>
      <div class="card"><h3>Priority</h3><canvas id="priorityChart"></canvas></div>
      <div class="card"><h3>Top industries</h3><canvas id="industryChart"></canvas></div>
    </div>

    <div class="card table-card">
      <h3>Recent leads</h3>
      <table>
        <thead>
          <tr><th>Business</th><th>Industry</th><th>Status</th><th>Priority</th><th>Added</th></tr>
        </thead>
        <tbody>${recentRows(recent)}</tbody>
      </table>
    </div>
  </div>

  <script>
    const DATA = ${JSON.stringify(chartData)};
    const palette = ['#5b8cff','#34d399','#fbbf24','#f87171','#a78bfa','#22d3ee','#f472b6','#94a3b8'];
    const gridColor = 'rgba(255,255,255,0.06)';
    Chart.defaults.color = '#8a97ab';
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    function labels(rows) { return rows.map(r => r.label); }
    function values(rows) { return rows.map(r => r.count); }

    function makeBar(id, rows, horizontal) {
      const el = document.getElementById(id);
      if (!el || !rows.length) return;
      new Chart(el, {
        type: 'bar',
        data: { labels: labels(rows), datasets: [{ data: values(rows), backgroundColor: '#5b8cff', borderRadius: 6 }] },
        options: {
          indexAxis: horizontal ? 'y' : 'x',
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { precision: 0 } },
            y: { grid: { color: gridColor }, ticks: { precision: 0 } }
          }
        }
      });
    }

    function makeDoughnut(id, rows) {
      const el = document.getElementById(id);
      if (!el || !rows.length) return;
      new Chart(el, {
        type: 'doughnut',
        data: { labels: labels(rows), datasets: [{ data: values(rows), backgroundColor: palette, borderWidth: 0 }] },
        options: { plugins: { legend: { position: 'right' } }, cutout: '60%' }
      });
    }

    makeBar('statusChart', DATA.status, false);
    makeDoughnut('sourceChart', DATA.source);
    makeDoughnut('priorityChart', DATA.priority);
    makeBar('industryChart', DATA.industry, true);
  </script>
</body>
</html>`;
}

module.exports = { renderDashboard, formatMoney, escapeHtml };
