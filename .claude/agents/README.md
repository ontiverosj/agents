# Agents

Claude Code subagents for the personal brand business. Each agent is a markdown
file with YAML frontmatter (`name`, `description`, optional `tools`/`model`) and
a system prompt in the body. Claude Code auto-discovers them from this folder.

## Available agents

| Agent | Role | Invoke when |
|-------|------|-------------|
| `executive` | **AI Chief of Staff / orchestrator.** Looks across inbox, calendar, tasks, pipeline, and money, decides what matters, and delegates the rest. | "What should I focus on today?", morning/EOD briefings, inbox triage, meeting prep, weekly review, or any "look across everything and tell me the next move" ask. |

## Using the executive agent

In a Claude Code session, just ask for what you need — Claude will route to the
`executive` agent automatically based on its `description`. Or invoke it
explicitly, e.g. *"Use the executive agent to give me my morning briefing."*

It inherits whatever tools the session has connected (Gmail, Google Calendar,
ClickUp, Apollo, Stripe, DocuSign, Gamma/Canva, Supermetrics, Google Drive,
etc.) plus the repo's own systems. It will tell you if something it needs isn't
connected.

### How it relates to the HTTP agents

This repo also exposes operational agents as HTTP endpoints (see `../../server.js`),
e.g. `POST /agent/scout` which fetches a lead from the Airtable "Acquisition
Leads" base. The `executive` agent treats those as the systems of record and
delegates to them (e.g. pulling lead context before prepping outreach).

## Adding a new agent

1. Create `your-agent.md` in this folder.
2. Add frontmatter with a clear `name` and an action-oriented `description`
   (the description is how Claude decides when to use it — be specific about
   the triggers).
3. Write the system prompt: who it is, operating principles, what it can touch,
   default playbooks, and any hard rules that require human approval.
4. Add a row to the table above.
