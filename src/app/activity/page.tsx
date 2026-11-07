import type { Metadata } from "next";
import { ActivityPage } from "@/components/collaboration/activity-page";

export const metadata: Metadata = {
  title: "Team activity | CampusFlow",
  description: "Team activity, announcements, and collaboration updates.",
};

export default function ActivityRoute() {
  return <ActivityPage />;
}
