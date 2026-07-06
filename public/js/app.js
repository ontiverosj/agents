/* BrandForge front-end */

const state = {
  analysis: null,
  concepts: [],
  selectedConcept: null,
  identity: null,
  selectedPaletteIdx: 0,
  selectedLogoId: null,
  clients: [],
  pkg: null,
  brandVariant: 0,
  identityVariant: 0,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2600);
}

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function busy(btn, on, label) {
  if (!btn) return;
  if (on) {
    btn.dataset.label = btn.textContent;
    btn.innerHTML = '<span class="spin">◌</span> Working…';
    btn.disabled = true;
  } else {
    btn.textContent = label || btn.dataset.label || btn.textContent;
    btn.disabled = false;
  }
}

/* ---------- Navigation ---------- */

function goTo(step) {
  $$('.step').forEach((b) => b.classList.toggle('active', b.dataset.step === step));
  $$('.panel').forEach((p) => p.classList.toggle('active', p.id === `panel-${step}`));
  window.scrollTo({ top: 0 });
}

$('#stepNav').addEventListener('click', (e) => {
  const btn = e.target.closest('.step');
  if (btn) goTo(btn.dataset.step);
});

function markDone(step) {
  const el = $(`.step[data-step="${step}"]`);
  if (el) el.classList.add('done');
}

/* ---------- Bootstrap meta (categories, tones, styles) ---------- */

async function loadMeta() {
  try {
    const meta = await api('/meta');
    state.search = meta.search || { mode: null, ready: false, provider: null };
    state.semrushEnabled = Boolean(meta.semrushEnabled);
    const catOptions = meta.categories.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('');
    $('#categorySelect').insertAdjacentHTML('beforeend', catOptions);
    $('#cCategory').insertAdjacentHTML('beforeend', catOptions);
    const toneOptions = meta.tones.map((t) => `<option value="${t.id}">${esc(t.label)}</option>`).join('');
    $('#toneSelect').innerHTML = toneOptions;
    $('#cTone').innerHTML = toneOptions;
    const styleOptions = meta.styles.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join('');
    $('#styleSelect').innerHTML = styleOptions;
    $('#cStyle').innerHTML = styleOptions;
  } catch (err) {
    toast(`Could not load app data: ${err.message}`);
  }
}

/* ---------- Step 1: Discover ---------- */

$$('.chip[data-example]').forEach((chip) =>
  chip.addEventListener('click', () => {
    $('#productInput').value = chip.dataset.example;
    $('#productInput').focus();
  })
);

$('#discoverForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#analyzeBtn');
  busy(btn, true);
  try {
    state.analysis = await api('/analyze', {
      method: 'POST',
      body: {
        product: $('#productInput').value,
        description: $('#descInput').value,
        categoryId: $('#categorySelect').value,
        goals: $('#goalsInput').value,
        tone: $('#toneSelect').value,
      },
    });
    renderInsights();
    markDone('discover');
    goTo('insights');
    toast('Opportunity analyzed ✓');
  } catch (err) {
    toast(err.message);
  } finally {
    busy(btn, false, 'Analyze opportunity →');
  }
});

/* ---------- Step 2: Insights ---------- */

function scoreRing(score) {
  const r = 36, c = 2 * Math.PI * r;
  const color = score >= 80 ? '#4ade80' : score >= 65 ? '#facc15' : '#fb923c';
  return `<div class="score-ring">
    <svg width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="8"/>
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - score / 100)}"/>
    </svg>
    <div class="score-val">${score}</div>
  </div>`;
}

function sparkline(values, color = '#6d5cff') {
  if (!values || values.length < 2) return '';
  const w = 160, h = 40, max = Math.max(...values, 0.01);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 4 - (v / max) * (h - 8)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-label="12-month search trend">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function fmtNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function sourceTag(sd) {
  const region = (sd.database || 'us').toUpperCase();
  return sd.source === 'google'
    ? `<span class="src-tag g">Google Trends · ${esc(region)}</span>`
    : `<span class="src-tag">Semrush · ${esc(region)}</span>`;
}

function relatedRow(r) {
  let meta;
  if (r.volume != null) meta = `${fmtNum(r.volume)}/mo · $${r.cpc.toFixed(2)} CPC`;
  else if (r.rising) meta = `<span class="rising">▲ ${esc(r.growth)}</span>`;
  else meta = r.interest != null ? `interest ${r.interest}` : '';
  return `<div class="kw-row"><span class="kw">${esc(r.keyword)}</span><span class="kw-meta">${meta}</span></div>`;
}

function searchDataCard(sd) {
  if (!sd || sd.needsConnect) {
    if (state.search?.mode === 'semrush-mcp' && !state.search.ready) {
      return `<div class="card full semrush-card off">
        <h3>🔎 Live search demand</h3>
        <p class="lead">Semrush MCP mode is on, but your Semrush account isn't connected yet.
        Sign in once and BrandForge will pull real U.S. search volume, trends, and keywords on every analysis.</p>
        <a class="btn primary" href="/api/semrush/connect" style="display:inline-block;margin-top:10px;text-decoration:none">Connect Semrush account →</a>
      </div>`;
    }
    if (state.semrushEnabled) return '';
    return `<div class="card full semrush-card off">
      <h3>🔎 Live search demand</h3>
      <p class="lead">Live search data is off (<code>SEARCH_MODE=off</code>). Remove that setting to use free
      Google Trends data, or configure Semrush in <code>.env</code> — see the README.</p>
    </div>`;
  }
  if (!sd.matched) {
    return `<div class="card full semrush-card">
      <h3>🔎 Live search demand ${sourceTag(sd)}</h3>
      <p class="lead">${esc(sd.note || sd.error || 'No search data found for this phrase.')}</p>
    </div>`;
  }

  const related = sd.related.map(relatedRow).join('');
  const questions = sd.questions.map((q) =>
    `<li>${esc(q.keyword)}${q.volume != null ? ` <span class="kw-vol">(${fmtNum(q.volume)}/mo)</span>` : ''}</li>`).join('');

  // Metric tiles differ by source: Semrush has absolute volume + CPC;
  // Google Trends has relative interest + momentum + seasonality.
  const tiles = sd.volume != null ? `
      <div class="sd-metric"><div class="sd-val">${fmtNum(sd.volume)}</div><div class="sd-label">searches/mo for “${esc(sd.keyword)}”</div></div>
      <div class="sd-metric"><div class="sd-val">$${sd.cpc.toFixed(2)}</div><div class="sd-label">avg. cost per click</div></div>
      <div class="sd-metric"><div class="sd-val">${Math.round(sd.competition * 100)}%</div><div class="sd-label">${esc(sd.competitionLabel)}</div></div>
      <div class="sd-metric">${sparkline(sd.trend)}<div class="sd-label">12-month interest trend</div></div>` : `
      <div class="sd-metric"><div class="sd-val">${sd.momentum >= 0 ? '+' : ''}${sd.momentum}%</div><div class="sd-label">interest momentum, last 6 months vs prior for “${esc(sd.keyword)}”</div></div>
      <div class="sd-metric"><div class="sd-val">${sd.interestIndex}/100</div><div class="sd-label">avg. interest vs its 12-month peak</div></div>
      <div class="sd-metric"><div class="sd-val" style="font-size:19px">${esc(sd.peakLabel || '—')}</div><div class="sd-label">interest peaked</div></div>
      <div class="sd-metric">${sparkline(sd.trend)}<div class="sd-label">12-month interest trend</div></div>`;

  const summary = sd.volume != null
    ? `<strong>${esc(sd.demandLabel)}.</strong> ${fmtNum(sd.results)} pages compete for this term organically.`
    : `<strong>${esc(sd.demandLabel)}.</strong> ${esc(sd.note || '')}`;

  return `<div class="card full semrush-card ${sd.source === 'google' ? 'gsrc' : ''}">
    <h3>🔎 Live search demand ${sourceTag(sd)}</h3>
    <div class="sd-metrics">${tiles}</div>
    <p class="lead" style="margin-top:10px">${summary}</p>
    <div class="pkg-grid" style="margin-top:8px">
      ${sd.related.length ? `<div><div class="mini-label" style="margin-bottom:6px">${sd.volume != null ? 'Related keywords by volume' : 'Related & rising searches'}</div>${related}</div>` : ''}
      ${sd.questions.length ? `<div><div class="mini-label" style="margin-bottom:6px">Questions people search — free content ideas</div><ul style="padding-left:18px;font-size:13.5px">${questions}</ul></div>` : ''}
    </div>
  </div>`;
}

function renderInsights() {
  const a = state.analysis;
  if (!a) return;
  $('#insightsSubtitle').textContent = `Analysis for "${a.product}"`;

  const audiences = a.audiences.map((aud) => `
    <div class="audience-card">
      <h4>${esc(aud.name)}</h4>
      <div class="desc">${esc(aud.description)}</div>
      <div class="mini-label">Pain points</div>
      <ul>${aud.painPoints.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      <div class="mini-label">Where to reach them</div>
      <div class="tag-row">${aud.channels.map((ch) => `<span class="tag">${esc(ch)}</span>`).join('')}</div>
    </div>`).join('');

  const competitors = a.competitors.map((c) => `
    <div class="competitor-row">
      <div><strong>${esc(c.name)}</strong><div class="angle">${esc(c.angle)}</div></div>
      <span class="price">${esc(c.pricePoint)}</span>
    </div>`).join('');

  $('#insightsBody').className = '';
  $('#insightsBody').innerHTML = `
    <div class="score-banner">
      ${scoreRing(a.opportunityScore)}
      <div>
        <span class="cat-tag">${esc(a.category.label)}${a.category.detected ? '' : ' (defaulted)'}</span>
        <h2>${esc(a.opportunityLabel)}</h2>
        <p>${esc(a.marketNote)}</p>
      </div>
    </div>
    <div class="insight-grid">
      ${searchDataCard(a.searchData)}
      <div class="card"><h3>📈 Market trends</h3><ul>${a.trends.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div class="card"><h3>💰 Pricing landscape</h3>
        <div class="price-tier"><strong>Budget</strong>${esc(a.pricing.budget)}</div>
        <div class="price-tier"><strong>Mid-range</strong>${esc(a.pricing.mid)}</div>
        <div class="price-tier"><strong>Premium</strong>${esc(a.pricing.premium)}</div>
      </div>
      <div class="card full"><h3>🎯 Target audiences</h3><p class="lead">Pick one to lead with — a sharp niche beats broad appeal at launch.</p>${audiences}</div>
      <div class="card"><h3>⚔️ Competitive landscape</h3>${competitors}</div>
      <div class="card"><h3>🧭 Positioning strategies</h3><ul>${a.positioning.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
      <div class="card"><h3>💡 Brand opportunities</h3><ul>${a.brandOpportunities.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>
      <div class="card"><h3>✅ Recommended next steps</h3><ul>${a.nextSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
    </div>
    <div style="margin-top:20px"><button class="btn primary large" onclick="goTo('brands')">Generate brand concepts →</button></div>`;
}

/* ---------- Step 3: Brand concepts ---------- */

async function generateBrands(bump) {
  if (!state.analysis) {
    toast('Analyze a product first (step 1)');
    goTo('discover');
    return;
  }
  if (bump) state.brandVariant++;
  const btn = $('#generateBrandsBtn');
  busy(btn, true);
  try {
    const data = await api('/brands', {
      method: 'POST',
      body: {
        product: state.analysis.product,
        categoryId: state.analysis.category.id,
        tone: state.analysis.tone || $('#toneSelect').value,
        founderName: $('#founderNameInput').value,
        variant: state.brandVariant,
      },
    });
    state.concepts = data.concepts;
    renderConcepts();
    markDone('brands');
  } catch (err) {
    toast(err.message);
  } finally {
    busy(btn, false, 'Generate concepts');
  }
}

$('#generateBrandsBtn').addEventListener('click', () => generateBrands(false));
$('#regenBrandsBtn').addEventListener('click', () => generateBrands(true));

function renderConcepts() {
  const body = $('#brandsBody');
  body.className = '';
  body.innerHTML = `<div class="concept-grid">${state.concepts.map((c, i) => `
    <div class="concept-card ${state.selectedConcept?.name === c.name ? 'selected' : ''}" data-idx="${i}">
      <span class="style-tag">${esc(c.style)}</span>
      <h3>${esc(c.name)}</h3>
      <div class="rationale">${esc(c.rationale)}</div>
      ${c.taglines.map((t) => `<div class="tagline">“${esc(t)}”</div>`).join('')}
      <div class="handles">${c.handles.map((h) => `<span class="tag">${esc(h)}</span>`).join('')}</div>
      <button class="btn primary use-btn" data-use="${i}">Use this concept →</button>
    </div>`).join('')}</div>
    <div class="note-box">⚠️ ${esc(state.concepts[0]?.note || '')}</div>`;

  body.querySelectorAll('[data-use]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const c = state.concepts[Number(btn.dataset.use)];
      state.selectedConcept = c;
      $('#brandNameInput').value = c.name;
      renderConcepts();
      goTo('identity');
      toast(`"${c.name}" selected — now build its identity`);
    })
  );
}

/* ---------- Step 4: Visual identity ---------- */

async function generateIdentity(bump) {
  const brandName = $('#brandNameInput').value.trim();
  if (!brandName) {
    toast('Enter or pick a brand name first');
    return;
  }
  if (bump) state.identityVariant++;
  const btn = $('#generateIdentityBtn');
  busy(btn, true);
  try {
    state.identity = await api('/identity', {
      method: 'POST',
      body: {
        brandName,
        categoryId: state.analysis?.category.id || '',
        style: $('#styleSelect').value,
        preferredColors: $('#colorsInput').value,
        variant: state.identityVariant,
      },
    });
    state.selectedPaletteIdx = 0;
    state.selectedLogoId = state.identity.logos[0]?.id || null;
    renderIdentity();
    markDone('identity');
  } catch (err) {
    toast(err.message);
  } finally {
    busy(btn, false, 'Build identity');
  }
}

$('#generateIdentityBtn').addEventListener('click', () => generateIdentity(false));
$('#regenIdentityBtn').addEventListener('click', () => generateIdentity(true));

function downloadText(filename, text, mime = 'image/svg+xml') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function renderIdentity() {
  const id = state.identity;
  if (!id) return;
  const body = $('#identityBody');
  body.className = '';

  const palettes = id.palettes.map((p, i) => `
    <div class="palette-card ${i === state.selectedPaletteIdx ? 'selected' : ''}" data-palette="${i}">
      <div class="swatch-strip">${p.colors.map((c) => `<div style="background:${c.hex}" title="${esc(c.name)} ${c.hex}"></div>`).join('')}</div>
      <div class="p-meta">
        <strong>${esc(p.name)}</strong>
        <div class="swatch-detail">${p.colors.map((c) => `<span class="swatch-pill"><i style="background:${c.hex}"></i>${esc(c.role)} ${c.hex}</span>`).join('')}</div>
      </div>
    </div>`).join('');

  const logos = id.logos.map((l) => `
    <div class="logo-card ${l.id === state.selectedLogoId ? 'selected' : ''}" data-logo="${l.id}">
      <div class="logo-preview">${l.svg}</div>
      <h4>${esc(l.name)}</h4>
      <p>${esc(l.description)}</p>
      <div class="row">
        <button class="btn ghost" data-download="${l.id}">⬇ SVG</button>
        <button class="btn primary" data-select-logo="${l.id}">Select</button>
      </div>
    </div>`).join('');

  const fonts = id.fonts.map((f) => `
    <div class="font-sample">
      <div class="f-head" style="font-family:'${esc(f.heading)}', sans-serif">${esc(id.brandName)}</div>
      <div class="f-body" style="font-family:'${esc(f.body)}', sans-serif">Body text: crafted for people who care about the details. ${esc(f.vibe)}.</div>
      <div class="f-names">${esc(f.heading)} + ${esc(f.body)}</div>
    </div>`).join('');

  body.innerHTML = `
    <div class="card"><h3>🎨 Color palettes <span style="font-weight:400;font-size:12.5px;color:var(--muted)">— click to choose</span></h3>
      <div class="palette-row">${palettes}</div>
    </div>
    <div class="card"><h3>🔤 Font pairings</h3><div class="font-card">${fonts}</div></div>
    <div class="card"><h3>✏️ Logo concepts</h3><div class="logo-grid">${logos}</div>
      <div class="note-box">⚠️ ${esc(id.originality)}</div>
    </div>
    <div class="card"><h3>📸 Visual direction — ${esc(id.style.label)}</h3><p style="font-size:14px">${esc(id.direction)}</p></div>
    <div style="margin-top:4px"><button class="btn primary large" onclick="goTo('package')">Build the brand package →</button></div>`;

  body.querySelectorAll('[data-palette]').forEach((el) =>
    el.addEventListener('click', async () => {
      state.selectedPaletteIdx = Number(el.dataset.palette);
      // Regenerate logos in the chosen palette by re-requesting identity is not
      // needed — logos use palette[0]; simplest is to re-render selection only.
      renderIdentity();
    })
  );
  body.querySelectorAll('[data-download]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const logo = id.logos.find((l) => l.id === btn.dataset.download);
      downloadText(`${id.brandName.replace(/\s+/g, '-').toLowerCase()}-${logo.id}.svg`, logo.svg);
      toast('SVG downloaded');
    })
  );
  body.querySelectorAll('[data-select-logo]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.selectedLogoId = btn.dataset.selectLogo;
      renderIdentity();
      toast('Logo concept selected');
    })
  );
}

/* ---------- Step 5: Clients ---------- */

async function loadClients() {
  try {
    const data = await api('/clients');
    state.clients = data.clients;
    renderClients();
    renderPackageSources();
  } catch (err) {
    toast(err.message);
  }
}

function renderClients() {
  const list = $('#clientList');
  if (!state.clients.length) {
    list.className = 'client-list empty-note';
    list.textContent = 'No clients yet.';
    return;
  }
  list.className = 'client-list';
  list.innerHTML = state.clients.map((c) => `
    <div class="client-item">
      <h4>${esc(c.name)}</h4>
      <div class="c-product">${esc(c.product)}${c.targetAudience ? ` · for ${esc(c.targetAudience)}` : ''}</div>
      <div class="row">
        <button class="btn primary" data-pkg-client="${c.id}">Build package →</button>
        <button class="btn danger-link" data-del-client="${c.id}">Delete</button>
      </div>
    </div>`).join('');

  list.querySelectorAll('[data-pkg-client]').forEach((btn) =>
    btn.addEventListener('click', () => {
      $('#packageSource').value = btn.dataset.pkgClient;
      goTo('package');
      buildPackage();
    })
  );
  list.querySelectorAll('[data-del-client]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this client?')) return;
      try {
        await api(`/clients/${btn.dataset.delClient}`, { method: 'DELETE' });
        toast('Client deleted');
        loadClients();
      } catch (err) { toast(err.message); }
    })
  );
}

$('#clientForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/clients', {
      method: 'POST',
      body: {
        name: $('#cName').value,
        email: $('#cEmail').value,
        businessIdea: $('#cIdea').value,
        product: $('#cProduct').value,
        categoryId: $('#cCategory').value,
        targetAudience: $('#cAudience').value,
        personality: $('#cPersonality').value,
        preferredColors: $('#cColors').value,
        style: $('#cStyle').value,
        tone: $('#cTone').value,
        goals: $('#cGoals').value,
      },
    });
    e.target.reset();
    toast('Client saved ✓');
    markDone('clients');
    loadClients();
  } catch (err) {
    toast(err.message);
  }
});

function renderPackageSources() {
  const sel = $('#packageSource');
  const current = sel.value;
  sel.innerHTML = '<option value="session">Current session (steps 1–4)</option>' +
    state.clients.map((c) => `<option value="${c.id}">Client: ${esc(c.name)} — ${esc(c.product)}</option>`).join('');
  if ([...sel.options].some((o) => o.value === current)) sel.value = current;
}

/* ---------- Step 6: Brand package ---------- */

async function buildPackage() {
  const source = $('#packageSource').value;
  const btn = $('#buildPackageBtn');
  let body;
  if (source === 'session') {
    if (!state.analysis) {
      toast('Analyze a product first, or pick a saved client');
      return;
    }
    body = {
      product: state.analysis.product,
      description: state.analysis.description,
      categoryId: state.analysis.category.id,
      tone: state.analysis.tone || $('#toneSelect').value,
      style: $('#styleSelect').value,
      preferredColors: $('#colorsInput').value,
      clientName: $('#founderNameInput').value,
      goals: state.analysis.goals,
      brandName: state.selectedConcept?.name || $('#brandNameInput').value.trim() || '',
      variant: state.brandVariant,
    };
  } else {
    body = { clientId: source };
  }
  busy(btn, true);
  try {
    state.pkg = await api('/package', { method: 'POST', body });
    renderPackage();
    markDone('package');
    $('#downloadPackageBtn').disabled = false;
    $('#printPackageBtn').disabled = false;
    toast('Brand package ready ✓');
  } catch (err) {
    toast(err.message);
  } finally {
    busy(btn, false, 'Build package');
  }
}

$('#buildPackageBtn').addEventListener('click', buildPackage);
$('#downloadPackageBtn').addEventListener('click', () => {
  if (!state.pkg) return;
  downloadText(`${state.pkg.brand.name.replace(/\s+/g, '-').toLowerCase()}-brand-package.json`, JSON.stringify(state.pkg, null, 2), 'application/json');
  toast('Package JSON downloaded');
});
$('#printPackageBtn').addEventListener('click', () => window.print());

function renderPackage() {
  const p = state.pkg;
  if (!p) return;
  const el = $('#packageBody');
  el.className = '';
  const pal = p.identity.palette;
  const [primary, secondary] = pal.colors.map((c) => c.hex);

  el.innerHTML = `
  <div class="package-sheet">
    <div class="pkg-hero" style="background:linear-gradient(120deg, ${primary}, ${secondary})">
      <div class="pkg-cat">${esc(p.positioning.category)} · Opportunity score ${p.positioning.opportunityScore}/100</div>
      <h2>${esc(p.brand.name)}</h2>
      <div class="pkg-tagline">“${esc(p.brand.tagline)}”</div>
      ${p.generatedFor ? `<div class="pkg-for">Prepared for ${esc(p.generatedFor)}${p.businessIdea ? ` · ${esc(p.businessIdea)}` : ''}</div>` : ''}
    </div>

    <div class="pkg-section">
      <h3>Brand story &amp; positioning</h3>
      <p><strong>Why this name:</strong> ${esc(p.brand.namingRationale)}</p>
      <p style="margin-top:8px"><strong>Positioning strategy:</strong> ${esc(p.positioning.strategy)}</p>
      <p style="margin-top:8px; color:var(--muted)">${esc(p.positioning.marketNote)}</p>
      ${p.brand.alternateTaglines?.length ? `<p style="margin-top:10px"><strong>Alternate taglines:</strong> ${p.brand.alternateTaglines.map((t) => `“${esc(t)}”`).join(' · ')}</p>` : ''}
      <div class="tag-row" style="margin-top:10px">${(p.brand.handles || []).map((h) => `<span class="tag">${esc(h)}</span>`).join('')}</div>
    </div>

    <div class="pkg-section">
      <h3>Logo concepts</h3>
      <div class="pkg-logos">${p.identity.logos.map((l) => `<div class="logo-preview" title="${esc(l.name)}">${l.svg}</div>`).join('')}</div>
    </div>

    <div class="pkg-section">
      <h3>Colors &amp; typography</h3>
      <div class="pkg-swatches">${pal.colors.map((c) => `
        <div class="pkg-swatch"><div class="sw" style="background:${c.hex}"></div>
        <div class="sw-name">${esc(c.role)} — ${esc(c.name)}</div><div class="sw-hex">${c.hex} · ${esc(c.usage)}</div></div>`).join('')}
      </div>
      <p style="margin-top:14px"><strong>Fonts:</strong> ${p.identity.fonts.map((f) => `${esc(f.heading)} (headings) + ${esc(f.body)} (body)`).join(' · ')}</p>
      <p style="margin-top:6px; color:var(--muted)">${esc(p.identity.direction)}</p>
    </div>

    <div class="pkg-section">
      <h3>Audience profile</h3>
      <p><strong>${esc(p.audienceProfile.name)}</strong> — ${esc(p.audienceProfile.description)}</p>
      <div class="pkg-grid" style="margin-top:10px">
        <div><strong style="font-size:12.5px">Pain points to speak to</strong><ul>${p.audienceProfile.painPoints.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><strong style="font-size:12.5px">Where to reach them</strong><ul>${p.audienceProfile.channels.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
    </div>

    <div class="pkg-section">
      <h3>Social media bios</h3>
      ${p.socialBios.map((b) => `<div class="bio-block">${esc(b)}</div>`).join('')}
    </div>

    <div class="pkg-section">
      <h3>Content ideas (first two weeks)</h3>
      <ul>${p.contentIdeas.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>

    ${p.searchInsights?.matched ? `
    <div class="pkg-section">
      <h3>SEO keywords to target ${sourceTag(p.searchInsights)}</h3>
      <p>${p.searchInsights.volume != null
        ? `<strong>“${esc(p.searchInsights.keyword)}”</strong> gets ${fmtNum(p.searchInsights.volume)} U.S. searches/mo
           (avg. $${p.searchInsights.cpc.toFixed(2)} CPC) — ${esc(p.searchInsights.demandLabel.toLowerCase())}.`
        : `<strong>“${esc(p.searchInsights.keyword)}”</strong> shows ${esc(p.searchInsights.demandLabel.toLowerCase())} on Google
           (${p.searchInsights.momentum >= 0 ? '+' : ''}${p.searchInsights.momentum}% over the last 6 months vs the prior 6).`}</p>
      <div class="pkg-grid" style="margin-top:10px">
        ${p.searchInsights.related.length ? `<div><strong style="font-size:12.5px">Work these into your site &amp; listings</strong>
          <ul>${p.searchInsights.related.slice(0, 8).map((r) => `<li>${esc(r.keyword)}${r.volume != null ? ` <span class="kw-vol">(${fmtNum(r.volume)}/mo)</span>` : r.rising ? ` <span class="rising">▲ ${esc(r.growth)}</span>` : ''}</li>`).join('')}</ul></div>` : ''}
        ${p.searchInsights.questions.length ? `<div><strong style="font-size:12.5px">Answer these in your content</strong>
          <ul>${p.searchInsights.questions.map((q) => `<li>${esc(q.keyword)}</li>`).join('')}</ul></div>` : ''}
      </div>
    </div>` : ''}

    <div class="pkg-section">
      <h3>Marketing direction</h3>
      <p><strong>Primary channels:</strong> ${p.marketingPlan.primaryChannels.map(esc).join(', ')}</p>
      <div class="pkg-grid" style="margin-top:10px">
        <div><strong style="font-size:12.5px">Week one</strong><ul>${p.marketingPlan.weekOne.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div><strong style="font-size:12.5px">First month</strong><ul>${p.marketingPlan.firstMonth.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
      <p style="margin-top:8px; color:var(--muted)">${esc(p.marketingPlan.positioning)}</p>
    </div>

    <div class="pkg-section">
      <h3>Recommended next steps</h3>
      <ul>${p.nextSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <div class="note-box">⚠️ ${esc(p.identity.originality)}</div>
    </div>
  </div>`;
}

/* ---------- Init ---------- */

window.goTo = goTo;
loadMeta();
loadClients();

// Post-OAuth landing (redirected back from /api/semrush/callback)
const params = new URLSearchParams(location.search);
if (params.get('semrush') === 'connected') {
  toast('Semrush connected ✓ — analyses now include live search data');
  history.replaceState(null, '', '/');
} else if (params.get('semrush') === 'error') {
  toast(`Semrush connection failed: ${params.get('reason') || 'unknown error'}`);
  history.replaceState(null, '', '/');
}
