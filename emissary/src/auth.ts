import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Google sign-in via Auth.js. Configure in .env.local:
 *   AUTH_SECRET            — `openssl rand -base64 32`
 *   AUTH_GOOGLE_ID         — OAuth client ID from console.cloud.google.com
 *   AUTH_GOOGLE_SECRET     — OAuth client secret
 * Redirect URI to register: http://localhost:3000/api/auth/callback/google
 *
 * Without Google credentials the app still runs — the login page falls back
 * to demo entry and says so.
 */
export const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // Fallback secret keeps the demo runnable with zero config — set a real
  // AUTH_SECRET before exposing this to the internet.
  secret: process.env.AUTH_SECRET ?? "emissary-demo-secret-change-me",
  providers: googleConfigured ? [Google] : [],
});
