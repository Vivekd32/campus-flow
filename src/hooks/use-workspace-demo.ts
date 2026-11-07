"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getWorkspaceDemoServerSnapshot,
  getWorkspaceDemoHydrationServerSnapshot,
  getWorkspaceDemoHydrationSnapshot,
  getWorkspaceDemoErrorSnapshot,
  getWorkspaceDemoSnapshot,
  hydrateWorkspaceDemo,
  subscribeToWorkspaceDemo,
} from "@/lib/workspace-demo-store";

export function useWorkspaceDemo() {
  const snapshot = useSyncExternalStore(
    subscribeToWorkspaceDemo,
    getWorkspaceDemoSnapshot,
    getWorkspaceDemoServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToWorkspaceDemo,
    getWorkspaceDemoHydrationSnapshot,
    getWorkspaceDemoHydrationServerSnapshot,
  );
  const error = useSyncExternalStore(
    subscribeToWorkspaceDemo,
    getWorkspaceDemoErrorSnapshot,
    () => null,
  );

  useEffect(() => {
    hydrateWorkspaceDemo();
  }, []);

  return {
    ...snapshot,
    isHydrated,
    error,
    activeWorkspace:
      snapshot.workspaces.find(
        (workspace) => workspace.id === snapshot.activeWorkspaceId,
      ) ?? snapshot.workspaces[0],
    members: snapshot.membersByWorkspace[snapshot.activeWorkspaceId] ?? [],
    activities:
      snapshot.activitiesByWorkspace[snapshot.activeWorkspaceId] ?? [],
    projects: snapshot.projectsByWorkspace[snapshot.activeWorkspaceId] ?? [],
    tasks: snapshot.tasksByWorkspace[snapshot.activeWorkspaceId] ?? [],
    announcements:
      snapshot.announcementsByWorkspace[snapshot.activeWorkspaceId] ?? [],
    events: snapshot.eventsByWorkspace[snapshot.activeWorkspaceId] ?? [],
    notifications:
      snapshot.notificationsByWorkspace[snapshot.activeWorkspaceId] ?? [],
  };
}
