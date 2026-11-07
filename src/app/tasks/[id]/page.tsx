import { Suspense } from "react";
import type { Metadata } from "next";
import { TaskDetailsPage } from "@/components/tasks/task-details-page";

export const metadata: Metadata = {
  title: "Task details | CampusFlow",
  description: "Task details, checklists, comments, and activity.",
};

export default function TaskDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">
          Loading task…
        </div>
      }
    >
      <TaskDetailsForParam params={params} />
    </Suspense>
  );
}

async function TaskDetailsForParam({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TaskDetailsPage taskId={id} />;
}
