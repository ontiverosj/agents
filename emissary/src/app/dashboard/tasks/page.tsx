import { PageHeader, PrimaryButton } from "@/components/dashboard/widgets";
import { TaskBoard } from "@/components/dashboard/task-board";

export const metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks"
        description="Everything your coworkers are doing, waiting on, and have delivered."
        action={<PrimaryButton href="/dashboard/agents/new">+ New agent</PrimaryButton>}
      />
      <TaskBoard />
    </>
  );
}
