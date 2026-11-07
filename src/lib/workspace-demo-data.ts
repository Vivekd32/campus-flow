import type { DemoProject } from "@/lib/project-demo-data";
import type { DemoTask } from "@/lib/task-demo-data";
import type {
  DemoAnnouncement,
  DemoCalendarEvent,
  DemoNotification,
} from "@/lib/collaboration-demo-data";

export type WorkspaceSettings = {
  companyName: string;
  description: string;
  industry: string;
  website: string;
  companySize: string;
  timeZone: string;
  logoDataUrl: string;
};

export type DemoWorkspace = WorkspaceSettings & {
  id: string;
  name: string;
  color: string;
};

export type MemberRole =
  | "Owner"
  | "Admin"
  | "Project Manager"
  | "Member"
  | "Guest";
export type MemberStatus = "Active" | "Pending";

export type DemoMember = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
};

export type DemoActivityEvent = {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
  type:
    | "Project created"
    | "Project updated"
    | "Task assigned"
    | "Task created"
    | "Task completed"
    | "Task status changed"
    | "Team member invited"
    | "Comment added"
    | "Announcement posted";
  relatedTitle: string;
  projectId: string;
  href: string;
};

export type WorkspaceDemoState = {
  currentUser: { id: string; name: string; email: string } | null;
  activitiesByWorkspace: Record<string, DemoActivityEvent[]>;
  workspaces: DemoWorkspace[];
  activeWorkspaceId: string;
  membersByWorkspace: Record<string, DemoMember[]>;
  projectsByWorkspace: Record<string, DemoProject[]>;
  tasksByWorkspace: Record<string, DemoTask[]>;
  announcementsByWorkspace: Record<string, DemoAnnouncement[]>;
  eventsByWorkspace: Record<string, DemoCalendarEvent[]>;
  notificationsByWorkspace: Record<string, DemoNotification[]>;
};

export const memberRoles: MemberRole[] = [
  "Owner",
  "Admin",
  "Project Manager",
  "Member",
  "Guest",
];

export const departments = [
  "Leadership",
  "Design",
  "Engineering",
  "Product",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "People",
  "External",
];

export const companyIndustries = [
  "Technology",
  "Design & Creative",
  "Marketing & Advertising",
  "Professional Services",
  "Finance",
  "Healthcare",
  "Education & Training",
  "Retail & Consumer",
  "Other",
];

export const companySizes = [
  "1 employee",
  "2–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "501–1,000 employees",
  "1,001+ employees",
];

export const timeZones = [
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Central European Time" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Australia/Sydney", label: "Sydney" },
];
