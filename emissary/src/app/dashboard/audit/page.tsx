import { PageHeader } from "@/components/dashboard/widgets";
import { AuditLog } from "@/components/dashboard/audit-log";

export const metadata = { title: "Audit logs" };

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit logs"
        description="An append-only record of every agent action, approval decision, credential use, and workspace change. Exportable as CSV or to your SIEM."
        action={
          <button className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-ink-50">
            Export CSV
          </button>
        }
      />
      <AuditLog />
    </>
  );
}
