import { PageHeader, Panel, ProgressBar } from "@/components/dashboard/widgets";

export const metadata = { title: "Billing" };

const invoices = [
  { id: "INV-2026-007", date: "Jul 1, 2026", amount: "$199.00", status: "Paid" },
  { id: "INV-2026-006", date: "Jun 1, 2026", amount: "$199.00", status: "Paid" },
  { id: "INV-2026-005", date: "May 1, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-004", date: "Apr 1, 2026", amount: "$49.00", status: "Paid" },
];

export default function BillingPage() {
  return (
    <>
      <PageHeader
        title="Billing"
        description="Plan, usage, and invoices. Payments are processed by Stripe."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title="Current plan">
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div>
                <p className="text-xl font-semibold text-ink-950">Team</p>
                <p className="mt-1 text-sm text-ink-500">$199/month · renews Aug 1, 2026 · 6 members</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50">
                  Manage in Stripe
                </button>
                <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
                  Upgrade to Enterprise
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="Usage this cycle">
            <div className="space-y-5 px-5 py-5">
              {[
                { label: "Task runs", used: 1418, limit: 2500 },
                { label: "Active agents", used: 4, limit: 20 },
                { label: "Team members", used: 6, limit: 10 },
              ].map((u) => (
                <div key={u.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-800">{u.label}</span>
                    <span className="text-ink-400">{u.used.toLocaleString()} / {u.limit.toLocaleString()}</span>
                  </div>
                  <ProgressBar value={(u.used / u.limit) * 100} />
                </div>
              ))}
              <p className="text-xs text-ink-400">
                When you reach a limit, running tasks finish and new ones queue — no silent overage billing.
              </p>
            </div>
          </Panel>

          <Panel title="Invoices">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-ink-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-5 py-3.5 font-medium text-ink-900">{inv.id}</td>
                    <td className="px-5 py-3.5 text-ink-500">{inv.date}</td>
                    <td className="px-5 py-3.5 text-ink-900">{inv.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{inv.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="cursor-pointer text-xs font-medium text-violet-600 hover:text-violet-800">PDF</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Payment method">
            <div className="px-5 py-5">
              <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
                <span className="flex h-9 w-12 items-center justify-center rounded-md bg-ink-950 text-[10px] font-bold tracking-wider text-white">
                  VISA
                </span>
                <div>
                  <p className="text-sm font-medium text-ink-900">•••• 4242</p>
                  <p className="text-xs text-ink-400">Expires 09/28</p>
                </div>
              </div>
              <button className="mt-3 text-xs font-medium text-violet-600 hover:text-violet-800">
                Update payment method
              </button>
            </div>
          </Panel>

          <Panel title="Value this month">
            <div className="px-5 py-5">
              <p className="text-3xl font-semibold tracking-tight text-ink-950">$4,600</p>
              <p className="mt-1 text-sm text-ink-500">estimated value of 92 hours saved vs. $199 plan cost</p>
              <p className="mt-4 rounded-xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800">
                23× return on subscription
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
