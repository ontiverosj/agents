import { NextResponse } from "next/server";

/**
 * MVP auth stub. Accepts any well-formed credentials and grants access to
 * the demo workspace. Production swaps this for Supabase Auth (email/password
 * + Google OAuth) with a session cookie — see README "Authentication".
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (typeof body.password === "string" && body.password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    user: { email: body.email, workspace: body.company ?? "Demo Workspace", role: "owner" },
  });
}
