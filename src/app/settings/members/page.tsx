import type { Metadata } from "next";
import { MembersManagementPage } from "@/components/settings/members-management";
import { SettingsShell } from "@/components/settings/settings-shell";

export const metadata: Metadata = {
  title: "Members | CampusFlow",
  description: "Manage demo workspace members and pending invitations.",
};

export default function MembersRoute() {
  return (
    <SettingsShell active="members">
      <MembersManagementPage />
    </SettingsShell>
  );
}
