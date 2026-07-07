import { Suspense } from "react";
import { AgentWizard } from "@/components/dashboard/agent-wizard";

export const metadata = { title: "New agent" };

export default function NewAgentPage() {
  return (
    <Suspense>
      <AgentWizard />
    </Suspense>
  );
}
