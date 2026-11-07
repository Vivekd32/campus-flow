import type { Metadata } from "next";
import { CalendarPage } from "@/components/calendar/calendar-page";

export const metadata: Metadata = {
  title: "Calendar | CampusFlow",
  description: "Workspace meetings, project milestones, and task deadlines.",
};

export default function CalendarRoute() {
  return <CalendarPage />;
}
