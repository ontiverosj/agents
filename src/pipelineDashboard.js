// Pure, dependency-free HTML renderer for the acquisition pipeline dashboard.
// Takes computePipelineMetrics() output and returns a self-contained HTML page
// (inline CSS, Chart.js via CDN). No Express/fs imports.

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const VERDICT_COLOR = {
  proceed: '#34d399',
  enrich: '#5b8cff',
  hold: '#fbbf24',
  disqualify: '#f87171',
};

function kpiCard(label, value, sub, accent) {
  return `
        <div class="card kpi">
          <div class="kpi-value"${accent ? ` style="color:${accent}"` : ''}>${escapeHtml(value)}</div>
          <div class="kpi-label">${escapeHtml(label)}</div>
          ${sub ? `<div class="kpi-sub">${escapeHtml(sub)}</div>` : ''}
        </div>`;
}

function verdictPill(verdict) {
  const color = VERDICT_COLOR[verdict] || '#94a3b8';
  return `<span class="pill" style="border-color:${color};color:${color}">${escapeHtml(verdict || 'unknown')}</span>`;
}

function queueRows(queue) {
  if (!queue.length) return '<tr><td colspan="6" class="empty">No live prospects — run the sourcing agent.</td></tr>';
  return queue
    .map(
      (p) => `
          <tr>
            <td>
              <div class="co">${escapeHtml(p.company || 'Unnamed')}</div>
              <div class="muted-sm">${escapeHtml(p.owner || '—')}</div>
            </td>
            <td>${escapeHtml(p.industry || '—')}<div class="muted-sm">${escapeHtml(p.track || '')}</div></td>
            <td>${verdictPill(p.verdict)}</td>
            <td class="num">${escapeHtml(p.priority)}</td>
            <td class="num">${escapeHtml(p.confirmed)} / <span class="muted-sm">${escapeHtml(p.gaps)} gaps</span></td>
            <td class="muted-sm">${escapeHtml(p.nextStep || '')}</td>
          </tr>`
    )
    .join('');
}

function renderPipelineDashboard(metrics, options = {}) {
  const { runMeta, kpis, verdictCounts, byTrack, byIndustry, priorityDist, topDisqualifiers, topEnrichmentGaps, actionQueue } = metrics;
  const { warning = null, generatedAt = new Date() } = options;
  const avgPr = kpis.avgLivePriority === null ? '—' : kpis.avgLivePriority.toFixed(1);
  const source = runMeta.generated ? `Run ${escapeHtml(runMeta.generated)}` : `Rendered ${generatedAt.toISOString().slice(0, 16).replace('T', ' ')}`;

  const charts = { verdict: verdictCounts, track: byTrack, industry: byIndustry, priority: priorityDist, disq: topDisqualifiers, gaps: topEnrichmentGaps };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Everflow Acquisitions — Pipeline Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    :root{--bg:#0b0f17;--panel:#131a26;--panel2:#1a2334;--text:#e6edf6;--muted:#8a97ab;--accent:#5b8cff;--line:#243049;}
    *{box-sizing:border-box;} body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
    header{padding:28px 32px 18px;border-bottom:1px solid var(--line);display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;}
    header h1{font-size:22px;margin:0;} header .meta{color:var(--muted);font-size:13px;}
    .wrap{padding:24px 32px 48px;max-width:1200px;margin:0 auto;}
    .banner{padding:12px 16px;border-radius:10px;margin-bottom:18px;font-size:13px;}
    .warning{background:#3a2a12;border:1px solid #6b4e1f;color:#f3d79b;}
    .honesty{background:#10233a;border:1px solid #1f4068;color:#a9c7ee;}
    .grid{display:grid;gap:16px;} .kpis{grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin-bottom:8px;}
    .charts{grid-template-columns:repeat(auto-fit,minmax(320px,1fr));margin-top:16px;}
    .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px 20px;}
    .kpi-value{font-size:30px;font-weight:700;letter-spacing:-0.5px;} .kpi-label{color:var(--muted);font-size:12px;margin-top:4px;text-transform:uppercase;letter-spacing:.4px;}
    .kpi-sub{color:var(--accent);font-size:12px;margin-top:6px;}
    .card h3{margin:0 0 12px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;}
    canvas{max-height:260px;}
    table{width:100%;border-collapse:collapse;margin-top:14px;} .table-card{padding-bottom:8px;}
    th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);font-size:14px;vertical-align:top;}
    th{color:var(--muted);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
    td.num,th.num{text-align:right;white-space:nowrap;} td.empty{color:var(--muted);text-align:center;padding:28px;}
    .co{font-weight:600;} .muted-sm{color:var(--muted);font-size:12px;}
    .pill{background:var(--panel2);border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:12px;text-transform:capitalize;}
    a.refresh{color:var(--accent);text-decoration:none;font-size:13px;}
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Acquisition Pipeline</h1>
      <div class="meta">Everflow Acquisitions${runMeta.buyBoxVersion ? ` · Buy Box v${escapeHtml(runMeta.buyBoxVersion)}` : ''}${runMeta.track ? ` · ${escapeHtml(runMeta.track)}` : ''}</div>
    </div>
    <div class="meta">
      <a class="refresh" href="/dashboard">Pipeline</a> ·
      <a class="refresh" href="/dashboard/leads">Leads</a> ·
      <a class="refresh" href="/dashboard/agents">Agents</a>
      &nbsp;|&nbsp; ${source} · <a class="refresh" href="">Refresh</a>
    </div>
  </header>
  <div class="wrap">
    ${warning ? `<div class="banner warning">${escapeHtml(warning)}</div>` : ''}

    <div class="grid kpis">
      ${kpiCard('Prospects', kpis.total.toLocaleString('en-US'))}
      ${kpiCard('Ready to qualify', kpis.proceed.toLocaleString('en-US'), 'verdict: proceed', VERDICT_COLOR.proceed)}
      ${kpiCard('Enrichment backlog', kpis.enrich.toLocaleString('en-US'), 'queued to Clay', VERDICT_COLOR.enrich)}
      ${kpiCard('Disqualified', kpis.disqualified.toLocaleString('en-US'), 'Buy Box fails', VERDICT_COLOR.disqualify)}
      ${kpiCard('Avg priority', avgPr, 'live prospects')}
      ${kpiCard('Pushed to Clay', runMeta.pushedToClay === null ? '—' : runMeta.pushedToClay.toLocaleString('en-US'))}
    </div>

    <div class="grid charts">
      <div class="card"><h3>Verdict funnel</h3><canvas id="verdictChart"></canvas></div>
      <div class="card"><h3>By track</h3><canvas id="trackChart"></canvas></div>
      <div class="card"><h3>By industry</h3><canvas id="industryChart"></canvas></div>
      <div class="card"><h3>Priority (live prospects)</h3><canvas id="priorityChart"></canvas></div>
      <div class="card"><h3>Top disqualifiers</h3><canvas id="disqChart"></canvas></div>
      <div class="card"><h3>Enrichment gaps</h3><canvas id="gapsChart"></canvas></div>
    </div>

    <div class="card table-card">
      <h3>Action queue — work highest priority first</h3>
      <table>
        <thead><tr><th>Company / owner</th><th>Industry / track</th><th>Verdict</th><th class="num">Priority</th><th class="num">Signals</th><th>Next step</th></tr></thead>
        <tbody>${queueRows(actionQueue)}</tbody>
      </table>
    </div>

    ${runMeta.dataHonesty ? `<div class="banner honesty" style="margin-top:18px"><strong>Data honesty:</strong> ${escapeHtml(runMeta.dataHonesty)}</div>` : ''}
  </div>

  <script>
    const DATA = ${JSON.stringify(charts)};
    const VCOLOR = ${JSON.stringify(VERDICT_COLOR)};
    const palette = ['#5b8cff','#34d399','#fbbf24','#f87171','#a78bfa','#22d3ee','#f472b6','#94a3b8'];
    const gridColor = 'rgba(255,255,255,0.06)';
    Chart.defaults.color = '#8a97ab';
    Chart.defaults.font.family = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";
    const L = r => r.map(x => x.label), V = r => r.map(x => x.count);

    function bar(id, rows, horizontal, colors){
      const el = document.getElementById(id); if(!el || !rows.length) return;
      new Chart(el,{type:'bar',data:{labels:L(rows),datasets:[{data:V(rows),backgroundColor:colors||'#5b8cff',borderRadius:6}]},
        options:{indexAxis:horizontal?'y':'x',plugins:{legend:{display:false}},
          scales:{x:{grid:{color:gridColor},ticks:{precision:0}},y:{grid:{color:gridColor},ticks:{precision:0}}}}});
    }
    function doughnut(id, rows){
      const el = document.getElementById(id); if(!el || !rows.length) return;
      new Chart(el,{type:'doughnut',data:{labels:L(rows),datasets:[{data:V(rows),backgroundColor:palette,borderWidth:0}]},
        options:{plugins:{legend:{position:'right'}},cutout:'60%'}});
    }

    bar('verdictChart', DATA.verdict, false, DATA.verdict.map(r => VCOLOR[r.label] || '#94a3b8'));
    doughnut('trackChart', DATA.track);
    bar('industryChart', DATA.industry, true);
    bar('priorityChart', DATA.priority, false);
    bar('disqChart', DATA.disq, true, '#f87171');
    bar('gapsChart', DATA.gaps, true, '#fbbf24');
  </script>
</body>
</html>`;
}

module.exports = { renderPipelineDashboard, escapeHtml };
