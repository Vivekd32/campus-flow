import type { Metadata } from "next";
import { RolesPermissionsPage } from "@/components/settings/roles-permissions";
import { SettingsShell } from "@/components/settings/settings-shell";

export const metadata: Metadata = {
  title: "Roles & permissions | CampusFlow",
  description: "Review demonstration role descriptions and capabilities.",
};

export default function RolesRoute() {
  return (
    <SettingsShell active="roles">
      <RolesPermissionsPage />
    </SettingsShell>
  );
}
