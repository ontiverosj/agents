// Simple JSON-file persistence for client onboarding records.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readClients() {
  ensureDataDir();
  if (!fs.existsSync(CLIENTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeClients(clients) {
  ensureDataDir();
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
}

function listClients() {
  return readClients();
}

function getClient(id) {
  return readClients().find((c) => c.id === id) || null;
}

function createClient(data) {
  const clients = readClients();
  const client = {
    id: `client_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    name: String(data.name || '').trim(),
    email: String(data.email || '').trim(),
    businessIdea: String(data.businessIdea || '').trim(),
    product: String(data.product || '').trim(),
    categoryId: String(data.categoryId || '').trim(),
    targetAudience: String(data.targetAudience || '').trim(),
    personality: String(data.personality || '').trim(),
    preferredColors: String(data.preferredColors || '').trim(),
    style: String(data.style || 'modern').trim(),
    tone: String(data.tone || 'bold').trim(),
    goals: String(data.goals || '').trim(),
  };
  clients.push(client);
  writeClients(clients);
  return client;
}

function deleteClient(id) {
  const clients = readClients();
  const next = clients.filter((c) => c.id !== id);
  if (next.length === clients.length) return false;
  writeClients(next);
  return true;
}

module.exports = { listClients, getClient, createClient, deleteClient };
