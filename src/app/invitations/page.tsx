import type { Metadata } from "next";
import { WorkspaceInvitationsPage } from "@/components/workspace-invitations-page";

export const metadata: Metadata = {
  title: "Workspace invitations | CampusFlow",
  description: "Review invitations to join a CampusFlow workspace.",
};

export default function InvitationsRoute() {
  return <WorkspaceInvitationsPage />;
}
