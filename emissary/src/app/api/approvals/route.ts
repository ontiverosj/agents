import { NextResponse } from "next/server";
import { approvals } from "@/lib/data";

/** Pending approvals. Production: SELECT from `approvals` WHERE decided_at IS NULL. */
export async function GET() {
  return NextResponse.json({ approvals });
}

/**
 * Decide an approval. Production: record decision + actor in the audit log,
 * then signal the paused browser session to resume or abort the action.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.id || !["approve", "decline"].includes(body.decision)) {
    return NextResponse.json({ error: "id and decision ('approve' | 'decline') are required." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: body.id, decision: body.decision, decidedAt: new Date().toISOString() });
}
