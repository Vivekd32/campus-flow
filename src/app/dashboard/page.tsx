import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard | CampusFlow",
  description: "See projects, team activity, and upcoming work in CampusFlow.",
};

export default function DashboardPage() {
  return <DashboardShell />;
}
