import { PageHeader, Panel } from "@/components/dashboard/widgets";
import { IntegrationGrid } from "@/components/dashboard/integration-grid";

export const metadata = { title: "Integrations" };

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect the tools your coworkers deliver into. Access is scoped per capability and revocable anytime."
      />
      <IntegrationGrid />
      <div className="mt-8">
        <Panel title="How access works">
          <ul className="space-y-3 px-5 py-4 text-sm text-ink-600">
            <li className="flex gap-2.5"><span className="text-violet-600">•</span> Each integration requests only the scopes it needs — an agent that drafts email never gets send permission unless you grant it.</li>
            <li className="flex gap-2.5"><span className="text-violet-600">•</span> Sensitive scopes (send, publish, submit) always route through approval checkpoints regardless of connection status.</li>
            <li className="flex gap-2.5"><span className="text-violet-600">•</span> Every integration call an agent makes is recorded in the audit log with the acting agent, task, and payload summary.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
