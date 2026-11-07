import type { DemoProject } from "@/lib/project-demo-data";
import {
  initialProjectsByWorkspace,
  projectPriorities,
} from "@/lib/project-demo-data";

export type TaskStatus = "To Do" | "In Progress" | "In Review" | "Done";
export type TaskLabel = "Bug" | "Feature" | "Improvement" | "Research" | "Design";

export type TaskSubtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type TaskChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type TaskComment = {
  id: string;
  author: string;
  authorId?: string;
  body: string;
  createdAt: string;
  editedAt?: string;
};

export type TaskActivity = {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
};

export type DemoTask = {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  priority: (typeof projectPriorities)[number];
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  labels: TaskLabel[];
  estimatedHours: number;
  subtasks: TaskSubtask[];
  checklist: TaskChecklistItem[];
  comments: TaskComment[];
  activity: TaskActivity[];
  createdAt: string;
};

export const taskStatuses: TaskStatus[] = [
  "To Do",
  "In Progress",
  "In Review",
  "Done",
];
export const taskLabels: TaskLabel[] = [
  "Bug",
  "Feature",
  "Improvement",
  "Research",
  "Design",
];

const taskTitles = [
  "Align on the project brief",
  "Review the latest feedback",
  "Prepare the next milestone",
  "Share an update with the team",
  "Refine the delivery plan",
  "Check the final details",
  "Capture stakeholder notes",
  "Publish the working draft",
  "Validate the release checklist",
  "Present recommendations",
  "Resolve open questions",
  "Confirm project handoff",
];

const taskDescriptions = [
  "Bring the right people together and agree on the next step.",
  "Review the latest input and capture decisions for the team.",
  "Prepare a clear update so the project can keep moving.",
  "Check the work against the agreed goals and quality bar.",
];

const seedCreatedAt = "2026-10-25T09:00:00.000Z";

function createSeedProjectTasks(
  workspaceId: string,
  project: DemoProject,
): DemoTask[] {
  return Array.from({ length: project.totalTasks }, (_, index) => {
    const isDone = index < project.completedTasks;
    const incompleteIndex = index - project.completedTasks;
    const statuses: TaskStatus[] = ["To Do", "In Progress", "In Review"];
    const status = isDone ? "Done" : statuses[incompleteIndex % statuses.length];
    const day = 2 + (index % 25);
    const dueDate =
      !isDone && index % 8 === 0
        ? "2026-10-28"
        : `2026-11-${String(day).padStart(2, "0")}`;
    const startDate = `2026-10-${String(1 + (index % 25)).padStart(2, "0")}`;
    const title = taskTitles[index % taskTitles.length];
    const assigneeId =
      project.memberIds.length > 0
        ? project.memberIds[index % project.memberIds.length]
        : project.managerId;

    return {
      id: `task-${project.id}-${index + 1}`,
      workspaceId,
      projectId: project.id,
      title: index < taskTitles.length ? title : `${title} ${index + 1}`,
      description: taskDescriptions[index % taskDescriptions.length],
      assigneeId,
      priority: projectPriorities[index % projectPriorities.length],
      status,
      startDate,
      dueDate,
      labels: [
        (["Feature", "Design", "Improvement", "Research", "Bug"] as const)[
          index % 5
        ],
      ],
      estimatedHours: 2 + (index % 7),
      subtasks: [
        {
          id: `subtask-${project.id}-${index + 1}-1`,
          title: "Review the requirements",
          completed: isDone,
        },
        {
          id: `subtask-${project.id}-${index + 1}-2`,
          title: "Share findings with the team",
          completed: isDone,
        },
      ],
      checklist: [
        {
          id: `check-${project.id}-${index + 1}-1`,
          text: "Confirm the acceptance criteria",
          completed: isDone,
        },
      ],
      comments:
        index === 0
          ? [
              {
                id: `comment-${project.id}-seed`,
                author: "Jordan Lee",
                body: "I’ve added the latest context. Please share any blockers here.",
                createdAt: "2026-10-30T14:30:00.000Z",
              },
            ]
          : [],
      activity: [
        {
          id: `activity-${project.id}-${index + 1}`,
          actor: "Jordan Lee",
          action: isDone ? "completed the task" : "added the task",
          createdAt: seedCreatedAt,
        },
      ],
      createdAt: seedCreatedAt,
    };
  });
}

export function createSeedTasks(
  projectsByWorkspace: Record<string, DemoProject[]>,
): Record<string, DemoTask[]> {
  return Object.fromEntries(
    Object.entries(projectsByWorkspace).map(([workspaceId, projects]) => [
      workspaceId,
      projects.flatMap((project) =>
        createSeedProjectTasks(workspaceId, project),
      ),
    ]),
  );
}

export const initialTasksByWorkspace = createSeedTasks(
  initialProjectsByWorkspace,
);
