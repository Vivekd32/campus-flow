import type { Metadata } from "next";
import { ProjectsPage } from "@/components/projects/projects-page";

export const metadata: Metadata = {
  title: "Projects | CampusFlow",
  description: "Plan, manage, and deliver work across your CampusFlow workspace.",
};

export default function ProjectsRoute() {
  return <ProjectsPage />;
}
