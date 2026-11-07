import type { LucideIcon } from "lucide-react";
import {
  AlignStartVertical,
  Activity,
  Archive,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  CircleCheck,
  FileText,
  FolderKanban,
  Settings2,
  UsersRound,
} from "lucide-react";
import type { DemoProject } from "@/lib/project-demo-data";

export type DashboardProject = DemoProject;

export type SidebarItem = {
  label: string;
  icon: LucideIcon;
  target: string;
};

export const sidebarItems: SidebarItem[] = [
  { label: "Overview", icon: AlignStartVertical, target: "overview" },
  { label: "My Tasks", icon: CircleCheck, target: "deadlines" },
  { label: "Projects", icon: FolderKanban, target: "projects" },
  { label: "Activity", icon: Activity, target: "activity" },
  { label: "Teams", icon: UsersRound, target: "activity" },
  { label: "Calendar", icon: CalendarDays, target: "deadlines" },
  { label: "Documents", icon: FileText, target: "projects" },
  { label: "Reports", icon: ChartNoAxesCombined, target: "analytics" },
  { label: "Settings", icon: Settings2, target: "settings" },
];

export const dashboardStats = [
  {
    label: "Total projects",
    icon: FolderKanban,
    style: "bg-primary/10 text-primary",
    trend: "neutral",
  },
  {
    label: "Active projects",
    icon: BriefcaseBusiness,
    style: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    trend: "neutral",
  },
  {
    label: "Completed projects",
    icon: CircleCheck,
    style: "bg-success-muted text-success",
    trend: "up",
  },
  {
    label: "Overdue projects",
    icon: Archive,
    style: "bg-warning-muted text-warning",
    trend: "attention",
  },
];
