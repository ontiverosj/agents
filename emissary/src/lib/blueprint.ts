/**
 * Team blueprints — the Architect's output format.
 *
 * A blueprint describes a LEAD agent, the SUB-AGENTS it delegates to, and the
 * connections (MCP servers / REST APIs / OAuth apps) the team needs. It is
 * produced either by the live LLM architect (/api/architect with
 * ANTHROPIC_API_KEY set) or by the playbook fallback below (sample mode).
 */

import { teamPlaybooks, type TeamPlaybook } from "@/lib/data";

export interface BlueprintAgent {
  name: string;
  initials: string;
  hue: number;
  role: string;
  brief: string;
  schedule: string;
  output: string;
}

export interface BlueprintConnection {
  name: string;
  kind: "mcp" | "rest" | "oauth";
  purpose: string;
  /** matches a built-in integration id when one exists (e.g. "gmail") */
  integrationId?: string;
}

export interface TeamBlueprint {
  mode: "live" | "sample";
  teamName: string;
  headline: string;
  summary: string;
  lead: BlueprintAgent;
  subAgents: BlueprintAgent[];
  connections: BlueprintConnection[];
  approvalRules: string[];
  firstDeliverable: string;
}

/** JSON Schema the live architect must return (used with structured outputs). */
export const BLUEPRINT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["teamName", "headline", "summary", "lead", "subAgents", "connections", "approvalRules", "firstDeliverable"],
  properties: {
    teamName: { type: "string", description: "Short name for the team, e.g. 'Acme Deal Desk'" },
    headline: { type: "string", description: "One-line pitch for what this team does" },
    summary: { type: "string", description: "2-3 sentence summary of how the team works" },
    lead: { $ref: "#/$defs/agent" },
    subAgents: { type: "array", items: { $ref: "#/$defs/agent" } },
    connections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "kind", "purpose"],
        properties: {
          name: { type: "string" },
          kind: { type: "string", enum: ["mcp", "rest", "oauth"] },
          purpose: { type: "string" },
          integrationId: {
            type: "string",
            enum: ["gmail", "gsheets", "slack", "zapier", "hubspot", "salesforce", "airtable", "notion"],
          },
        },
      },
    },
    approvalRules: { type: "array", items: { type: "string" } },
    firstDeliverable: { type: "string" },
  },
  $defs: {
    agent: {
      type: "object",
      additionalProperties: false,
      required: ["name", "initials", "hue", "role", "brief", "schedule", "output"],
      properties: {
        name: { type: "string" },
        initials: { type: "string", description: "2 letters" },
        hue: { type: "integer", description: "avatar hue 0-360" },
        role: { type: "string" },
        brief: { type: "string", description: "1-2 sentence working brief" },
        schedule: { type: "string", description: "e.g. 'Daily 6 AM' or 'On demand'" },
        output: { type: "string", description: "the deliverable, e.g. 'Slack alert + comp sheet'" },
      },
    },
  },
} as const;

const CONNECTION_PURPOSES: Record<string, { kind: "mcp" | "rest" | "oauth"; purpose: string }> = {
  gmail: { kind: "oauth", purpose: "Draft digests and outreach; deliver summaries to your inbox" },
  gsheets: { kind: "oauth", purpose: "Write structured rows — the default data destination" },
  slack: { kind: "oauth", purpose: "Post alerts and approval requests where the team talks" },
  hubspot: { kind: "oauth", purpose: "Stage CRM records as drafts, publish on approval" },
  notion: { kind: "oauth", purpose: "Publish briefs and reports into the workspace" },
  airtable: { kind: "rest", purpose: "Write structured records to bases" },
  zapier: { kind: "rest", purpose: "Trigger downstream apps when tasks complete" },
  salesforce: { kind: "oauth", purpose: "Create and update leads with field-level controls" },
};

/** Deterministic fallback used when no LLM key is configured (sample mode). */
export function blueprintFromPlaybook(description: string): TeamBlueprint {
  const t = description.toLowerCase();
  let best: TeamPlaybook = teamPlaybooks[0];
  let bestScore = 0;
  for (const pb of teamPlaybooks) {
    const score = pb.keywords.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      best = pb;
      bestScore = score;
    }
  }

  const [leadAgent, ...rest] = best.agents;
  return {
    mode: "sample",
    teamName: best.business,
    headline: best.headline,
    summary: best.summary,
    lead: {
      name: leadAgent.name,
      initials: leadAgent.initials,
      hue: leadAgent.hue,
      role: `Lead — ${leadAgent.role}`,
      brief: `${leadAgent.brief} Coordinates the team: breaks the work into subtasks, delegates to sub-agents, and assembles their results into the final deliverable.`,
      schedule: leadAgent.schedule,
      output: leadAgent.output,
    },
    subAgents: rest.map((a) => ({
      name: a.name,
      initials: a.initials,
      hue: a.hue,
      role: a.role,
      brief: a.brief,
      schedule: a.schedule,
      output: a.output,
    })),
    connections: best.integrations.map((id) => ({
      name: id === "gsheets" ? "Google Sheets" : id.charAt(0).toUpperCase() + id.slice(1),
      integrationId: id,
      ...(CONNECTION_PURPOSES[id] ?? { kind: "rest" as const, purpose: "Used by this team" }),
    })),
    approvalRules: [
      "Sending emails or messages pauses for approval",
      "Submitting web forms pauses for approval",
      "Publishing CRM or database records pauses for approval",
      "Payment details and personal data access are blocked (platform-enforced)",
    ],
    firstDeliverable: best.firstDeliverable,
  };
}
