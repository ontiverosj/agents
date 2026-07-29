#!/usr/bin/env node
/*
 * One-time ClickUp setup for the ElevenLabs agents pipeline.
 *
 * Usage:
 *   CLICKUP_API_TOKEN=pk_xxx node scripts/setup-clickup.js            # discover workspace, pick a list interactively
 *   CLICKUP_API_TOKEN=pk_xxx CLICKUP_LEADS_LIST_ID=123 node scripts/setup-clickup.js   # set up a specific list
 *
 * Idempotent: existing fields are left alone; only missing ones are created.
 * Get a token at ClickUp → Settings → Apps → API Token.
 */
require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const TOKEN = process.env.CLICKUP_API_TOKEN;
if (!TOKEN) {
  console.error('Set CLICKUP_API_TOKEN first (ClickUp → Settings → Apps → API Token).');
  process.exit(1);
}

const api = axios.create({
  baseURL: 'https://api.clickup.com/api/v2',
  headers: { Authorization: TOKEN },
  timeout: 30000,
});

// The fields the agents pipeline writes to (see obsidian note 20)
const REQUIRED_FIELDS = [
  { name: 'Phone', type: 'phone' },
  { name: 'Business Name', type: 'text' },
  { name: 'Owner Name', type: 'text' },
  { name: 'Industry', type: 'text' },
  {
    name: 'Seller Intent',
    type: 'drop_down',
    options: ['selling_now', 'open', 'not_interested', 'unknown'],
  },
  {
    name: 'Call Status',
    type: 'drop_down',
    options: ['queued', 'completed', 'no-answer', 'voicemail', 'declined', 'unreachable'],
  },
  { name: 'Last Called At', type: 'date' },
  { name: 'Revenue Range', type: 'text' },
  { name: 'Timeline', type: 'text' },
  { name: 'Reason for Selling', type: 'text' },
  { name: 'Next Step', type: 'text' },
  { name: 'DNC', type: 'checkbox' },
  // Safety gate: outbound calls refuse any lead without this checked
  { name: 'Contact Consent', type: 'checkbox' },
  // Scholar writes web-research briefs here before calls
  { name: 'Pre-Call Brief', type: 'text' },
];

const ask = (question) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()); }));
};

const pickList = async () => {
  const { data: teams } = await api.get('/team');
  const lists = [];
  for (const team of teams.teams) {
    const { data: spaces } = await api.get(`/team/${team.id}/space`, { params: { archived: false } });
    for (const space of spaces.spaces) {
      const { data: folderless } = await api.get(`/space/${space.id}/list`, { params: { archived: false } });
      for (const l of folderless.lists) lists.push({ ...l, path: `${team.name} / ${space.name}` });
      const { data: folders } = await api.get(`/space/${space.id}/folder`, { params: { archived: false } });
      for (const folder of folders.folders) {
        for (const l of folder.lists || []) {
          lists.push({ ...l, path: `${team.name} / ${space.name} / ${folder.name}` });
        }
      }
    }
  }
  if (lists.length === 0) {
    console.error('No lists found in your ClickUp workspace. Create a "Acquisition Leads" list first.');
    process.exit(1);
  }
  console.log('\nLists in your workspace:');
  lists.forEach((l, i) => console.log(`  [${i + 1}] ${l.path} / ${l.name}  (id: ${l.id})`));
  const leadGuess = lists.findIndex((l) => /lead/i.test(l.name));
  const answer = await ask(
    `\nWhich list holds your acquisition leads? [${leadGuess >= 0 ? leadGuess + 1 : 1}]: `
  );
  const idx = (Number(answer) || (leadGuess >= 0 ? leadGuess + 1 : 1)) - 1;
  return lists[idx];
};

const main = async () => {
  let listId = process.env.CLICKUP_LEADS_LIST_ID;
  let listName = null;
  if (!listId) {
    const list = await pickList();
    listId = list.id;
    listName = list.name;
  }

  const { data } = await api.get(`/list/${listId}/field`);
  const existing = (data.fields || []).map((f) => f.name.toLowerCase());
  console.log(`\nList ${listName || listId}: ${existing.length} custom field(s) already present.`);

  for (const field of REQUIRED_FIELDS) {
    if (existing.includes(field.name.toLowerCase())) {
      console.log(`  ✓ ${field.name} (exists)`);
      continue;
    }
    const body = { name: field.name, type: field.type };
    if (field.type === 'drop_down') {
      body.type_config = {
        options: field.options.map((name, orderindex) => ({ name, orderindex })),
      };
    }
    try {
      await api.post(`/list/${listId}/field`, body);
      console.log(`  + ${field.name} (created${field.options ? `: ${field.options.join(', ')}` : ''})`);
    } catch (err) {
      // Field creation via API requires a paid plan on some workspaces
      console.error(
        `  ✗ ${field.name} — ${err.response?.data?.err || err.message}. ` +
        'If the API rejects field creation, add it manually in ClickUp with the same name/options.'
      );
    }
  }

  console.log('\nDone. Set these in your .env / host env vars:');
  console.log(`  CLICKUP_API_TOKEN=<your token>`);
  console.log(`  CLICKUP_LEADS_LIST_ID=${listId}`);
  console.log('\nDropdown option names above must stay exactly as created — the agents write by name.');
};

main().catch((err) => {
  console.error('Setup failed:', err.response?.data || err.message);
  process.exit(1);
});
