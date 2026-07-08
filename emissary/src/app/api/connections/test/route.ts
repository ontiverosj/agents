import { NextResponse } from "next/server";

/**
 * POST /api/connections/test — reachability check for a user-added MCP server
 * or REST API endpoint. MVP scope: confirms the endpoint answers over HTTPS.
 * Production adds an MCP `initialize` handshake for kind=mcp, credential
 * validation, and SSRF protections (private-range blocking, allowlists).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ ok: false, error: "That doesn't look like a valid URL." }, { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    return NextResponse.json({ ok: false, error: "Connections must use HTTPS." }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "emissary-connection-check/0.1" },
    });
    clearTimeout(timer);
    // Any HTTP answer (even 401/405) proves the endpoint exists and speaks HTTP;
    // auth is exercised on the agent's first real call.
    return NextResponse.json({ ok: true, status: res.status });
  } catch {
    return NextResponse.json({ ok: false, error: "No response from that endpoint. Check the URL and try again." });
  }
}
