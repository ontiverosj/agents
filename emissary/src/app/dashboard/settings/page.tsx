import { PageHeader, Panel } from "@/components/dashboard/widgets";

export const metadata = { title: "Settings" };

const members = [
  { name: "Jake Ontiveros", email: "jake@everflowacquisitions.com", role: "Owner" },
  { name: "Priya Shah", email: "priya@everflowacquisitions.com", role: "Admin" },
  { name: "Sam Torres", email: "sam@everflowacquisitions.com", role: "Editor" },
  { name: "Finance team", email: "finance@everflowacquisitions.com", role: "Viewer" },
];

const approvalPolicies = [
  { action: "Send email or message", policy: "Always require approval", enforced: true },
  { action: "Submit a web form", policy: "Always require approval", enforced: true },
  { action: "Publish CRM records", policy: "Require approval above 10 records", enforced: false },
  { action: "Enter payment details", policy: "Blocked for all agents", enforced: true },
  { action: "Access personal data fields", policy: "Require approval + log access", enforced: true },
];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Workspace, team, approval policies, and guardrails." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Workspace">
          <div className="space-y-4 px-5 py-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-800">Workspace name</label>
              <input
                defaultValue="Everflow Acquisitions"
                className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm text-ink-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-800">Default LLM provider</label>
              <select className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
                <option>Emissary managed (recommended)</option>
                <option>Anthropic — bring your own key</option>
                <option>OpenAI — bring your own key</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-800">Task artifact retention</label>
              <select className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
                <option>90 days (plan default)</option>
                <option>30 days</option>
                <option>1 year</option>
              </select>
            </div>
            <button className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
              Save changes
            </button>
          </div>
        </Panel>

        <Panel
          title="Team members"
          action={<button className="text-xs font-medium text-violet-600 hover:text-violet-800">+ Invite member</button>}
        >
          <ul className="divide-y divide-ink-100">
            {members.map((m) => (
              <li key={m.email} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-950">{m.name}</p>
                  <p className="truncate text-xs text-ink-400">{m.email}</p>
                </div>
                <select
                  defaultValue={m.role}
                  disabled={m.role === "Owner"}
                  className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 disabled:bg-ink-50 disabled:text-ink-400"
                >
                  <option>Owner</option>
                  <option>Admin</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Approval policies" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/70 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Sensitive action</th>
                  <th className="px-5 py-3 font-semibold">Policy</th>
                  <th className="px-5 py-3 font-semibold">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {approvalPolicies.map((p) => (
                  <tr key={p.action}>
                    <td className="px-5 py-3.5 font-medium text-ink-900">{p.action}</td>
                    <td className="px-5 py-3.5 text-ink-500">{p.policy}</td>
                    <td className="px-5 py-3.5">
                      {p.enforced ? (
                        <span className="rounded-full bg-ink-950 px-2.5 py-1 text-xs font-medium text-white">Platform-enforced</span>
                      ) : (
                        <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">Workspace rule</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-ink-100 px-5 py-4 text-xs text-ink-400">
            Platform-enforced guardrails cannot be disabled by any role — including Owner. Workspace rules can be tuned per agent by Admins.
          </p>
        </Panel>
      </div>
    </>
  );
}
