import type { Metadata } from "next";
import { NotificationsPage } from "@/components/collaboration/notifications-page";

export const metadata: Metadata = {
  title: "Notifications | CampusFlow",
  description: "Workspace notifications and collaboration updates.",
};

export default function NotificationsRoute() {
  return <NotificationsPage />;
}
