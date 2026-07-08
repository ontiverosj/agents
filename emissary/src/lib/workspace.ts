"use client";

/**
 * Client-side workspace store for the MVP: agents you create (via the
 * Architect or the wizard) and connections you add persist in localStorage,
 * so the app behaves like a real product without a backend. In production
 * this module is replaced by API calls backed by Postgres.
 */

import { useSyncExternalStore } from "react";
import type { Agent, AuditEvent } from "@/lib/data";
import type { AgentBlueprint } from "@/lib/blueprint";

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
  events: AuditEvent[]; // append-only audit trail of workspace actions
}

const KEY = "emissary.workspace.v2";
const EMPTY: WorkspaceState = { agents: [], connections: [], connectedIntegrations: [], events: [] };

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

function logEvent(state: WorkspaceState, event: string, detail: string, category: AuditEvent["category"]): AuditEvent[] {
  return [
    {
      id: `e-${Date.now().toString(36)}-${state.events.length}`,
      time: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
      actor: "You",
      actorType: "user",
      event,
      detail,
      category,
    },
    ...state.events,
  ];
}

export const workspace = {
  get: read,

  addAgents(agents: Agent[]) {
    const state = read();
    const existing = new Set(state.agents.map((a) => a.id));
    const fresh = agents.filter((a) => !existing.has(a.id));
    let events = state.events;
    for (const a of fresh) events = logEvent({ ...state, events }, "Agent created", `${a.name} — ${a.role}`, "task");
    write({ ...state, agents: [...state.agents, ...fresh], events });
  },

  removeAgent(id: string) {
    const state = read();
    const agent = state.agents.find((a) => a.id === id);
    write({
      ...state,
      agents: state.agents.filter((a) => a.id !== id),
      events: agent ? logEvent(state, "Agent removed", agent.name, "settings") : state.events,
    });
  },

  addConnection(conn: CustomConnection) {
    const state = read();
    write({
      ...state,
      connections: [...state.connections.filter((c) => c.id !== conn.id), conn],
      events: logEvent(state, "Connection added", `${conn.name} (${conn.kind.toUpperCase()}) — ${conn.status}`, "integration"),
    });
  },

  removeConnection(id: string) {
    const state = read();
    const conn = state.connections.find((c) => c.id === id);
    write({
      ...state,
      connections: state.connections.filter((c) => c.id !== id),
      events: conn ? logEvent(state, "Connection removed", conn.name, "integration") : state.events,
    });
  },

  setIntegration(id: string, connected: boolean) {
    const state = read();
    const set = new Set(state.connectedIntegrations);
    const changed = connected ? !set.has(id) : set.has(id);
    if (connected) set.add(id);
    else set.delete(id);
    write({
      ...state,
      connectedIntegrations: [...set],
      events: changed
        ? logEvent(state, connected ? "Integration connected" : "Integration disconnected", id, "integration")
        : state.events,
    });
  },
};

let counter = 0;
function slug(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${(++counter + read().agents.length).toString(36)}`;
}

/** Convert a deployed blueprint (plus the connections the user attached) into a workspace agent. */
export function agentFromBlueprint(bp: AgentBlueprint, attachedConnections: string[]): Agent {
  const a = bp.agent;
  return {
    id: slug(a.name),
    name: a.name,
    role: a.role,
    status: "working",
    avatarHue: a.hue,
    initials: a.initials.slice(0, 2).toUpperCase(),
    description: a.brief,
    instructions: a.brief,
    schedule: `${a.schedule} → ${a.output}`,
    tools: ["Web browsing", ...attachedConnections],
    memory: [],
    tasksCompleted: 0,
    hoursSaved: 0,
    successRate: 0,
    createdAt: "just now",
    lastActive: "just now",
    currentActivity: "First run scheduled",
  };
}
