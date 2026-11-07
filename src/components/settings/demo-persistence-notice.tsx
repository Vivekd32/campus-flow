"use client";

import { AlertTriangle } from "lucide-react";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";

export function DemoPersistenceNotice() {
  const { isHydrated, error } = useWorkspaceDemo();
  if (!isHydrated || !error) return null;

  return (
    <div
      className="mb-5 flex items-start gap-2.5 rounded-control border border-danger/25 bg-danger-muted px-3.5 py-3 text-xs leading-5 text-foreground"
      role="alert"
    >
      <AlertTriangle
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-danger"
        size={15}
      />
      <p>Workspace data could not be loaded or saved: {error}</p>
    </div>
  );
}
