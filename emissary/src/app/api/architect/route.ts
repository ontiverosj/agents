import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BLUEPRINT_SCHEMA, blueprintFromPlaybook, type TeamBlueprint } from "@/lib/blueprint";

export const maxDuration = 120;

const ARCHITECT_SYSTEM = `You are the Emissary Architect. Emissary is an AI workforce platform:
businesses describe work in plain English and get teams of AI coworkers that browse the web,
collect data, monitor sites, fill forms, and deliver structured outputs — always with human
approval checkpoints before sensitive actions.

Given a description of a business (and optionally the work that eats their time), design an
AI team for it:

- One LEAD agent that owns the outcome. Its brief must say it decomposes the work, delegates
  subtasks to the sub-agents, and assembles their results into the final deliverable.
- Two to four SUB-AGENTS, each with one clear job (collect, monitor, analyze, draft, reconcile).
- The CONNECTIONS the team needs. Prefer the built-in integrationIds when one fits (gmail,
  gsheets, slack, zapier, hubspot, salesforce, airtable, notion). For anything else, name the
  service and whether it is reached over "mcp" (an MCP server), "rest" (a plain API), or
  "oauth" (a user-authorized app) — do not invent an integrationId for those.
- Approval rules phrased for this team's sensitive actions. Payments and personal-data access
  are always platform-blocked; include that.
- A concrete firstDeliverable promise (what lands on their desk, and when).

Be specific to the business described — name the actual sites, data, and deliverables implied
by it. Schedules should be realistic (mornings before work, nightly, every N minutes for
monitoring). Keep briefs to 1-2 sentences. Initials are 2 letters; hues are 0-360 and should
differ per agent.`;

/**
 * POST /api/architect — turn a plain-English business description into a
 * team blueprint (lead agent + sub-agents + required connections).
 *
 * Live mode when ANTHROPIC_API_KEY is set; otherwise falls back to the
 * playbook library so the product works out of the box (mode: "sample").
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (!description) {
    return NextResponse.json({ error: "description is required." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ blueprint: blueprintFromPlaybook(description) });
  }

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system: ARCHITECT_SYSTEM,
      output_config: { format: { type: "json_schema", schema: BLUEPRINT_SCHEMA } },
      messages: [{ role: "user", content: `Design an AI team for this business:\n\n${description}` }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ blueprint: blueprintFromPlaybook(description) });
    }

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("empty response");
    const blueprint = { mode: "live", ...JSON.parse(text.text) } as TeamBlueprint;
    return NextResponse.json({ blueprint });
  } catch (err) {
    console.error("architect: live mode failed, falling back to playbooks:", err);
    return NextResponse.json({ blueprint: blueprintFromPlaybook(description) });
  }
}
