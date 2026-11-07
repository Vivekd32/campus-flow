import type { Metadata } from "next";
import { TasksPage } from "@/components/tasks/tasks-page";

export const metadata: Metadata = {
  title: "My Tasks | CampusFlow",
  description: "Plan, prioritize, and complete work across your CampusFlow projects.",
};

export default function TasksRoute() {
  return <TasksPage />;
}
