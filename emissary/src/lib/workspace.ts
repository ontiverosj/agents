"use client";

/**
 * Client-side workspace store for the MVP: agents you create (via the
 * Architect or the wizard) and connections you add persist in localStorage,
 * so the app behaves like a real product without a backend. In production
 * this module is replaced by API calls backed by Postgres.
 */

import { useSyncExternalStore } from "react";
import type { Agent } from "@/lib/data";
import type { TeamBlueprint, BlueprintAgent } from "@/lib/blueprint";

export interface CustomConnection {
  id: string;
  name: string;
  kind: "mcp" | "rest";
  url: string;
  /** stored locally only in the MVP — production uses the encrypted vault */
  hasSecret: boolean;
  status: "unverified" | "reachable" | "unreachable";
  addedAt: string;
}

export interface WorkspaceState {
  agents: Agent[];
  connections: CustomConnection[];
  connectedIntegrations: string[]; // built-in integration ids toggled on
  hideDemo: boolean;
}

const KEY = "emissary.workspace.v1";
const EMPTY: WorkspaceState = { agents: [], connections: [], connectedIntegrations: [], hideDemo: false };

let cache: WorkspaceState | null = null;
const listeners = new Set<() => void>();

function read(): WorkspaceState {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: WorkspaceState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full/blocked — keep in-memory state
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useWorkspace(): WorkspaceState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const workspace = {
  get: read,

  addAgents(agents: Agent[]) {
    const state = read();
    const existing = new Set(state.agents.map((a) => a.id));
    write({ ...state, agents: [...state.agents, ...agents.filter((a) => !existing.has(a.id))] });
  },

  removeAgent(id: string) {
    const state = read();
    write({ ...state, agents: state.agents.filter((a) => a.id !== id) });
  },

  addConnection(conn: CustomConnection) {
    const state = read();
    write({ ...state, connections: [...state.connections.filter((c) => c.id !== conn.id), conn] });
  },

  removeConnection(id: string) {
    const state = read();
    write({ ...state, connections: state.connections.filter((c) => c.id !== id) });
  },

  setIntegration(id: string, connected: boolean) {
    const state = read();
    const set = new Set(state.connectedIntegrations);
    if (connected) set.add(id);
    else set.delete(id);
    write({ ...state, connectedIntegrations: [...set] });
  },

  setHideDemo(hide: boolean) {
    write({ ...read(), hideDemo: hide });
  },
};

let counter = 0;
function slug(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${(++counter + read().agents.length).toString(36)}`;
}

function toAgent(a: BlueprintAgent, extra: { tools: string[]; teamName?: string; subAgentNames?: string[] }): Agent {
  return {
    id: slug(a.name),
    name: a.name,
    role: a.role,
    status: "working",
    avatarHue: a.hue,
    initials: a.initials.slice(0, 2).toUpperCase(),
    description: a.brief,
    instructions: a.brief + (extra.subAgentNames?.length ? ` Delegate subtasks to your sub-agents (${extra.subAgentNames.join(", ")}) and assemble their results.` : ""),
    schedule: `${a.schedule} → ${a.output}`,
    tools: extra.tools,
    memory: extra.teamName
      ? [{ id: "m0", fact: `Part of the "${extra.teamName}" team.`, source: "user", updatedAt: "just now" }]
      : [],
    tasksCompleted: 0,
    hoursSaved: 0,
    successRate: 0,
    createdAt: "just now",
    lastActive: "just now",
    currentActivity: "First run in progress",
  };
}

/** Convert a deployed blueprint into workspace agents (lead + sub-agents). */
export function agentsFromBlueprint(bp: TeamBlueprint): Agent[] {
  const tools = ["Web browsing", ...bp.connections.map((c) => c.name)];
  const lead = toAgent(bp.lead, { tools, teamName: bp.teamName, subAgentNames: bp.subAgents.map((s) => s.name) });
  const subs = bp.subAgents.map((s) =>
    toAgent(s, { tools, teamName: bp.teamName }),
  );
  return [lead, ...subs];
}
