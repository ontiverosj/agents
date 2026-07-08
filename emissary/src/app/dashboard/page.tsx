import Link from "next/link";
import { AgentAvatar } from "@/components/ui";
import {
  PageHeader,
  PrimaryButton,
  StatCard,
  Panel,
  TaskStatusBadge,
  ProgressBar,
} from "@/components/dashboard/widgets";
import { ApprovalList } from "@/components/dashboard/approval-list";
import { RosterPanel } from "@/components/dashboard/roster-panel";
import { agents, tasks, approvals, workspaceStats } from "@/lib/data";

export default function DashboardOverview() {
  const running = tasks.filter((t) => t.status === "running" || t.status === "awaiting_approval");
  const recent = tasks.filter((t) => t.status === "completed").slice(0, 3);

  return (
    <>
      <PageHeader
        title="Good morning, Jake"
        description="3 coworkers active · 2 tasks running · 3 approvals waiting for you"
        action={<PrimaryButton href="/dashboard/agents/new">+ New agent</PrimaryButton>}
      />

      <Link
        href="/dashboard/assistant"
        className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-600 to-ink-900 p-5 shadow-card-lg transition hover:opacity-95"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
          <svg viewBox="0 0 16 16" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M8 1.5l1.4 3.6a2 2 0 001.5 1.5L14.5 8l-3.6 1.4a2 2 0 00-1.5 1.5L8 14.5 6.6 10.9a2 2 0 00-1.5-1.5L1.5 8l3.6-1.4a2 2 0 001.5-1.5L8 1.5z" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white">Need more hands? Ask the Assistant.</span>
          <span className="block truncate text-xs text-white/70">
            Describe your business — it builds a pre-connected AI team and schedules the first runs.
          </span>
        </span>
        <span className="hidden shrink-0 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ink-950 sm:block">
          Build a team
        </span>
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Hours saved this month"
          value={`${workspaceStats.hoursSavedThisMonth}`}
          sub="≈ $4,600 at $50/hr loaded cost"
          trend={workspaceStats.weeklyHoursSaved}
        />
        <StatCard
          label="Tasks completed"
          value={`${workspaceStats.tasksCompletedThisMonth}`}
          sub="This month, across 4 agents"
          trend={workspaceStats.weeklyTaskCounts}
        />
        <StatCard
          label="Data rows collected"
          value={workspaceStats.dataRowsCollected.toLocaleString()}
          sub="Delivered to Sheets, CSV & CRM"
        />
        <StatCard
          label="Success rate"
          value={`${workspaceStats.successRate}%`}
          sub="Runs finishing without human rescue"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel
            title="Approvals waiting on you"
            action={
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {approvals.length} pending
              </span>
            }
          >
            <ApprovalList initial={approvals} />
          </Panel>

          <Panel
            title="Running now"
            action={<Link href="/dashboard/tasks" className="text-xs font-medium text-violet-600 hover:text-violet-800">All tasks →</Link>}
          >
            <ul className="divide-y divide-ink-100">
              {running.map((t) => {
                const agent = agents.find((a) => a.id === t.agentId);
                return (
                  <li key={t.id} className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {agent && <AgentAvatar initials={agent.initials} hue={agent.avatarHue} size="sm" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/dashboard/agents/${t.agentId}`} className="truncate text-sm font-medium text-ink-950 hover:text-violet-700">
                            {t.title}
                          </Link>
                          <TaskStatusBadge status={t.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-ink-400">
                          {agent?.name} · started {t.startedAt} · step {t.stepsDone} of {t.stepsTotal}
                        </p>
                      </div>
                      <span className="hidden text-xs font-medium text-ink-500 sm:block">{t.progress}%</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={t.progress} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <RosterPanel />

          <Panel title="Recently delivered">
            <ul className="divide-y divide-ink-100">
              {recent.map((t) => (
                <li key={t.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-ink-950">{t.title}</p>
                  <p className="mt-0.5 text-xs text-ink-400">Finished {t.finishedAt}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.outputs.map((o) => (
                      <span key={o.name} className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] text-ink-600">
                        {o.name}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
