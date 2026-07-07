/**
 * Sample data layer for the Emissary MVP.
 *
 * In production this module is replaced by queries against PostgreSQL
 * (via Prisma or Supabase). Shapes here mirror the intended schema —
 * see README.md "Data model" for the table definitions.
 */

export type AgentStatus = "working" | "idle" | "needs_approval" | "paused";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  avatarHue: number; // deterministic avatar color
  initials: string;
  description: string;
  instructions: string;
  schedule: string;
  tools: string[];
  memory: MemoryEntry[];
  tasksCompleted: number;
  hoursSaved: number;
  successRate: number; // 0–100
  createdAt: string;
  lastActive: string;
  currentActivity?: string;
  browserSteps?: BrowserStep[];
}

export interface MemoryEntry {
  id: string;
  fact: string;
  source: "user" | "learned";
  updatedAt: string;
}

export interface BrowserStep {
  time: string;
  action: string;
  detail: string;
  url?: string;
}

export type TaskStatus = "queued" | "running" | "awaiting_approval" | "completed" | "failed";

export interface Task {
  id: string;
  agentId: string;
  title: string;
  status: TaskStatus;
  startedAt: string;
  finishedAt?: string;
  progress: number; // 0–100
  outputs: Output[];
  stepsDone: number;
  stepsTotal: number;
}

export interface Output {
  name: string;
  type: "csv" | "pdf" | "sheet" | "report" | "email" | "crm";
  size: string;
}

export interface Approval {
  id: string;
  agentId: string;
  taskId: string;
  action: string;
  detail: string;
  risk: "low" | "medium" | "high";
  requestedAt: string;
}

export interface AuditEvent {
  id: string;
  time: string;
  actor: string; // agent or user name
  actorType: "agent" | "user" | "system";
  event: string;
  detail: string;
  category: "task" | "approval" | "auth" | "settings" | "integration" | "billing";
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  outputs: string[];
  estMinutesSaved: number;
  popular?: boolean;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  connected: boolean;
  scopes?: string[];
}

/* ------------------------------------------------------------------ */
/* Agents                                                              */
/* ------------------------------------------------------------------ */

export const agents: Agent[] = [
  {
    id: "lead-hunter",
    name: "Lead Hunter",
    role: "Sales prospecting",
    status: "working",
    avatarHue: 258,
    initials: "LH",
    description: "Finds and qualifies B2B prospects that match your ICP, enriches them, and stages CRM updates for approval.",
    instructions:
      "Every weekday at 7:00 AM, search for SaaS companies in North America with 50–500 employees that posted a job for a RevOps or Sales Ops role in the last 14 days. For each match: visit the company website, confirm the product category, find the VP Sales or Head of Revenue on the team page or LinkedIn, and record name, title, company, domain, employee count, and evidence link. Score each lead 1–5 against the ICP notes in memory. Deliver a CSV ranked by score and stage new contacts in HubSpot as drafts — never publish CRM changes without approval.",
    schedule: "Weekdays · 7:00 AM ET",
    tools: ["Web browsing", "HubSpot (draft mode)", "Google Sheets", "Gmail drafts"],
    memory: [
      { id: "m1", fact: "ICP: B2B SaaS, 50–500 employees, US/Canada, sales team ≥ 5 reps.", source: "user", updatedAt: "2026-06-28" },
      { id: "m2", fact: "Exclude agencies, resellers, and companies already in HubSpot.", source: "user", updatedAt: "2026-06-28" },
      { id: "m3", fact: "Companies hiring RevOps convert 2.3× better than average for us.", source: "learned", updatedAt: "2026-07-03" },
      { id: "m4", fact: "Jake prefers evidence links to careers pages over LinkedIn posts.", source: "learned", updatedAt: "2026-07-05" },
    ],
    tasksCompleted: 148,
    hoursSaved: 217,
    successRate: 96,
    createdAt: "2026-05-12",
    lastActive: "2 min ago",
    currentActivity: "Scanning careers pages for RevOps roles (34 of 120 companies)",
    browserSteps: [
      { time: "09:41:02", action: "Navigate", detail: "Opened careers page", url: "northwindtech.com/careers" },
      { time: "09:41:09", action: "Extract", detail: "Found 'Revenue Operations Manager' posted 6 days ago" },
      { time: "09:41:15", action: "Navigate", detail: "Opened team page", url: "northwindtech.com/about" },
      { time: "09:41:24", action: "Extract", detail: "Identified VP Sales: Dana Whitfield" },
      { time: "09:41:31", action: "Record", detail: "Lead scored 5/5 — matches ICP, added to draft list" },
    ],
  },
  {
    id: "market-monitor",
    name: "Market Monitor",
    role: "Competitive intelligence",
    status: "needs_approval",
    avatarHue: 205,
    initials: "MM",
    description: "Tracks competitor pricing pages, plan changes, and public announcements. Alerts you the day something moves.",
    instructions:
      "Check the pricing pages of the six competitors listed in memory every morning. Capture a screenshot, extract plan names, prices, and limits, and diff against yesterday's snapshot. If anything changed, write a short change summary with a side-by-side comparison and post it to #competitive-intel in Slack. Compile a weekly digest PDF every Friday. Ask for approval before posting to Slack channels other than #competitive-intel.",
    schedule: "Daily · 6:30 AM ET",
    tools: ["Web browsing", "Screenshot capture", "Slack", "PDF reports"],
    memory: [
      { id: "m1", fact: "Competitors: Acme Automation, Parallel Labs, BrightOps, Quill AI, Statecraft, Hoverline.", source: "user", updatedAt: "2026-06-15" },
      { id: "m2", fact: "Parallel Labs changes prices most often — usually on Tuesdays.", source: "learned", updatedAt: "2026-06-30" },
      { id: "m3", fact: "Team cares most about per-seat price changes and usage caps.", source: "user", updatedAt: "2026-06-15" },
    ],
    tasksCompleted: 212,
    hoursSaved: 106,
    successRate: 99,
    createdAt: "2026-04-02",
    lastActive: "18 min ago",
    currentActivity: "Waiting for approval: post pricing-change alert to #general",
    browserSteps: [
      { time: "06:31:40", action: "Navigate", detail: "Opened pricing page", url: "parallellabs.io/pricing" },
      { time: "06:31:52", action: "Screenshot", detail: "Captured full-page snapshot" },
      { time: "06:32:04", action: "Extract", detail: "Growth plan: $79 → $89/seat (+12.7%)" },
      { time: "06:32:11", action: "Diff", detail: "2 changes vs. snapshot from Jul 6" },
      { time: "06:32:20", action: "Compose", detail: "Drafted change alert for Slack — pending approval" },
    ],
  },
  {
    id: "ops-assistant",
    name: "Ops Assistant",
    role: "Operations & reporting",
    status: "working",
    avatarHue: 152,
    initials: "OA",
    description: "Logs into vendor portals, pulls recurring numbers, reconciles them, and keeps the ops spreadsheet current.",
    instructions:
      "Every Monday at 8:00 AM, log into the three vendor portals (credentials in the vault) and download last week's shipment and invoice data. Reconcile invoice totals against the shipment log; flag any line that differs by more than 2%. Update the 'Weekly Ops' Google Sheet, then email a summary to ops@ with flagged discrepancies at the top. Never change payment or bank details anywhere — if a portal asks, stop and request approval.",
    schedule: "Weekly · Mon 8:00 AM ET",
    tools: ["Web browsing", "Credential vault", "Google Sheets", "Gmail"],
    memory: [
      { id: "m1", fact: "Vendor portals: FreightWise, PackPoint, Meridian Supply.", source: "user", updatedAt: "2026-05-20" },
      { id: "m2", fact: "PackPoint's export button is under 'Reports → Legacy export'.", source: "learned", updatedAt: "2026-06-09" },
      { id: "m3", fact: "Discrepancies over $500 should also be flagged to finance@.", source: "user", updatedAt: "2026-06-22" },
    ],
    tasksCompleted: 64,
    hoursSaved: 96,
    successRate: 94,
    createdAt: "2026-05-01",
    lastActive: "6 min ago",
    currentActivity: "Reconciling FreightWise invoices (week of Jun 29)",
    browserSteps: [
      { time: "08:02:11", action: "Login", detail: "Authenticated to FreightWise via vault credential" },
      { time: "08:02:30", action: "Navigate", detail: "Opened invoices dashboard", url: "portal.freightwise.com/invoices" },
      { time: "08:02:48", action: "Download", detail: "Exported invoices_2026-06-29.csv (42 rows)" },
      { time: "08:03:15", action: "Reconcile", detail: "Comparing against shipment log — 1 discrepancy found ($612)" },
    ],
  },
  {
    id: "talent-scout",
    name: "Talent Scout",
    role: "Recruiting research",
    status: "idle",
    avatarHue: 24,
    initials: "TS",
    description: "Sources engineering candidates from job boards and public profiles, summarizes fit, and drafts outreach.",
    instructions:
      "When given a role brief, search public profiles and job boards for candidates matching the required skills and location. Summarize each candidate in three bullet points with a fit score and evidence links. Draft (but never send) a personalized outreach email for the top 10. Deliver everything as a spreadsheet plus email drafts in Gmail.",
    schedule: "On demand",
    tools: ["Web browsing", "Google Sheets", "Gmail drafts"],
    memory: [
      { id: "m1", fact: "Current search: Senior backend engineer, Python + Postgres, EU timezone.", source: "user", updatedAt: "2026-07-01" },
      { id: "m2", fact: "Outreach tone: short, specific, no buzzwords. Mention one real project.", source: "user", updatedAt: "2026-07-01" },
    ],
    tasksCompleted: 31,
    hoursSaved: 58,
    successRate: 91,
    createdAt: "2026-06-10",
    lastActive: "3 hours ago",
  },
];

export function getAgent(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export const tasks: Task[] = [
  {
    id: "t-1041",
    agentId: "lead-hunter",
    title: "Daily prospect run — Jul 7",
    status: "running",
    startedAt: "Today, 7:00 AM",
    progress: 62,
    stepsDone: 74,
    stepsTotal: 120,
    outputs: [],
  },
  {
    id: "t-1040",
    agentId: "market-monitor",
    title: "Daily pricing sweep — Jul 7",
    status: "awaiting_approval",
    startedAt: "Today, 6:30 AM",
    progress: 92,
    stepsDone: 11,
    stepsTotal: 12,
    outputs: [{ name: "pricing-diff-jul-07.pdf", type: "pdf", size: "184 KB" }],
  },
  {
    id: "t-1039",
    agentId: "ops-assistant",
    title: "Weekly portal reconciliation — week of Jun 29",
    status: "running",
    startedAt: "Today, 8:00 AM",
    progress: 45,
    stepsDone: 9,
    stepsTotal: 20,
    outputs: [],
  },
  {
    id: "t-1038",
    agentId: "lead-hunter",
    title: "Daily prospect run — Jul 4",
    status: "completed",
    startedAt: "Jul 4, 7:00 AM",
    finishedAt: "Jul 4, 7:38 AM",
    progress: 100,
    stepsDone: 118,
    stepsTotal: 118,
    outputs: [
      { name: "qualified-leads-jul-04.csv", type: "csv", size: "31 KB" },
      { name: "hubspot-draft-contacts (23)", type: "crm", size: "—" },
    ],
  },
  {
    id: "t-1037",
    agentId: "market-monitor",
    title: "Weekly competitive digest — week 27",
    status: "completed",
    startedAt: "Jul 3, 4:00 PM",
    finishedAt: "Jul 3, 4:21 PM",
    progress: 100,
    stepsDone: 34,
    stepsTotal: 34,
    outputs: [
      { name: "competitive-digest-w27.pdf", type: "pdf", size: "1.2 MB" },
      { name: "Posted to #competitive-intel", type: "email", size: "—" },
    ],
  },
  {
    id: "t-1036",
    agentId: "talent-scout",
    title: "Source senior backend engineers (EU)",
    status: "completed",
    startedAt: "Jul 2, 10:15 AM",
    finishedAt: "Jul 2, 11:52 AM",
    progress: 100,
    stepsDone: 87,
    stepsTotal: 87,
    outputs: [
      { name: "candidates-backend-eu.xlsx", type: "sheet", size: "58 KB" },
      { name: "10 outreach drafts in Gmail", type: "email", size: "—" },
    ],
  },
  {
    id: "t-1035",
    agentId: "ops-assistant",
    title: "Weekly portal reconciliation — week of Jun 22",
    status: "completed",
    startedAt: "Jun 30, 8:00 AM",
    finishedAt: "Jun 30, 8:44 AM",
    progress: 100,
    stepsDone: 20,
    stepsTotal: 20,
    outputs: [
      { name: "ops-reconciliation-jun-22.csv", type: "csv", size: "44 KB" },
      { name: "Summary email to ops@", type: "email", size: "—" },
    ],
  },
  {
    id: "t-1034",
    agentId: "market-monitor",
    title: "Daily pricing sweep — Jul 3",
    status: "failed",
    startedAt: "Jul 3, 6:30 AM",
    finishedAt: "Jul 3, 6:41 AM",
    progress: 68,
    stepsDone: 8,
    stepsTotal: 12,
    outputs: [{ name: "error-report-jul-03.pdf", type: "report", size: "92 KB" }],
  },
  {
    id: "t-1033",
    agentId: "lead-hunter",
    title: "Enrich Q2 webinar signups",
    status: "queued",
    startedAt: "Scheduled for today, 2:00 PM",
    progress: 0,
    stepsDone: 0,
    stepsTotal: 45,
    outputs: [],
  },
];

export function tasksForAgent(agentId: string): Task[] {
  return tasks.filter((t) => t.agentId === agentId);
}

/* ------------------------------------------------------------------ */
/* Approvals                                                           */
/* ------------------------------------------------------------------ */

export const approvals: Approval[] = [
  {
    id: "ap-301",
    agentId: "market-monitor",
    taskId: "t-1040",
    action: "Post message to #general in Slack",
    detail:
      "\"Heads up — Parallel Labs raised their Growth plan from $79 to $89/seat this morning (+12.7%). Full diff attached.\" Posting outside the approved #competitive-intel channel requires sign-off.",
    risk: "medium",
    requestedAt: "Today, 6:32 AM",
  },
  {
    id: "ap-300",
    agentId: "lead-hunter",
    taskId: "t-1041",
    action: "Publish 23 draft contacts to HubSpot",
    detail: "23 new contacts from the Jul 4 run passed review scoring ≥ 4/5. Publishing moves them from draft to live CRM records visible to the sales team.",
    risk: "low",
    requestedAt: "Today, 7:35 AM",
  },
  {
    id: "ap-299",
    agentId: "ops-assistant",
    taskId: "t-1039",
    action: "Submit support form on FreightWise portal",
    detail: "Invoice #FW-88213 differs from the shipment log by $612. The agent drafted a dispute form. Submitting a form on a vendor portal requires approval per your rules.",
    risk: "high",
    requestedAt: "Today, 8:12 AM",
  },
];

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

export const auditEvents: AuditEvent[] = [
  { id: "e-9120", time: "Today, 8:12 AM", actor: "Ops Assistant", actorType: "agent", event: "Approval requested", detail: "Submit dispute form on FreightWise (invoice #FW-88213)", category: "approval" },
  { id: "e-9119", time: "Today, 8:03 AM", actor: "Ops Assistant", actorType: "agent", event: "Credential used", detail: "FreightWise portal login via vault (read-only scope)", category: "task" },
  { id: "e-9118", time: "Today, 7:35 AM", actor: "Lead Hunter", actorType: "agent", event: "Approval requested", detail: "Publish 23 draft contacts to HubSpot", category: "approval" },
  { id: "e-9117", time: "Today, 7:00 AM", actor: "Scheduler", actorType: "system", event: "Task started", detail: "Daily prospect run — Jul 7 (Lead Hunter)", category: "task" },
  { id: "e-9116", time: "Today, 6:32 AM", actor: "Market Monitor", actorType: "agent", event: "Approval requested", detail: "Post pricing alert to #general in Slack", category: "approval" },
  { id: "e-9115", time: "Today, 6:31 AM", actor: "Market Monitor", actorType: "agent", event: "Change detected", detail: "Parallel Labs Growth plan $79 → $89/seat", category: "task" },
  { id: "e-9114", time: "Yesterday, 4:10 PM", actor: "Jake Ontiveros", actorType: "user", event: "Memory edited", detail: "Updated ICP note on Lead Hunter", category: "settings" },
  { id: "e-9113", time: "Yesterday, 2:22 PM", actor: "Jake Ontiveros", actorType: "user", event: "Approval granted", detail: "Send weekly digest to #competitive-intel (Market Monitor)", category: "approval" },
  { id: "e-9112", time: "Yesterday, 11:04 AM", actor: "Priya Shah", actorType: "user", event: "Member invited", detail: "invited sam@everflow.co as Editor", category: "auth" },
  { id: "e-9111", time: "Jul 4, 7:38 AM", actor: "Lead Hunter", actorType: "agent", event: "Task completed", detail: "Daily prospect run — 23 qualified leads, CSV delivered", category: "task" },
  { id: "e-9110", time: "Jul 3, 6:41 AM", actor: "Market Monitor", actorType: "agent", event: "Task failed", detail: "Hoverline pricing page timed out after 3 retries — error report generated", category: "task" },
  { id: "e-9109", time: "Jul 3, 9:15 AM", actor: "Jake Ontiveros", actorType: "user", event: "Integration connected", detail: "Google Sheets connected with spreadsheet scope", category: "integration" },
  { id: "e-9108", time: "Jul 1, 10:00 AM", actor: "System", actorType: "system", event: "Invoice paid", detail: "Team plan — $199.00 (Stripe)", category: "billing" },
];

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export const templates: Template[] = [
  { id: "tpl-lead-gen", name: "Lead list builder", category: "Sales", description: "Finds companies matching your ICP, identifies decision-makers, and delivers an enriched, scored CSV.", outputs: ["CSV", "CRM drafts"], estMinutesSaved: 240, popular: true },
  { id: "tpl-crm-enrich", name: "CRM enrichment", category: "Sales", description: "Visits each company's website to fill missing CRM fields — size, industry, tech stack, recent news.", outputs: ["CRM updates", "Change log"], estMinutesSaved: 180 },
  { id: "tpl-price-watch", name: "Competitor price watch", category: "Ecommerce", description: "Monitors competitor product and pricing pages daily; alerts on any change with a visual diff.", outputs: ["Slack alert", "PDF diff"], estMinutesSaved: 120, popular: true },
  { id: "tpl-review-digest", name: "Review & rating digest", category: "Ecommerce", description: "Collects new reviews across marketplaces weekly and summarizes themes, ratings, and urgent complaints.", outputs: ["Report", "Spreadsheet"], estMinutesSaved: 90 },
  { id: "tpl-candidate-source", name: "Candidate sourcing", category: "Recruiting", description: "Sources candidates from job boards and public profiles, scores fit, and drafts personalized outreach.", outputs: ["Spreadsheet", "Email drafts"], estMinutesSaved: 300, popular: true },
  { id: "tpl-job-board-watch", name: "Job board monitor", category: "Recruiting", description: "Watches target companies' careers pages and alerts when roles matching your search appear or close.", outputs: ["Slack alert", "CSV"], estMinutesSaved: 60 },
  { id: "tpl-portal-pull", name: "Portal data collector", category: "Operations", description: "Logs into vendor or government portals on a schedule, downloads reports, and consolidates them into one sheet.", outputs: ["Google Sheet", "Email summary"], estMinutesSaved: 200, popular: true },
  { id: "tpl-invoice-recon", name: "Invoice reconciliation", category: "Finance", description: "Cross-checks invoices against orders or shipment logs and flags discrepancies above your threshold.", outputs: ["CSV", "Email summary"], estMinutesSaved: 150 },
  { id: "tpl-listing-watch", name: "Listing monitor", category: "Real estate", description: "Watches listing sites for properties matching your criteria and alerts you with comps the moment one appears.", outputs: ["Email alert", "Comp sheet"], estMinutesSaved: 180, popular: true },
  { id: "tpl-market-report", name: "Market research brief", category: "Research", description: "Researches a topic across the web, verifies claims across sources, and produces a cited structured report.", outputs: ["PDF report", "Source list"], estMinutesSaved: 360 },
  { id: "tpl-news-brief", name: "Industry news brief", category: "Research", description: "Scans your list of publications and competitors each morning and delivers a five-minute digest.", outputs: ["Email digest"], estMinutesSaved: 45 },
  { id: "tpl-form-filler", name: "Form filling assistant", category: "Operations", description: "Fills recurring web forms from a spreadsheet of records — with a mandatory approval step before each submit.", outputs: ["Submission log"], estMinutesSaved: 120 },
];

export const templateCategories = [
  "All",
  "Sales",
  "Recruiting",
  "Operations",
  "Real estate",
  "Ecommerce",
  "Finance",
  "Research",
];

/* ------------------------------------------------------------------ */
/* Integrations                                                        */
/* ------------------------------------------------------------------ */

export const integrations: Integration[] = [
  { id: "gmail", name: "Gmail", description: "Draft and send email, deliver digests, and file outputs to threads.", category: "Email", connected: true, scopes: ["Draft email", "Send with approval"] },
  { id: "gsheets", name: "Google Sheets", description: "Read and write spreadsheets — the default destination for structured data.", category: "Data", connected: true, scopes: ["Read", "Write"] },
  { id: "slack", name: "Slack", description: "Post alerts, digests, and approval requests to channels or DMs.", category: "Messaging", connected: true, scopes: ["Post to approved channels"] },
  { id: "zapier", name: "Zapier", description: "Trigger any of 6,000+ apps when a task completes or an event fires.", category: "Automation", connected: false },
  { id: "hubspot", name: "HubSpot", description: "Stage contact and company records as drafts; publish with approval.", category: "CRM", connected: true, scopes: ["Draft records", "Publish with approval"] },
  { id: "salesforce", name: "Salesforce", description: "Create and update leads, contacts, and opportunities with field-level controls.", category: "CRM", connected: false },
  { id: "airtable", name: "Airtable", description: "Write structured records to bases; ideal for research and monitoring output.", category: "Data", connected: false },
  { id: "notion", name: "Notion", description: "Publish reports and briefs directly into your team's workspace.", category: "Docs", connected: false },
];

/* ------------------------------------------------------------------ */
/* Marketing content                                                   */
/* ------------------------------------------------------------------ */

export interface UseCase {
  slug: string;
  name: string;
  headline: string;
  summary: string;
  painPoints: string[];
  workflow: { step: string; detail: string }[];
  outputs: string[];
  metric: { value: string; label: string };
  exampleAgent: { name: string; instruction: string };
}

export const useCases: UseCase[] = [
  {
    slug: "sales",
    name: "Sales",
    headline: "Fill your pipeline while your reps sell",
    summary: "Emissary coworkers find leads that match your ICP, enrich company data from real websites, verify decision-makers, and stage CRM updates — every morning, before your team logs in.",
    painPoints: [
      "Reps spend 20–30% of their week on list building and data entry instead of selling",
      "Purchased lead lists go stale fast and miss buying signals like job postings",
      "CRM records decay — wrong titles, dead domains, missing firmographics",
    ],
    workflow: [
      { step: "Define the ICP once", detail: "Describe your ideal customer in plain English. The agent keeps it in editable memory." },
      { step: "Hunt on a schedule", detail: "Each morning the agent scans the web for companies showing buying signals — hiring, funding, tech changes." },
      { step: "Verify on the source", detail: "It opens each company's site, confirms fit, and finds the actual decision-maker with an evidence link." },
      { step: "Stage, don't spray", detail: "New records land in your CRM as drafts. You approve once; the pipeline updates itself." },
    ],
    outputs: ["Scored lead CSVs", "Enriched CRM records", "Outreach email drafts", "Weekly pipeline summary"],
    metric: { value: "11 hrs", label: "saved per rep, per week (typical)" },
    exampleAgent: {
      name: "Lead Hunter",
      instruction: "Find SaaS companies (50–500 employees) hiring RevOps roles, identify the VP Sales, score against my ICP, and stage the top matches in HubSpot for my approval.",
    },
  },
  {
    slug: "recruiting",
    name: "Recruiting",
    headline: "Source candidates around the clock",
    summary: "Emissary coworkers scan job boards and public profiles, summarize each candidate's fit with evidence, track competitor postings, and prepare outreach drafts your recruiters just review and send.",
    painPoints: [
      "Sourcing eats recruiter hours that should go to interviews and closing",
      "Great candidates get missed because searches only run when someone has time",
      "Outreach quality drops when recruiters batch-write at the end of the day",
    ],
    workflow: [
      { step: "Brief the role", detail: "Paste the job description and your must-haves. The agent turns it into a search plan." },
      { step: "Source continuously", detail: "It sweeps job boards and public profiles on your schedule, not just when someone remembers." },
      { step: "Summarize with evidence", detail: "Each candidate gets a three-bullet fit summary with links to real work — no black-box scores." },
      { step: "Draft, never send", detail: "Personalized outreach lands as drafts in your inbox. A human sends every message." },
    ],
    outputs: ["Ranked candidate spreadsheets", "Fit summaries with citations", "Outreach drafts in Gmail", "Job board alerts"],
    metric: { value: "3×", label: "more qualified candidates surfaced per week" },
    exampleAgent: {
      name: "Talent Scout",
      instruction: "Source senior backend engineers (Python, Postgres, EU timezones), summarize each with evidence links, and draft personalized outreach for the top ten.",
    },
  },
  {
    slug: "operations",
    name: "Operations",
    headline: "The portal work runs itself",
    summary: "Emissary coworkers log into vendor and partner portals with vaulted credentials, collect recurring data, reconcile numbers against your records, and deliver the weekly report before your standup.",
    painPoints: [
      "Someone spends every Monday downloading the same reports from the same portals",
      "Manual reconciliation misses discrepancies until they become invoices disputes",
      "Portal logins shared in spreadsheets are a security incident waiting to happen",
    ],
    workflow: [
      { step: "Vault the credentials", detail: "Portal logins are encrypted and scoped. Agents use them; humans never see them in plaintext again." },
      { step: "Collect on schedule", detail: "The agent logs in, navigates to the right report, downloads it, and normalizes the data." },
      { step: "Reconcile automatically", detail: "It cross-checks totals against your source of truth and flags anything past your threshold." },
      { step: "Deliver the exceptions", detail: "You get the report with discrepancies on top — and any dispute form waits for your approval." },
    ],
    outputs: ["Consolidated Google Sheets", "Discrepancy reports", "Email summaries", "Audit-ready collection logs"],
    metric: { value: "6 hrs", label: "of weekly portal work eliminated per portal set" },
    exampleAgent: {
      name: "Ops Assistant",
      instruction: "Every Monday, log into our three vendor portals, pull last week's invoices, reconcile against the shipment log, and email the summary with discrepancies flagged.",
    },
  },
  {
    slug: "real-estate",
    name: "Real estate",
    headline: "Never miss a matching listing again",
    summary: "Emissary coworkers watch listing sites continuously, compare prices against comps, collect property details into structured sheets, and alert you the moment something matches your buy box.",
    painPoints: [
      "Good deals disappear in hours; manual checking happens once a day at best",
      "Comping every candidate property by hand doesn't scale past a few markets",
      "Listing data lives in screenshots and browser tabs, not structured records",
    ],
    workflow: [
      { step: "Define the buy box", detail: "Price range, markets, property types, deal criteria — in plain English, editable anytime." },
      { step: "Watch continuously", detail: "The agent sweeps listing sites on your schedule and diffs against what it has already seen." },
      { step: "Comp automatically", detail: "New matches get pulled into a sheet with recent comparables and price-per-square-foot math." },
      { step: "Alert instantly", detail: "You get an email or Slack ping with the listing, the comps, and the agent's notes — minutes after it posts." },
    ],
    outputs: ["Match alerts with comps", "Market tracking sheets", "Weekly market summaries", "Price-change history"],
    metric: { value: "< 30 min", label: "from listing posted to alert in your inbox" },
    exampleAgent: {
      name: "Deal Spotter",
      instruction: "Watch listings in Austin and San Antonio for duplexes under $450k, pull comps for each match, and alert me in Slack with the numbers.",
    },
  },
  {
    slug: "ecommerce",
    name: "Ecommerce",
    headline: "Watch every competitor, every day",
    summary: "Emissary coworkers monitor competitor prices, stock status, new reviews, and listing changes across marketplaces — and turn what they see into alerts and weekly digests your team acts on.",
    painPoints: [
      "Competitor repricing happens daily; manual spot-checks catch a fraction of it",
      "Review streams across marketplaces are too noisy to read, too costly to ignore",
      "Stock-outs and listing changes at competitors are missed revenue signals",
    ],
    workflow: [
      { step: "List what matters", detail: "Competitor products, marketplaces, and your alert thresholds — the agent remembers all of it." },
      { step: "Sweep daily", detail: "It visits each product page, captures price, stock, rating, and buy-box status, and diffs against yesterday." },
      { step: "Digest the reviews", detail: "New reviews get clustered into themes with representative quotes — praise, complaints, feature requests." },
      { step: "Alert on change", detail: "Price moves and stock-outs hit Slack immediately; everything else lands in the weekly digest." },
    ],
    outputs: ["Price-change alerts", "Stock and buy-box tracking sheets", "Review theme digests", "Weekly competitor PDFs"],
    metric: { value: "100%", label: "of competitor SKUs checked daily — not sampled" },
    exampleAgent: {
      name: "Shelf Watcher",
      instruction: "Track these 40 competitor SKUs daily across Amazon and their DTC sites. Alert #pricing on any change over 5%, and send a review digest every Friday.",
    },
  },
  {
    slug: "research",
    name: "Research",
    headline: "From question to cited report, overnight",
    summary: "Emissary coworkers collect data across the open web, cross-check claims between sources, and export structured, citation-backed reports — so analysts start from a draft, not a blank page.",
    painPoints: [
      "Web research is hours of tab-juggling that ends in messy notes",
      "Single-source facts sneak into decks because verification takes too long",
      "Research is unrepeatable — nobody can trace where a number came from",
    ],
    workflow: [
      { step: "Ask the question", detail: "Frame the research brief in plain English, with scope, depth, and format." },
      { step: "Sweep and collect", detail: "The agent searches broadly, opens sources, and extracts facts with URLs and access dates." },
      { step: "Cross-check claims", detail: "Key numbers are verified across independent sources; conflicts are flagged, not hidden." },
      { step: "Deliver structured output", detail: "You get a cited report plus the underlying data as a spreadsheet — every fact traceable." },
    ],
    outputs: ["Cited PDF reports", "Structured data exports", "Source bibliographies", "Conflict/confidence notes"],
    metric: { value: "1 day", label: "typical turnaround for a 30-source market brief" },
    exampleAgent: {
      name: "Field Analyst",
      instruction: "Map the top 20 vendors in warehouse robotics: funding, customers, pricing signals, and hiring trends. Cite every claim and export the data as a sheet.",
    },
  },
];

export function getUseCase(slug: string): UseCase | undefined {
  return useCases.find((u) => u.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

export interface Plan {
  name: string;
  price: string;
  period: string;
  blurb: string;
  cta: string;
  highlight?: boolean;
  features: string[];
}

export const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "Prove it works on your own tasks.",
    cta: "Start Free",
    features: [
      "1 AI coworker",
      "25 task runs / month",
      "Basic templates",
      "CSV & PDF outputs",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    blurb: "For operators automating real work.",
    cta: "Start Free Trial",
    highlight: true,
    features: [
      "5 AI coworkers",
      "500 task runs / month",
      "Scheduled recurring tasks",
      "Live browser preview",
      "Gmail, Sheets, Slack & Zapier",
      "All templates",
      "Email support",
    ],
  },
  {
    name: "Team",
    price: "$199",
    period: "per month",
    blurb: "For teams that need control and visibility.",
    cta: "Start Free Trial",
    features: [
      "20 AI coworkers",
      "2,500 task runs / month",
      "Roles & permissions",
      "Approval policies per team",
      "Full audit logs & task replay",
      "Shared template library",
      "HubSpot, Salesforce, Airtable, Notion",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual",
    blurb: "For security-conscious organizations at scale.",
    cta: "Talk to Sales",
    features: [
      "Unlimited coworkers & custom limits",
      "SSO / SAML & SCIM",
      "SOC 2-ready controls & DPA",
      "Private deployment options",
      "White-label for agencies",
      "Custom integrations & API SLAs",
      "Dedicated success engineer",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Customers & blog                                                    */
/* ------------------------------------------------------------------ */

export interface Customer {
  company: string;
  industry: string;
  quote: string;
  person: string;
  title: string;
  stat: { value: string; label: string };
}

export const customers: Customer[] = [
  {
    company: "Harborline Logistics",
    industry: "Freight & logistics",
    quote: "Our Monday portal ritual — three logins, six downloads, one very bored analyst — is gone. The reconciliation report is waiting when we walk in, and the audit log means finance actually trusts it.",
    person: "Maria Chen",
    title: "VP Operations",
    stat: { value: "26 hrs/mo", label: "of portal work eliminated" },
  },
  {
    company: "Copperfield Group",
    industry: "Real estate investment",
    quote: "We used to find deals a day late. Now an Emissary coworker watches four markets around the clock and pings us with comps attached. We've closed two properties we simply would not have seen.",
    person: "Devon Okafor",
    title: "Managing Partner",
    stat: { value: "2 deals", label: "sourced by agents in Q2" },
  },
  {
    company: "Lattice & Pine",
    industry: "DTC ecommerce",
    quote: "Every competitor SKU checked every day, price moves in Slack within the hour, and a review digest that our product team actually reads. It replaced a spreadsheet nobody kept up to date.",
    person: "Sofia Reyes",
    title: "Head of Growth",
    stat: { value: "100%", label: "SKU coverage, daily" },
  },
  {
    company: "Northgate Talent",
    industry: "Recruiting agency",
    quote: "Sourcing runs overnight and our recruiters start the day with ranked candidates and outreach drafts. The approval step matters — nothing goes out without a human reading it. Clients love that.",
    person: "James Park",
    title: "Founder",
    stat: { value: "3×", label: "sourcing throughput per recruiter" },
  },
  {
    company: "Meridian Research Co.",
    industry: "Market research",
    quote: "The citation discipline sold us. Every number in the report links to a source with an access date. Our analysts now start from a verified draft instead of forty open tabs.",
    person: "Anna Lindqvist",
    title: "Research Director",
    stat: { value: "60%", label: "faster report turnaround" },
  },
  {
    company: "Brightwater Advisors",
    industry: "Financial services",
    quote: "Compliance was the blocker for every automation tool we evaluated. Task replay and immutable audit logs got Emissary through our review in three weeks. Nothing else came close.",
    person: "Robert Ellison",
    title: "COO",
    stat: { value: "3 weeks", label: "to pass compliance review" },
  },
];

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  category: string;
  body: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "approval-checkpoints-design",
    title: "Why we made AI coworkers ask permission",
    excerpt: "Autonomy is easy to demo and hard to trust. Here's how approval checkpoints changed what our customers were willing to automate.",
    date: "Jul 2, 2026",
    readMinutes: 6,
    category: "Product",
    body: [
      "The fastest way to lose a customer's trust is to let an agent do something irreversible without asking. The fastest way to earn it is to show the agent asking first — every time it matters.",
      "When we started building Emissary, the industry default was full autonomy: give the agent a goal, let it run. Demos looked incredible. Deployments stalled. Teams would pilot an agent on research tasks and then refuse to connect their CRM, their email, or anything that touched a customer.",
      "The unlock wasn't smarter agents. It was a permission model. Every Emissary coworker classifies actions as safe or sensitive. Reading a public web page is safe. Sending an email, submitting a form, publishing a CRM record, or spending money is sensitive — and sensitive actions pause the task and request approval with full context: what the agent wants to do, why, and what happens if you say yes.",
      "The counterintuitive result: approval checkpoints increased automation. Once teams knew the agent would always stop before the point of no return, they connected more tools and delegated bigger tasks. Trust is the real bottleneck in this category, and trust is built at the checkpoint.",
      "Approvals also compound into an institutional record. Every request, grant, and denial is logged. Six months in, customers can answer 'why did this record change?' with a two-click audit trail instead of an archaeology project.",
    ],
  },
  {
    slug: "browser-agents-architecture",
    title: "Inside the sandbox: how Emissary agents browse the web safely",
    excerpt: "Isolated browser sessions, scoped credentials, and step-level logging — the architecture that lets agents do real work on real websites.",
    date: "Jun 24, 2026",
    readMinutes: 8,
    category: "Engineering",
    body: [
      "An AI coworker is only useful if it can touch the same web your team does — portals with logins, dashboards behind SSO, forms with CSRF tokens. That's also exactly why most companies are nervous about it. This post explains the architecture that makes it safe.",
      "Every task runs in an ephemeral, isolated browser session — a fresh container with its own browser profile, no shared cookies, and no access to other customers' sessions. When the task ends, the container is destroyed. Nothing persists except what the task explicitly saved as output.",
      "Credentials never pass through the model. When an agent needs to log into a portal, it requests the credential by reference; the vault injects it directly into the browser session. The model sees 'login succeeded', never the password. Credentials are AES-256-GCM encrypted at rest with per-workspace keys.",
      "Every step is recorded: navigation, clicks, extractions, downloads, and screenshots at each state change. This powers the live preview you watch in the dashboard, the task replay you scrub through afterward, and the audit log your compliance team exports.",
      "Sensitive actions — form submissions, purchases, messages — are intercepted at the browser layer, not left to model judgment. The session literally cannot complete a flagged action until an approval event arrives from a human with permission to grant it.",
    ],
  },
  {
    slug: "measure-agent-roi",
    title: "How to measure whether an AI coworker is actually working",
    excerpt: "Tasks completed is a vanity metric. Here are the four numbers our most successful customers track instead.",
    date: "Jun 12, 2026",
    readMinutes: 5,
    category: "Playbooks",
    body: [
      "Every automation platform shows you tasks completed. It's the easiest number to make go up and the least connected to value. After watching hundreds of teams deploy AI coworkers, four metrics separate the ones that renew from the ones that churn.",
      "First: hours returned. Estimate the manual time per task once, honestly, and multiply. Our dashboard does this automatically per agent. A coworker saving two hours a week is a nice-to-have; one saving two hours a day changes a role.",
      "Second: exception rate. What fraction of runs need a human to intervene beyond planned approvals? Below 5% means the instructions are solid. Above 20% means the task is underspecified — edit the agent's memory and instructions, don't abandon it.",
      "Third: time-to-signal. For monitoring agents, measure the gap between an event happening in the world and your team knowing. Competitor price change to Slack ping in under an hour is a structural advantage.",
      "Fourth: output adoption. Are the CSVs opened? Are draft emails sent? Deliverables nobody uses mean the format is wrong, not the work. Switch the output — same research as a Notion brief instead of a PDF — and adoption often triples.",
    ],
  },
  {
    slug: "plain-english-instructions",
    title: "Writing instructions your AI coworker won't misread",
    excerpt: "The difference between a flaky agent and a reliable one is usually the brief. Five patterns from thousands of production tasks.",
    date: "May 28, 2026",
    readMinutes: 7,
    category: "Playbooks",
    body: [
      "The best mental model for instructing an AI coworker: you're writing the onboarding doc for a capable new hire who will follow it literally. Vague briefs produce flaky work — from humans and agents alike.",
      "Pattern one: define done. 'Research competitors' never terminates cleanly. 'Deliver a CSV with one row per competitor covering price, plan names, and last change date' does.",
      "Pattern two: bound the scope. Give lists, not categories — six named competitors beats 'our main competitors'. Put the list in agent memory so you can edit it without rewriting the task.",
      "Pattern three: state the exceptions. What should the agent do when a page won't load, a number looks wrong, or a login fails? One sentence per case prevents most 3 a.m. surprises.",
      "Pattern four: mark the red lines. Never submit forms, never send messages, never change records without approval — say it explicitly. Emissary enforces these at the platform level too, but stating them in instructions makes the agent plan around them instead of hitting the guardrail.",
      "Pattern five: iterate in memory. When a run goes sideways, don't rewrite the whole brief. Add one corrective fact to memory — 'the export button is under Reports → Legacy' — and the fix persists across every future run.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

/* ------------------------------------------------------------------ */
/* Workspace analytics (dashboard overview)                            */
/* ------------------------------------------------------------------ */

export const workspaceStats = {
  hoursSavedThisMonth: 92,
  tasksCompletedThisMonth: 137,
  dataRowsCollected: 18420,
  successRate: 96.2,
  weeklyTaskCounts: [18, 24, 22, 31, 28, 35, 33], // last 7 weeks
  weeklyHoursSaved: [12, 15, 14, 19, 18, 23, 21],
};
