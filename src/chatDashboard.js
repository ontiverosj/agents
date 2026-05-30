// Pure HTML renderer for the agent chat dashboard. Renders a chat UI that talks
// to POST /agent/chat. Self-contained (inline CSS + vanilla JS fetch); no deps.

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderChatDashboard(agents, options = {}) {
  const { warning = null } = options;
  const list = agents && agents.length ? agents : [{ name: 'executive', description: '' }];
  const optionsHtml = list
    .map((a) => `<option value="${escapeHtml(a.name)}">${escapeHtml(a.name)}</option>`)
    .join('');
  const descById = JSON.stringify(Object.fromEntries(list.map((a) => [a.name, a.description])));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Everflow Acquisitions — Chat with an Agent</title>
  <style>
    :root{--bg:#0b0f17;--panel:#131a26;--panel2:#1a2334;--text:#e6edf6;--muted:#8a97ab;--accent:#5b8cff;--line:#243049;}
    *{box-sizing:border-box;} html,body{height:100%;}
    body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;height:100vh;}
    header{padding:20px 32px 14px;border-bottom:1px solid var(--line);flex:0 0 auto;}
    header h1{font-size:20px;margin:0;} header .meta{color:var(--muted);font-size:13px;margin-top:2px;}
    nav{margin-top:10px;display:flex;gap:16px;} nav a{color:var(--accent);text-decoration:none;font-size:13px;} nav a.active{color:var(--text);font-weight:600;}
    .bar{display:flex;align-items:center;gap:12px;padding:12px 32px;border-bottom:1px solid var(--line);flex:0 0 auto;flex-wrap:wrap;}
    select{background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:14px;}
    .agent-desc{color:var(--muted);font-size:12px;flex:1 1 280px;min-width:200px;}
    button{background:var(--accent);color:#fff;border:0;border-radius:8px;padding:9px 16px;font-size:14px;cursor:pointer;}
    button:disabled{opacity:.5;cursor:default;} .ghost{background:var(--panel2);color:var(--muted);border:1px solid var(--line);}
    .warning{margin:12px 32px 0;padding:10px 14px;border-radius:10px;background:#3a2a12;border:1px solid #6b4e1f;color:#f3d79b;font-size:13px;}
    #log{flex:1 1 auto;overflow-y:auto;padding:24px 32px;display:flex;flex-direction:column;gap:14px;}
    .msg{max-width:760px;padding:12px 16px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word;}
    .user{align-self:flex-end;background:#1f3a6b;border:1px solid #2c4f8f;}
    .assistant{align-self:flex-start;background:var(--panel);border:1px solid var(--line);}
    .who{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);margin-bottom:4px;}
    .empty{color:var(--muted);text-align:center;margin:auto;max-width:420px;}
    .composer{flex:0 0 auto;display:flex;gap:10px;padding:16px 32px;border-top:1px solid var(--line);}
    textarea{flex:1;resize:none;background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:11px 14px;font:15px/1.4 inherit;min-height:46px;max-height:160px;}
    .typing{color:var(--muted);font-style:italic;} .err{color:#f87171;}
  </style>
</head>
<body>
  <header>
    <h1>Chat with an Agent</h1>
    <div class="meta">Everflow Acquisitions — talk to your Claude subagents live</div>
    <nav>
      <a href="/dashboard">Pipeline</a>
      <a href="/dashboard/leads">Leads</a>
      <a href="/dashboard/agents">Agents</a>
      <a href="/dashboard/chat" class="active">Chat</a>
    </nav>
  </header>

  ${warning ? `<div class="warning">${escapeHtml(warning)}</div>` : ''}

  <div class="bar">
    <label for="agent" class="who" style="margin:0">Agent</label>
    <select id="agent">${optionsHtml}</select>
    <span class="agent-desc" id="agentDesc"></span>
    <button class="ghost" id="reset" type="button">New conversation</button>
  </div>

  <div id="log">
    <div class="empty" id="empty">Pick an agent and send a message. For the executive Chief of Staff, try: <em>"Give me a briefing on the acquisition pipeline"</em> and paste in details, or ask how it would plan your week.</div>
  </div>

  <form class="composer" id="composer">
    <textarea id="input" placeholder="Message the agent…  (Enter to send, Shift+Enter for newline)" autocomplete="off"></textarea>
    <button id="send" type="submit">Send</button>
  </form>

  <script>
    const DESCS = ${descById};
    const log = document.getElementById('log');
    const empty = document.getElementById('empty');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send');
    const agentSel = document.getElementById('agent');
    const agentDesc = document.getElementById('agentDesc');
    let messages = [];

    function syncDesc(){ agentDesc.textContent = DESCS[agentSel.value] || ''; }
    syncDesc();
    agentSel.addEventListener('change', () => { if (messages.length && !confirm('Switch agent and start a new conversation?')) { return; } reset(); syncDesc(); });

    function bubble(role, text, cls){
      if (empty) empty.style.display = 'none';
      const el = document.createElement('div');
      el.className = 'msg ' + (cls || role);
      el.innerHTML = '<div class="who">' + (role === 'user' ? 'You' : agentSel.value) + '</div>';
      const body = document.createElement('div');
      body.textContent = text;
      el.appendChild(body);
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return body;
    }

    function reset(){ messages = []; log.innerHTML = ''; log.appendChild(empty); empty.style.display = ''; }
    document.getElementById('reset').addEventListener('click', reset);

    async function send(text){
      messages.push({ role: 'user', content: text });
      bubble('user', text);
      sendBtn.disabled = true;
      const pending = bubble('assistant', 'thinking…', 'assistant typing');
      try {
        const res = await fetch('/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent: agentSel.value, messages })
        });
        const data = await res.json();
        if (data.ok) {
          pending.parentElement.className = 'msg assistant';
          pending.textContent = data.reply;
          messages.push({ role: 'assistant', content: data.reply });
        } else {
          pending.parentElement.className = 'msg assistant';
          pending.innerHTML = '<span class="err">' + (data.error || 'Request failed') + '</span>';
          messages.pop(); // drop the user turn so the next try is well-formed
        }
      } catch (e) {
        pending.parentElement.className = 'msg assistant';
        pending.innerHTML = '<span class="err">Network error: ' + e.message + '</span>';
        messages.pop();
      } finally {
        sendBtn.disabled = false;
        input.focus();
        log.scrollTop = log.scrollHeight;
      }
    }

    document.getElementById('composer').addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      send(text);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('composer').requestSubmit(); }
    });
    input.focus();
  </script>
</body>
</html>`;
}

module.exports = { renderChatDashboard, escapeHtml };
