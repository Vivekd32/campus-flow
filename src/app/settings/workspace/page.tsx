import type { Metadata } from "next";
import { SettingsShell } from "@/components/settings/settings-shell";
import { WorkspaceSettingsPage } from "@/components/settings/workspace-settings";

export const metadata: Metadata = {
  title: "Workspace settings | CampusFlow",
  description: "Manage company details and CampusFlow workspaces.",
};

export default function WorkspaceSettingsRoute() {
  return (
    <SettingsShell active="workspace">
      <WorkspaceSettingsPage />
    </SettingsShell>
  );
}
