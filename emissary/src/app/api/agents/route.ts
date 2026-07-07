import { NextResponse } from "next/server";
import { agents } from "@/lib/data";

/** List agents in the workspace. Production: SELECT from `agents` scoped by workspace_id. */
export async function GET() {
  return NextResponse.json({ agents });
}

/** Create an agent. Production: validate, INSERT, enqueue a first dry run. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.instructions) {
    return NextResponse.json({ error: "name and instructions are required." }, { status: 400 });
  }
  return NextResponse.json(
    {
      agent: {
        id: `ag_${body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        status: "idle",
        ...body,
        createdAt: new Date().toISOString(),
      },
    },
    { status: 201 },
  );
}
