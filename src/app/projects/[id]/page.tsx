import { Suspense } from "react";
import type { Metadata } from "next";
import { ProjectDetailsPage } from "@/components/projects/project-details-page";

export const metadata: Metadata = {
  title: "Project details | CampusFlow",
  description: "Project overview, delivery progress, and team activity.",
};

export default function ProjectDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">
          Loading project…
        </div>
      }
    >
      <ProjectDetailsForParam params={params} />
    </Suspense>
  );
}

async function ProjectDetailsForParam({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetailsPage projectId={id} />;
}
