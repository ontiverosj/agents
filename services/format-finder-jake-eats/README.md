# Format Finder for Jake Eats

Isolated Streamable HTTP bridge to `@format-finder/mcp-server@1.3.0`. This service does not start or change the existing Everflow application.

## Render

Use the `format-finder-jake-eats` branch of this repository.

- Name: `format-finder-for-jake-eats`
- Runtime: Node
- Build: `npm ci --prefix services/format-finder-jake-eats --ignore-scripts`
- Start: `node services/format-finder-jake-eats/server.mjs`
- Health: `/health`
- MCP: `/mcp`

Set secrets only in Render Environment:

- `FORMAT_FINDER_API_KEY`: your Format Finder API key.
- `JAKE_EATS_CONNECT_PASSWORD`: a separate unique password of at least 16 characters, used when linking ChatGPT. Do not reuse your Format Finder password or API key.
- `MCP_SIGNING_KEY`: random secret of at least 32 characters; supplied during provisioning. Rotating it revokes all connections.

`RENDER_EXTERNAL_URL` supplies the service origin automatically. `PUBLIC_BASE_URL` is optional for a custom hostname. `PORT` defaults to 3000 for local development.

The landing page and health endpoint remain available before setup; OAuth registration and tool calls fail closed until secrets are present. No credentials are returned to the browser or stored in Git. OAuth tokens grant access to the configured single owner's Format Finder account and credits.

## Connect ChatGPT

In an eligible account, enable Developer mode in Settings → Security and login. Add a connection in Plugins named **Format Finder for Jake Eats**, with the service's `/mcp` URL and OAuth authentication. Dynamic client registration is supported; leave manually entered client credentials blank. Sign in using `JAKE_EATS_CONNECT_PASSWORD` and consent to reading formats and generating paid content.

The redirect allowlist supports `https://chatgpt.com/connector_platform_oauth_redirect` and ChatGPT's callback-ID-specific `/connector/oauth/{id}` paths only. OAuth enforces S256 PKCE, exact resource and redirect binding, browser consent with CSRF protection, and single-use authorization codes. Tokens expire after 30 days; reconnect then. This first version intentionally does not issue refresh tokens. Token/client signatures survive service restarts as long as `MCP_SIGNING_KEY` is unchanged. An interrupted authorization flow must be restarted.

Test `list_formats` or `check_credits` after connecting; neither consumes generation credits. Package-listed generation costs: brainstorm 5, hooks 2, script 10, shot plan 5, caption 3 credits. Verify current provider terms before using paid generation. Paid tool calls are marked non-idempotent and are not automatically retried by the bridge.

## Known deployment limits

- The free Render plan may sleep or take time to start; do not assume it is reliable for unattended runs until tested.
- ChatGPT account permissions and scheduled-task support must be verified separately. Hosting an MCP server does not automatically attach it to an existing task.
- Reconnect after 30 days. This is not yet a maintenance-free integration.
- One service instance; short-lived consent requests/codes live in memory. New deployments interrupt an in-progress login, but existing access tokens remain valid.
- Authentication tests use a fake upstream and spend no credits. Actual Format Finder access cannot be validated until the owner adds the key.

## Development

Run `npm ci --ignore-scripts` then `npm test` in this directory. Tests cover blocked anonymous access, setup gating, redirect validation, CSRF, invalid password, PKCE, resource binding, authorization-code replay, tool filtering, tampered tokens, and token persistence across restart.

Primary references:
- https://www.npmjs.com/package/@format-finder/mcp-server
- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/deploy/connect-chatgpt
