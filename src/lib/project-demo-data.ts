export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed";
export type ProjectPriority = "Low" | "Medium" | "High" | "Urgent";
export type ProjectCategory =
  | "Design"
  | "Engineering"
  | "Marketing"
  | "Operations"
  | "Product"
  | "Research"
  | "Other";
export type ProjectColor =
  | "violet"
  | "indigo"
  | "blue"
  | "emerald"
  | "amber"
  | "rose";

export type ProjectActivity = {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
};

export type ProjectComment = {
  id: string;
  author: string;
  authorId?: string;
  body: string;
  createdAt: string;
  editedAt?: string;
};

export type DemoProject = {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  startDate: string;
  dueDate: string;
  managerId: string;
  memberIds: string[];
  color: ProjectColor;
  completedTasks: number;
  totalTasks: number;
  archived: boolean;
  createdAt: string;
  activity: ProjectActivity[];
  comments?: ProjectComment[];
};

const createdAt = "2026-10-01T09:00:00.000Z";

function activity(actor: string, action: string, offset: number): ProjectActivity {
  return {
    id: `${actor.toLowerCase().replaceAll(" ", "-")}-${offset}`,
    actor,
    action,
    createdAt: new Date(Date.UTC(2026, 9, 29 - offset, 9, 0)).toISOString(),
  };
}

export const initialProjectsByWorkspace: Record<string, DemoProject[]> = {
  "northstar-studio": [
    {
      id: "website-refresh",
      name: "Website refresh",
      description: "A more useful, more memorable home for the brand.",
      category: "Design",
      status: "Active",
      priority: "High",
      progress: 72,
      startDate: "2026-09-10",
      dueDate: "2026-11-12",
      managerId: "member-alex",
      memberIds: ["member-maya", "member-sam", "member-jordan"],
      color: "violet",
      completedTasks: 18,
      totalTasks: 25,
      archived: false,
      createdAt,
      activity: [
        activity("Maya Chen", "completed Homepage wireframes", 0),
        activity("Alex Morgan", "updated the project timeline", 1),
        activity("Jordan Lee", "shared a project update", 2),
      ],
    },
    {
      id: "product-launch",
      name: "Product launch",
      description: "Make the next release feel like a big first step.",
      category: "Product",
      status: "Active",
      priority: "Urgent",
      progress: 48,
      startDate: "2026-09-22",
      dueDate: "2026-11-18",
      managerId: "member-alex",
      memberIds: ["member-alex", "member-sam", "member-maya"],
      color: "blue",
      completedTasks: 12,
      totalTasks: 25,
      archived: false,
      createdAt: "2026-09-20T09:00:00.000Z",
      activity: [
        activity("Alex Morgan", "created the launch workstream", 1),
        activity("Sam Rivera", "shared the go-to-market brief", 2),
      ],
    },
    {
      id: "customer-research",
      name: "Customer research",
      description: "Turn customer conversations into clear direction.",
      category: "Research",
      status: "On Hold",
      priority: "High",
      progress: 34,
      startDate: "2026-09-02",
      dueDate: "2026-10-28",
      managerId: "member-maya",
      memberIds: ["member-maya", "member-jordan"],
      color: "amber",
      completedTasks: 8,
      totalTasks: 24,
      archived: false,
      createdAt: "2026-08-26T09:00:00.000Z",
      activity: [
        activity("Jordan Lee", "added interview notes", 1),
        activity("Maya Chen", "paused the research sprint", 2),
      ],
    },
    {
      id: "brand-guidelines",
      name: "Brand guidelines",
      description: "A shared source of truth for the Northstar identity.",
      category: "Design",
      status: "Completed",
      priority: "Medium",
      progress: 100,
      startDate: "2026-07-14",
      dueDate: "2026-10-22",
      managerId: "member-maya",
      memberIds: ["member-maya", "member-sam"],
      color: "emerald",
      completedTasks: 16,
      totalTasks: 16,
      archived: false,
      createdAt: "2026-07-10T09:00:00.000Z",
      activity: [
        activity("Maya Chen", "marked Brand guidelines complete", 2),
      ],
    },
  ],
  "acme-product": [
    {
      id: "customer-portal",
      name: "Customer portal",
      description: "A simpler, self-serve experience for every customer.",
      category: "Engineering",
      status: "Active",
      priority: "High",
      progress: 56,
      startDate: "2026-10-05",
      dueDate: "2026-12-03",
      managerId: "acme-alex",
      memberIds: ["acme-maya", "acme-sam", "acme-jordan"],
      color: "indigo",
      completedTasks: 14,
      totalTasks: 25,
      archived: false,
      createdAt: "2026-10-02T09:00:00.000Z",
      activity: [
        activity("Alex Morgan", "created the customer portal project", 0),
        activity("Maya Chen", "shared early interaction concepts", 1),
      ],
    },
    {
      id: "q4-roadmap",
      name: "Q4 product roadmap",
      description: "Align the next quarter around customer impact.",
      category: "Product",
      status: "Planning",
      priority: "Medium",
      progress: 12,
      startDate: "2026-11-05",
      dueDate: "2026-12-15",
      managerId: "acme-alex",
      memberIds: ["acme-alex", "acme-jordan"],
      color: "rose",
      completedTasks: 2,
      totalTasks: 18,
      archived: false,
      createdAt: "2026-10-29T09:00:00.000Z",
      activity: [activity("Jordan Lee", "added initial roadmap themes", 0)],
    },
  ],
  "fieldwork-agency": [
    {
      id: "campaign-launch",
      name: "Spring campaign launch",
      description: "A coordinated campaign across brand, content, and media.",
      category: "Marketing",
      status: "Active",
      priority: "High",
      progress: 64,
      startDate: "2026-09-25",
      dueDate: "2026-11-25",
      managerId: "fieldwork-sam",
      memberIds: ["fieldwork-sam", "fieldwork-jordan"],
      color: "amber",
      completedTasks: 16,
      totalTasks: 25,
      archived: false,
      createdAt: "2026-09-21T09:00:00.000Z",
      activity: [
        activity("Sam Rivera", "approved the campaign direction", 0),
      ],
    },
  ],
};

export const projectStatuses: ProjectStatus[] = [
  "Planning",
  "Active",
  "On Hold",
  "Completed",
];
export const projectPriorities: ProjectPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];
export const projectCategories: ProjectCategory[] = [
  "Design",
  "Engineering",
  "Marketing",
  "Operations",
  "Product",
  "Research",
  "Other",
];
export const projectColors: ProjectColor[] = [
  "violet",
  "indigo",
  "blue",
  "emerald",
  "amber",
  "rose",
];

export function subscribeToDateChange(listener: () => void) {
  const now = new Date();
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeout = window.setTimeout(listener, nextDay.getTime() - now.getTime());
  return () => window.clearTimeout(timeout);
}

export function getTodaySnapshot() {
  return new Date().toISOString().slice(0, 10);
}

export function getTodayServerSnapshot() {
  return "";
}
