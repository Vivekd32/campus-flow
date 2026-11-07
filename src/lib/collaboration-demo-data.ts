export type AnnouncementPriority = "Normal" | "Important" | "Urgent";

export type DemoAnnouncement = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  priority: AnnouncementPriority;
};

export type CalendarEventType = "Meeting" | "General";

export type DemoCalendarEvent = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  type: CalendarEventType;
  startsAt: string;
  endsAt: string;
  projectId: string;
  attendeeIds: string[];
  location: string;
  createdAt: string;
};

export type NotificationType =
  | "Task assigned"
  | "Task deadline approaching"
  | "Task completed"
  | "Mention received"
  | "New comment"
  | "Project update"
  | "Team announcement"
  | "Team member invited";

export type DemoNotification = {
  id: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  href: string;
};

export const notificationTypes: NotificationType[] = [
  "Task assigned",
  "Task deadline approaching",
  "Task completed",
  "Mention received",
  "New comment",
  "Project update",
  "Team announcement",
  "Team member invited",
];

export const initialAnnouncementsByWorkspace: Record<
  string,
  DemoAnnouncement[]
> = {
  "northstar-studio": [
    {
      id: "announcement-northstar-q4",
      workspaceId: "northstar-studio",
      title: "Q4 planning is underway",
      description:
        "Please add your team priorities to the roadmap before Friday. We will review milestones together in our planning session.",
      authorId: "member-jordan",
      createdAt: "2026-10-28T15:00:00.000Z",
      updatedAt: "2026-10-28T15:00:00.000Z",
      priority: "Important",
    },
  ],
  "acme-product": [],
  "fieldwork-agency": [],
};

export const initialEventsByWorkspace: Record<string, DemoCalendarEvent[]> = {
  "northstar-studio": [
    {
      id: "event-northstar-weekly",
      workspaceId: "northstar-studio",
      title: "Weekly design sync",
      description: "Review project progress and unblock the next milestones.",
      type: "Meeting",
      startsAt: "2026-11-03T10:00:00.000",
      endsAt: "2026-11-03T10:45:00.000",
      projectId: "website-refresh",
      attendeeIds: ["member-jordan", "member-maya", "member-alex"],
      location: "Design room · Video call",
      createdAt: "2026-10-28T15:00:00.000Z",
    },
    {
      id: "event-northstar-planning",
      workspaceId: "northstar-studio",
      title: "Launch readiness review",
      description: "Confirm owners and deliverables for the product launch.",
      type: "Meeting",
      startsAt: "2026-11-06T13:30:00.000",
      endsAt: "2026-11-06T14:15:00.000",
      projectId: "product-launch",
      attendeeIds: ["member-alex", "member-sam"],
      location: "https://meet.example.com/launch-review",
      createdAt: "2026-10-29T13:00:00.000Z",
    },
  ],
  "acme-product": [],
  "fieldwork-agency": [],
};

export const initialNotificationsByWorkspace: Record<
  string,
  DemoNotification[]
> = {
  "northstar-studio": [
    {
      id: "notification-seed-mention",
      workspaceId: "northstar-studio",
      type: "Mention received",
      title: "Maya Chen mentioned you",
      description: "Can you review the latest website direction?",
      createdAt: "2026-10-31T14:30:00.000Z",
      read: false,
      href: "/projects/website-refresh",
    },
    {
      id: "notification-seed-deadline",
      workspaceId: "northstar-studio",
      type: "Task deadline approaching",
      title: "A task is due soon",
      description: "Review the latest feedback · Website refresh",
      createdAt: "2026-10-31T09:00:00.000Z",
      read: false,
      href: "/tasks",
    },
  ],
  "acme-product": [],
  "fieldwork-agency": [],
};
