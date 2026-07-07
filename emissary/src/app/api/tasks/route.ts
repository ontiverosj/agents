import { NextResponse } from "next/server";
import { tasks } from "@/lib/data";

/** List task runs. Production: SELECT from `tasks` with status filters + pagination. */
export async function GET(request: Request) {
  const status = new URL(request.url).searchParams.get("status");
  const filtered = status ? tasks.filter((t) => t.status === status) : tasks;
  return NextResponse.json({ tasks: filtered });
}
