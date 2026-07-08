import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BLUEPRINT_SCHEMA, blueprintFromPlaybook, type AgentBlueprint } from "@/lib/blueprint";

export const maxDuration = 120;

const ARCHITECT_SYSTEM = `You are the Emissary Architect. Emissary is an AI workforce platform:
businesses describe work in plain English and get AI coworkers that browse the web, collect
data, monitor sites, fill forms, and deliver structured outputs — always with human approval
checkpoints before sensitive actions.

Given a description of a business (and optionally the work that eats their time), design
ONE agent — the single highest-leverage coworker for that business:

- Pick the one job that saves them the most time, and write a brief for it: what to do,
  where to look, what "done" looks like (2-4 sentences, specific to their business).
- List the CONNECTIONS that agent needs. Prefer the built-in integrationIds when one fits
  (gmail, gsheets, slack, zapier, hubspot, salesforce, airtable, notion). For anything else,
  name the service and whether it is reached over "mcp" (an MCP server), "rest" (a plain
  API), or "oauth" (a user-authorized app) — do not invent an integrationId for those.
  Keep it to the 2-4 connections that matter.
- Approval rules phrased for this agent's sensitive actions. Payments and personal-data
  access are always platform-blocked; include that.
- A concrete firstDeliverable promise (what lands on their desk, and when).

Be specific to the business described — name the actual sites, data, and deliverables it
implies. Schedules should be realistic (mornings before work, nightly, every N minutes for
monitoring). Initials are 2 letters; hue is 0-360.`;

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
    const blueprint = { mode: "live", ...JSON.parse(text.text) } as AgentBlueprint;
    return NextResponse.json({ blueprint });
  } catch (err) {
    console.error("architect: live mode failed, falling back to playbooks:", err);
    return NextResponse.json({ blueprint: blueprintFromPlaybook(description) });
  }
}
