// Pure, dependency-free renderer for the agents / fleet dashboard.
// Takes buildRegistry() output and returns a self-contained HTML page.

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STATUS_COLOR = {
  active: '#34d399',
  planned: '#fbbf24',
  external: '#5b8cff',
};

function statusBadge(status) {
  const color = STATUS_COLOR[status] || '#94a3b8';
  return `<span class="badge" style="border-color:${color};color:${color}">${escapeHtml(status)}</span>`;
}

function kpiCard(label, value, accent) {
  return `
        <div class="card kpi">
          <div class="kpi-value"${accent ? ` style="color:${accent}"` : ''}>${escapeHtml(value)}</div>
          <div class="kpi-label">${escapeHtml(label)}</div>
        </div>`;
}

function flowStrip(flow) {
  return flow
    .map((s, i) => {
      const color = STATUS_COLOR[s.status] || '#94a3b8';
      const arrow = i < flow.length - 1 ? '<div class="arrow">→</div>' : '';
      return `
        <div class="flow-node" style="border-color:${color}">
          <div class="flow-stage">${escapeHtml(s.stage)}</div>
          <div class="flow-owner">${escapeHtml(s.owner)}</div>
          <div>${statusBadge(s.status)}</div>
        </div>${arrow}`;
    })
    .join('');
}

function claudeCards(agents) {
  if (!agents.length) return '<div class="muted">No Claude subagents found in .claude/agents/.</div>';
  return agents
    .map(
      (a) => `
        <div class="card agent">
          <div class="agent-head">
            <div class="agent-name">${escapeHtml(a.name)}</div>
            <span class="badge model">${escapeHtml(a.model)}</span>
          </div>
          <div class="agent-role">${escapeHtml(a.role)}</div>
          <div class="agent-desc">${escapeHtml(a.description)}</div>
        </div>`
    )
    .join('');
}

function opRows(ops) {
  if (!ops.length) return '<tr><td colspan="5" class="empty">No operational agents registered.</td></tr>';
  return ops
    .map(
      (a) => `
          <tr>
            <td><div class="co">${escapeHtml(a.name)}</div></td>
            <td>${escapeHtml(a.kind)}</td>
            <td>${escapeHtml(a.stage)}</td>
            <td>${statusBadge(a.status)}</td>
            <td><code>${escapeHtml(a.entrypoint)}</code><div class="muted-sm">${escapeHtml(a.does)}</div></td>
          </tr>`
    )
    .join('');
}

function renderAgentsDashboard(registry, options = {}) {
  const { claudeAgents, opAgents, kpis, flow } = registry;
  const { generatedAt = new Date() } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Everflow Acquisitions — Agent Fleet</title>
  <style>
    :root{--bg:#0b0f17;--panel:#131a26;--panel2:#1a2334;--text:#e6edf6;--muted:#8a97ab;--accent:#5b8cff;--line:#243049;}
    *{box-sizing:border-box;} body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
    header{padding:28px 32px 18px;border-bottom:1px solid var(--line);}
    header h1{font-size:22px;margin:0;} header .meta{color:var(--muted);font-size:13px;margin-top:4px;}
    nav{margin-top:12px;display:flex;gap:16px;} nav a{color:var(--accent);text-decoration:none;font-size:13px;} nav a.active{color:var(--text);font-weight:600;}
    .wrap{padding:24px 32px 48px;max-width:1200px;margin:0 auto;}
    .grid{display:grid;gap:16px;}
    .kpis{grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:8px;}
    .agents{grid-template-columns:repeat(auto-fit,minmax(280px,1fr));margin-top:16px;}
    .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px 20px;}
    .kpi-value{font-size:30px;font-weight:700;letter-spacing:-0.5px;} .kpi-label{color:var(--muted);font-size:12px;margin-top:4px;text-transform:uppercase;letter-spacing:.4px;}
    h2{font-size:14px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin:28px 0 6px;}
    .orchestrator{margin-top:16px;display:flex;align-items:center;gap:12px;border:1px dashed var(--accent);border-radius:14px;padding:14px 18px;background:#101a2e;}
    .orchestrator .tag{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:var(--accent);border:1px solid var(--accent);border-radius:999px;padding:2px 8px;}
    .flow{display:flex;align-items:stretch;gap:10px;flex-wrap:wrap;margin-top:12px;}
    .flow-node{background:var(--panel);border:1px solid var(--line);border-left-width:4px;border-radius:12px;padding:12px 16px;min-width:170px;}
    .flow-stage{font-weight:700;} .flow-owner{color:var(--muted);font-size:13px;margin:4px 0 8px;}
    .arrow{display:flex;align-items:center;color:var(--muted);font-size:20px;}
    .agent-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
    .agent-name{font-weight:700;font-size:16px;} .agent-role{color:var(--accent);font-size:12px;margin:2px 0 8px;}
    .agent-desc{color:var(--text);font-size:13px;}
    table{width:100%;border-collapse:collapse;margin-top:8px;}
    th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);font-size:14px;vertical-align:top;}
    th{color:var(--muted);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
    .co{font-weight:600;} code{background:var(--panel2);border:1px solid var(--line);border-radius:6px;padding:1px 6px;font-size:12px;}
    .muted,.muted-sm{color:var(--muted);} .muted-sm{font-size:12px;margin-top:4px;} td.empty{text-align:center;padding:24px;color:var(--muted);}
    .badge{border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:12px;text-transform:capitalize;}
    .badge.model{color:var(--muted);text-transform:none;}
  </style>
</head>
<body>
  <header>
    <h1>Agent Fleet</h1>
    <div class="meta">Everflow Acquisitions — mission control for every agent in the pipeline</div>
    <nav>
      <a href="/dashboard">Pipeline</a>
      <a href="/dashboard/leads">Leads (CRM)</a>
      <a href="/dashboard/agents" class="active">Agents</a>
      <a href="/dashboard/chat">Chat</a>
    </nav>
  </header>
  <div class="wrap">
    <div class="grid kpis">
      ${kpiCard('Total agents', kpis.total)}
      ${kpiCard('Claude subagents', kpis.claude, '#a78bfa')}
      ${kpiCard('Active', kpis.active, STATUS_COLOR.active)}
      ${kpiCard('Planned', kpis.planned, STATUS_COLOR.planned)}
    </div>

    <h2>Orchestrator</h2>
    <div class="orchestrator">
      <span class="tag">Chief of Staff</span>
      <div>${claudeAgents.length ? escapeHtml(claudeAgents[0].name) : 'executive'} — looks across the whole fleet, sets priorities, and delegates to the agents below.</div>
    </div>

    <h2>Pipeline flow</h2>
    <div class="flow">${flowStrip(flow)}</div>

    <h2>Claude subagents</h2>
    <div class="grid agents">${claudeCards(claudeAgents)}</div>

    <h2>Operational agents</h2>
    <div class="card" style="padding-bottom:8px">
      <table>
        <thead><tr><th>Agent</th><th>Type</th><th>Stage</th><th>Status</th><th>Entry point / what it does</th></tr></thead>
        <tbody>${opRows(opAgents)}</tbody>
      </table>
    </div>

    <div class="meta" style="margin-top:18px">Rendered ${escapeHtml(generatedAt.toISOString().slice(0, 16).replace('T', ' '))} UTC</div>
  </div>
</body>
</html>`;
}

module.exports = { renderAgentsDashboard, escapeHtml };
