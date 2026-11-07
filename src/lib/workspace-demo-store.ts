"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { DemoProject } from "@/lib/project-demo-data";
import type { DemoTask } from "@/lib/task-demo-data";
import type {
  DemoAnnouncement,
  DemoCalendarEvent,
  DemoNotification,
} from "@/lib/collaboration-demo-data";
import type {
  DemoMember,
  DemoActivityEvent,
  DemoWorkspace,
  MemberRole,
  WorkspaceDemoState,
  WorkspaceSettings,
} from "@/lib/workspace-demo-data";

type TableName = keyof Database["public"]["Tables"];
type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
type WorkspaceRow = Row<"workspaces">;
type ProjectRow = Row<"projects">;
type TaskRow = Row<"tasks">;
type ProfileRow = Pick<Row<"profiles">, "id" | "full_name">;
type ActivityRow = Row<"activity_events">;
type CommentRow = Row<"task_comments">;
type ProjectCommentRow = Row<"project_comments">;
export type PendingWorkspaceInvitation =
  Database["public"]["Functions"]["list_my_pending_invitations"]["Returns"][number];

const activeWorkspacePreferenceKey = "campusflow-active-workspace-v1";
const emptyState: WorkspaceDemoState = {
  currentUser: null,
  activitiesByWorkspace: {},
  workspaces: [],
  activeWorkspaceId: "",
  membersByWorkspace: {},
  projectsByWorkspace: {},
  tasksByWorkspace: {},
  announcementsByWorkspace: {},
  eventsByWorkspace: {},
  notificationsByWorkspace: {},
};

let state = emptyState;
let hydrated = false;
let errorMessage: string | null = null;
let loadingPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
let authListener: ReturnType<
  ReturnType<typeof createClient>["auth"]["onAuthStateChange"]
>["data"]["subscription"] | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function setError(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = typeof error.message === "string" ? error.message : "";
    const code =
      "code" in error && typeof error.code === "string" ? error.code : "";
    const details =
      "details" in error && typeof error.details === "string"
        ? error.details
        : "";
    const hint =
      "hint" in error && typeof error.hint === "string" ? error.hint : "";
    errorMessage = [
      message || "The request could not be completed.",
      code && `Code: ${code}`,
      details && `Details: ${details}`,
      hint && `Hint: ${hint}`,
    ]
      .filter(Boolean)
      .join(" ");
  } else {
    errorMessage =
      error instanceof Error
        ? error.message
        : "The request could not be completed.";
  }
  emit();
}

function clearError() {
  errorMessage = null;
}

function throwOnError<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) throw result.error;
  return result.data;
}

function requireRow<T>(
  result: { data: T | null; error: { message: string } | null },
  message: string,
) {
  const row = throwOnError(result);
  if (!row) throw new Error(message);
  return row;
}

function toRole(role: string): MemberRole {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "project_manager":
      return "Project Manager";
    case "guest":
      return "Guest";
    default:
      return "Member";
  }
}

function toDatabaseRole(role: MemberRole) {
  return role.toLowerCase().replaceAll(" ", "_");
}

function getPayloadText(payload: Json, key: string) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return "";
  }
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function dateOnly(value: string | null) {
  return value?.slice(0, 10) ?? "";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function mapWorkspace(row: WorkspaceRow, logoDataUrl = ""): DemoWorkspace {
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    description: row.description,
    industry: row.industry,
    website: row.website,
    companySize: row.company_size,
    timeZone: row.time_zone,
    logoDataUrl,
    color: row.color,
  };
}

function mapProject(
  row: ProjectRow,
  members: Row<"project_members">[],
  tasks: TaskRow[],
  profiles: Map<string, ProfileRow>,
  comments: ProjectCommentRow[],
  activities: ActivityRow[],
): DemoProject {
  const projectTasks = tasks.filter((task) => task.project_id === row.id);
  const projectComments = comments.filter((comment) => comment.project_id === row.id);
  const projectActivities = activities.filter(
    (activity) =>
      activity.entity_type === "project" && activity.entity_id === row.id,
  );
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((task) => task.status === "Done").length;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as DemoProject["category"],
    status: row.status as DemoProject["status"],
    priority: row.priority as DemoProject["priority"],
    progress: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    startDate: dateOnly(row.start_date),
    dueDate: dateOnly(row.due_date),
    managerId: row.manager_id ?? "",
    memberIds: members
      .filter((member) => member.project_id === row.id)
      .map((member) => member.user_id),
    color: row.color as DemoProject["color"],
    completedTasks,
    totalTasks,
    archived: row.archived,
    createdAt: row.created_at,
    activity: projectActivities.map((activity) => ({
      id: activity.id,
      actor: profiles.get(activity.actor_id)?.full_name ?? "A teammate",
      action: getPayloadText(activity.payload, "action"),
      createdAt: activity.created_at,
    })),
    comments: projectComments.map((comment) => ({
      id: comment.id,
      author: profiles.get(comment.author_id)?.full_name ?? "A teammate",
      authorId: comment.author_id,
      body: comment.body,
      createdAt: comment.created_at,
      ...(comment.updated_at !== comment.created_at
        ? { editedAt: comment.updated_at }
        : {}),
    })),
  };
}

function mapTask(
  row: TaskRow,
  subtasks: Row<"task_subtasks">[],
  checklist: Row<"task_checklist_items">[],
  comments: CommentRow[],
  activities: ActivityRow[],
  profiles: Map<string, ProfileRow>,
): DemoTask {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    assigneeId: row.assignee_id ?? "",
    priority: row.priority as DemoTask["priority"],
    status: row.status as DemoTask["status"],
    startDate: dateOnly(row.start_date),
    dueDate: dateOnly(row.due_date),
    labels: row.labels as DemoTask["labels"],
    estimatedHours: Number(row.estimated_hours),
    subtasks: subtasks
      .filter((item) => item.task_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map(({ id, title, completed }) => ({ id, title, completed })),
    checklist: checklist
      .filter((item) => item.task_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map(({ id, text, completed }) => ({ id, text, completed })),
    comments: comments
      .filter((comment) => comment.task_id === row.id)
      .map((comment) => ({
        id: comment.id,
        author: profiles.get(comment.author_id)?.full_name ?? "A teammate",
        authorId: comment.author_id,
        body: comment.body,
        createdAt: comment.created_at,
        ...(comment.updated_at !== comment.created_at
          ? { editedAt: comment.updated_at }
          : {}),
      })),
    activity: activities
      .filter(
        (activity) =>
          activity.entity_type === "task" && activity.entity_id === row.id,
      )
      .map((activity) => ({
        id: activity.id,
        actor: profiles.get(activity.actor_id)?.full_name ?? "A teammate",
        action: getPayloadText(activity.payload, "action"),
        createdAt: activity.created_at,
      })),
    createdAt: row.created_at,
  };
}

function mapActivityEvent(
  row: ActivityRow,
  tasks: TaskRow[],
  profiles: Map<string, ProfileRow>,
): DemoActivityEvent {
  const action = getPayloadText(row.payload, "action");
  const relatedEntityId = getPayloadText(row.payload, "related_entity_id");
  const relatedEntityType = getPayloadText(row.payload, "related_entity_type");
  const taskId = row.entity_type === "task" ? row.entity_id ?? "" : "";
  const projectId =
    row.entity_type === "project"
      ? row.entity_id ?? ""
      : row.entity_type === "task"
        ? tasks.find((task) => task.id === taskId)?.project_id ?? ""
        : relatedEntityType === "task"
          ? tasks.find((task) => task.id === relatedEntityId)?.project_id ?? ""
          : relatedEntityType === "project"
            ? relatedEntityId
            : "";
  const targetId = relatedEntityId || row.entity_id || "";
  const href =
    row.entity_type === "task" || relatedEntityType === "task"
      ? `/tasks/${targetId}`
      : row.entity_type === "project" || relatedEntityType === "project"
        ? `/projects/${targetId}`
        : row.entity_type === "member"
          ? "/settings/members"
          : "/activity";
  const type: DemoActivityEvent["type"] =
    row.event_type === "project_created"
      ? "Project created"
      : row.event_type === "project_updated"
        ? "Project updated"
        : row.event_type === "task_created"
          ? "Task created"
          : row.event_type === "task_completed"
            ? "Task completed"
            : row.event_type === "task_updated" &&
                action.includes("assignee")
              ? "Task assigned"
              : row.event_type.startsWith("task_")
                ? "Task status changed"
                : row.event_type === "comment_added"
                  ? "Comment added"
                  : row.event_type === "announcement_posted"
                    ? "Announcement posted"
                        : row.event_type === "announcement_updated"
                          ? "Announcement posted"
                        : "Team member invited";

  return {
    id: row.id,
    actor: profiles.get(row.actor_id)?.full_name ?? "A teammate",
    action,
    createdAt: row.created_at,
    type,
    relatedTitle: getPayloadText(row.payload, "title"),
    projectId,
    href,
  };
}

async function loadWorkspaceData(client = createClient()) {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) {
    state = emptyState;
    throw new Error("Your session has ended. Sign in again to load workspace data.");
  }

  const workspaceRows = throwOnError(
    await client.from("workspaces").select("*").order("created_at"),
  ) ?? [];
  if (workspaceRows.length === 0) {
    state = {
      ...emptyState,
      currentUser: {
        id: user.id,
        name: user.email || "Team member",
        email: user.email || "",
      },
    };
    clearError();
    hydrated = true;
    emit();
    return;
  }

  const workspaceIds = workspaceRows.map((workspace) => workspace.id);
  const [
    memberRows,
    invitationRows,
    projectRows,
    projectMemberRows,
    taskRows,
    subtaskRows,
    checklistRows,
    taskCommentRows,
    projectCommentRows,
    announcementRows,
    activityRows,
    notificationRows,
    eventRows,
    attendeeRows,
  ] = await Promise.all([
    client.from("workspace_members").select("*").in("workspace_id", workspaceIds),
    client
      .from("workspace_invitations")
      .select("*")
      .in("workspace_id", workspaceIds)
      .eq("status", "pending"),
    client.from("projects").select("*").in("workspace_id", workspaceIds),
    client.from("project_members").select("*").in("workspace_id", workspaceIds),
    client.from("tasks").select("*").in("workspace_id", workspaceIds),
    client.from("task_subtasks").select("*").in("workspace_id", workspaceIds),
    client
      .from("task_checklist_items")
      .select("*")
      .in("workspace_id", workspaceIds),
    client.from("task_comments").select("*").in("workspace_id", workspaceIds),
    client.from("project_comments").select("*").in("workspace_id", workspaceIds),
    client.from("announcements").select("*").in("workspace_id", workspaceIds),
    client
      .from("activity_events")
      .select("*")
      .in("workspace_id", workspaceIds)
      .order("created_at", { ascending: false }),
    client
      .from("notifications")
      .select("*")
      .in("workspace_id", workspaceIds)
      .order("created_at", { ascending: false }),
    client.from("calendar_events").select("*").in("workspace_id", workspaceIds),
    client
      .from("calendar_event_attendees")
      .select("*")
      .in("workspace_id", workspaceIds),
  ]);
  const members = throwOnError(memberRows) ?? [];
  const invitations = throwOnError(invitationRows) ?? [];
  const projects = throwOnError(projectRows) ?? [];
  const projectMembers = throwOnError(projectMemberRows) ?? [];
  const tasks = throwOnError(taskRows) ?? [];
  const subtasks = throwOnError(subtaskRows) ?? [];
  const checklist = throwOnError(checklistRows) ?? [];
  const taskComments = throwOnError(taskCommentRows) ?? [];
  const projectComments = throwOnError(projectCommentRows) ?? [];
  const announcements = throwOnError(announcementRows) ?? [];
  const activities = throwOnError(activityRows) ?? [];
  const notifications = throwOnError(notificationRows) ?? [];
  const events = throwOnError(eventRows) ?? [];
  const attendees = throwOnError(attendeeRows) ?? [];

  const profileIds = new Set<string>([
    user.id,
    ...members.map((member) => member.user_id),
    ...activities.map((activity) => activity.actor_id),
    ...taskComments.map((comment) => comment.author_id),
    ...projectComments.map((comment) => comment.author_id),
    ...announcements.map((announcement) => announcement.author_id),
  ]);
  const profileRows = throwOnError(
    await client
      .from("profiles")
      .select("id, full_name")
      .in("id", [...profileIds]),
  ) ?? [];
  const profileMap = new Map(profileRows.map((profile) => [profile.id, profile]));
  const signedWorkspaceRows = await Promise.all(
    workspaceRows.map(async (workspace) => {
      if (!workspace.logo_path) return workspace;
      const { data, error } = await client.storage
        .from("workspace-documents")
        .createSignedUrl(workspace.logo_path, 3600);
      if (error) throw error;
      return { ...workspace, logo_path: data.signedUrl };
    }),
  );

  const workspaces = signedWorkspaceRows.map((workspace) =>
    mapWorkspace(workspace, workspace.logo_path),
  );
  const membersByWorkspace: WorkspaceDemoState["membersByWorkspace"] = {};
  const activitiesByWorkspace: WorkspaceDemoState["activitiesByWorkspace"] = {};
  const projectsByWorkspace: WorkspaceDemoState["projectsByWorkspace"] = {};
  const tasksByWorkspace: WorkspaceDemoState["tasksByWorkspace"] = {};
  const announcementsByWorkspace: WorkspaceDemoState["announcementsByWorkspace"] = {};
  const eventsByWorkspace: WorkspaceDemoState["eventsByWorkspace"] = {};
  const notificationsByWorkspace: WorkspaceDemoState["notificationsByWorkspace"] = {};

  for (const workspace of workspaces) {
    const workspaceId = workspace.id;
    activitiesByWorkspace[workspaceId] = activities
      .filter((activity) => activity.workspace_id === workspaceId)
      .map((activity) => mapActivityEvent(activity, tasks, profileMap));
    membersByWorkspace[workspaceId] = [
      ...members
        .filter((member) => member.workspace_id === workspaceId)
        .map((member) => ({
          id: member.user_id,
          name: profileMap.get(member.user_id)?.full_name || "Team member",
          email: member.user_id === user.id ? user.email || "" : "",
          department: member.department,
          role: toRole(member.role),
          status: "Active" as const,
          joinedAt: formatDate(member.created_at),
        })),
      ...invitations
        .filter((invite) => invite.workspace_id === workspaceId)
        .map((invite) => ({
          id: invite.id,
          name: invite.full_name,
          email: invite.email,
          department: invite.department,
          role: toRole(invite.role),
          status: "Pending" as const,
          joinedAt: "Invitation pending",
        })),
    ];
    const workspaceTasks = tasks.filter(
      (task) => task.workspace_id === workspaceId,
    );
    const workspaceProjects = projects.filter(
      (project) => project.workspace_id === workspaceId,
    );
    projectsByWorkspace[workspaceId] = workspaceProjects.map((project) =>
      mapProject(
        project,
        projectMembers.filter((member) => member.workspace_id === workspaceId),
        workspaceTasks,
        profileMap,
        projectComments.filter((comment) => comment.workspace_id === workspaceId),
        activities.filter((activity) => activity.workspace_id === workspaceId),
      ),
    );
    tasksByWorkspace[workspaceId] = workspaceTasks.map((task) =>
      mapTask(
        task,
        subtasks.filter((item) => item.workspace_id === workspaceId),
        checklist.filter((item) => item.workspace_id === workspaceId),
        taskComments.filter((comment) => comment.workspace_id === workspaceId),
        activities.filter((activity) => activity.workspace_id === workspaceId),
        profileMap,
      ),
    );
    announcementsByWorkspace[workspaceId] = announcements
      .filter((announcement) => announcement.workspace_id === workspaceId)
      .map((announcement) => ({
        id: announcement.id,
        workspaceId,
        title: announcement.title,
        description: announcement.description,
        authorId: announcement.author_id,
        createdAt: announcement.created_at,
        updatedAt: announcement.updated_at,
        priority: announcement.priority as DemoAnnouncement["priority"],
      }));
    eventsByWorkspace[workspaceId] = events
      .filter((event) => event.workspace_id === workspaceId)
      .map((event) => ({
        id: event.id,
        workspaceId,
        title: event.title,
        description: event.description,
        type: event.event_type as DemoCalendarEvent["type"],
        startsAt: event.starts_at,
        endsAt: event.ends_at,
        projectId: event.project_id ?? "",
        attendeeIds: attendees
          .filter((attendee) => attendee.event_id === event.id)
          .map((attendee) => attendee.user_id),
        location: event.location,
        createdAt: event.created_at,
      }));
    notificationsByWorkspace[workspaceId] = notifications
      .filter((notification) => notification.workspace_id === workspaceId)
      .map((notification) => ({
        id: notification.id,
        workspaceId,
        type: notification.notification_type as DemoNotification["type"],
        title: notification.title,
        description: notification.description,
        createdAt: notification.created_at,
        read: notification.read_at !== null,
        href: notification.href,
      }));
  }

  let persistedWorkspaceId = "";
  if (typeof window !== "undefined") {
    try {
      persistedWorkspaceId =
        window.localStorage.getItem(activeWorkspacePreferenceKey) ?? "";
    } catch (preferenceError) {
      console.error(
        "The active workspace preference could not be read; using the first available workspace.",
        preferenceError,
      );
    }
  }
  const activeWorkspaceId = workspaces.some(
    (workspace) => workspace.id === persistedWorkspaceId,
  )
    ? persistedWorkspaceId
    : workspaces[0]?.id ?? "";
  state = {
    currentUser: {
      id: user.id,
      name: profileMap.get(user.id)?.full_name || user.email || "Team member",
      email: user.email || "",
    },
    workspaces,
    activitiesByWorkspace,
    activeWorkspaceId,
    membersByWorkspace,
    projectsByWorkspace,
    tasksByWorkspace,
    announcementsByWorkspace,
    eventsByWorkspace,
    notificationsByWorkspace,
  };
  hydrated = true;
  clearError();
  emit();
}

export function subscribeToWorkspaceDemo(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWorkspaceDemoSnapshot() {
  return state;
}

export function getWorkspaceDemoServerSnapshot() {
  return emptyState;
}

export function getWorkspaceDemoHydrationSnapshot() {
  return hydrated;
}

export function getWorkspaceDemoHydrationServerSnapshot() {
  return false;
}

export function getWorkspaceDemoErrorSnapshot() {
  return errorMessage;
}

export function hydrateWorkspaceDemo() {
  if (loadingPromise) return loadingPromise;
  loadingPromise = Promise.resolve()
    .then(() => loadWorkspaceData())
    .then(() => {
      if (authListener) return;
      const client = createClient();
      const { data } = client.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          state = emptyState;
          clearError();
          hydrated = true;
          emit();
          return;
        }
        if (
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED"
        ) {
          window.setTimeout(() => {
            void loadWorkspaceData(client).catch(setError);
          }, 0);
        }
        if (event === "SIGNED_IN") {
          state = emptyState;
          clearError();
          emit();
          window.setTimeout(() => {
            void loadWorkspaceData(client).catch(setError);
          }, 0);
        }
      });
      authListener = data.subscription;
    })
    .catch((error: unknown) => {
      state = emptyState;
      hydrated = true;
      setError(error);
    })
    .finally(() => {
      loadingPromise = null;
      emit();
    });
  return loadingPromise;
}

async function runMutation(
  workspaceId: string,
  operation: (client: ReturnType<typeof createClient>, userId: string) => Promise<void>,
) {
  let client: ReturnType<typeof createClient> | undefined;
  try {
    client = createClient();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error("Sign in again before changing workspace data.");
    if (!workspaceId || !state.workspaces.some((item) => item.id === workspaceId)) {
      throw new Error("The selected workspace is not available in your account.");
    }
    await operation(client, user.id);
    await loadWorkspaceData(client);
    clearError();
    emit();
    return true;
  } catch (error) {
    if (client) {
      try {
        await loadWorkspaceData(client);
      } catch (refreshError) {
        setError(
          new Error(
            `${error instanceof Error ? error.message : "The change failed."} Workspace data also could not be refreshed: ${refreshError instanceof Error ? refreshError.message : "unknown error"}`,
          ),
        );
        return false;
      }
    }
    setError(error);
    return false;
  }
}

function getCurrentTask(workspaceId: string, taskId: string) {
  return state.tasksByWorkspace[workspaceId]?.find((task) => task.id === taskId);
}

function getCurrentProject(workspaceId: string, projectId: string) {
  return state.projectsByWorkspace[workspaceId]?.find(
    (project) => project.id === projectId,
  );
}

async function syncProjectComments(
  client: ReturnType<typeof createClient>,
  workspaceId: string,
  projectId: string,
  comments: NonNullable<DemoProject["comments"]>,
  userId: string,
) {
  const existing = state.projectsByWorkspace[workspaceId]
    ?.find((project) => project.id === projectId)
    ?.comments ?? [];
  const existingIds = new Set(existing.map((comment) => comment.id));
  const desiredIds = new Set(comments.map((comment) => comment.id));
  for (const comment of comments) {
    if (existingIds.has(comment.id)) {
      const old = existing.find((item) => item.id === comment.id);
      if (old?.body !== comment.body && old?.authorId === userId) {
        const result = await client
          .from("project_comments")
          .update({ body: comment.body })
          .eq("id", comment.id)
          .eq("author_id", userId)
          .select("id");
        const updated = throwOnError(result) ?? [];
        if (updated.length !== 1) {
          throw new Error("You can only edit comments you wrote.");
        }
      }
    } else {
      throwOnError(
        await client.from("project_comments").insert({
          workspace_id: workspaceId,
          project_id: projectId,
          author_id: userId,
          body: comment.body,
        }),
      );
    }
  }
  for (const comment of existing) {
    if (desiredIds.has(comment.id)) continue;
    const result = await client
      .from("project_comments")
      .delete()
      .eq("id", comment.id)
      .eq("author_id", userId)
      .select("id");
    const removed = throwOnError(result) ?? [];
    if (removed.length !== 1) {
      throw new Error("You can only delete comments you wrote.");
    }
  }
}

export async function switchWorkspace(workspaceId: string) {
  if (!state.workspaces.some((workspace) => workspace.id === workspaceId)) {
    setError(new Error("The selected workspace is not available."));
    return false;
  }
  state = { ...state, activeWorkspaceId: workspaceId };
  try {
    window.localStorage.setItem(activeWorkspacePreferenceKey, workspaceId);
  } catch {
    setError(new Error("Workspace changed, but its preference could not be saved in this browser."));
    emit();
    return true;
  }
  clearError();
  emit();
  return true;
}

export async function saveWorkspaceSettings(
  workspaceId: string,
  settings: WorkspaceSettings & { name: string },
) {
  return runMutation(workspaceId, async (client) => {
    const current = state.workspaces.find((workspace) => workspace.id === workspaceId);
    const { data: row, error } = await client
      .from("workspaces")
      .select("logo_path")
      .eq("id", workspaceId)
      .single();
    if (error) throw error;

    let logoPath = row.logo_path;
    if (settings.logoDataUrl.startsWith("data:")) {
      const blob = await fetch(settings.logoDataUrl).then((response) =>
        response.blob(),
      );
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Sign in again to upload a workspace logo.");
      const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
      logoPath = `${workspaceId}/${userData.user.id}/workspace/workspace-logo-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await client.storage
        .from("workspace-documents")
        .upload(logoPath, blob, { contentType: blob.type, upsert: false });
      if (uploadError) throw uploadError;
    } else if (!settings.logoDataUrl && current?.logoDataUrl) {
      if (row.logo_path) {
        const { error: removeError } = await client.storage
          .from("workspace-documents")
          .remove([row.logo_path]);
        if (removeError) throw removeError;
      }
      logoPath = "";
    }
    requireRow(
      await client
        .from("workspaces")
        .update({
          name: settings.name.trim(),
          company_name: settings.companyName.trim(),
          description: settings.description,
          industry: settings.industry,
          website: settings.website,
          company_size: settings.companySize,
          time_zone: settings.timeZone,
          logo_path: logoPath,
        })
        .eq("id", workspaceId)
        .select("id")
        .maybeSingle(),
      "You no longer have permission to update this workspace.",
    );
  });
}

export async function createWorkspace(
  workspace: DemoWorkspace,
) {
  try {
    const client = createClient();
    const { data, error } = await client.rpc("create_workspace", {
      workspace_name: workspace.name.trim(),
      company_name: workspace.companyName.trim(),
      description: workspace.description,
      industry: workspace.industry,
      website: workspace.website,
      company_size: workspace.companySize,
      time_zone: workspace.timeZone,
    });
    if (error) throw error;
    if (!data) throw new Error("The workspace could not be created.");
    await loadWorkspaceData(client);
    if (!(await switchWorkspace(data))) return false;
    return true;
  } catch (error) {
    setError(error);
    return false;
  }
}

export async function removeWorkspace(workspaceId: string) {
  try {
    const client = createClient();
    requireRow(
      await client
        .from("workspaces")
        .delete()
        .eq("id", workspaceId)
        .select("id")
        .maybeSingle(),
      "You no longer have permission to delete this workspace.",
    );
    await loadWorkspaceData(client);
    clearError();
    emit();
    return true;
  } catch (error) {
    setError(error);
    return false;
  }
}

export async function createDemoProject(workspaceId: string, project: DemoProject) {
  return runMutation(workspaceId, async (client) => {
    const { data, error } = await client
      .from("projects")
      .insert({
        ...(isUuid(project.id) ? { id: project.id } : {}),
        workspace_id: workspaceId,
        name: project.name,
        description: project.description,
        category: project.category,
        status: project.status,
        priority: project.priority,
        start_date: project.startDate,
        due_date: project.dueDate,
        manager_id: project.managerId || null,
        color: project.color,
        archived: project.archived,
      })
      .select("id")
      .single();
    if (error) throw error;
    const memberIds = [...new Set(project.memberIds)];
    if (project.managerId && !memberIds.includes(project.managerId)) {
      memberIds.push(project.managerId);
    }
    if (memberIds.length > 0) {
      try {
        const inserted =
          throwOnError(
            await client
              .from("project_members")
              .insert(
                memberIds.map((userId) => ({
                  workspace_id: workspaceId,
                  project_id: data.id,
                  user_id: userId,
                })),
              )
              .select("user_id"),
          ) ?? [];
        if (inserted.length !== memberIds.length) {
          throw new Error("Some project members could not be added.");
        }
      } catch (insertError) {
        const rollback = await client
          .from("projects")
          .delete()
          .eq("workspace_id", workspaceId)
          .eq("id", data.id)
          .select("id")
          .maybeSingle();
        if (rollback.error || !rollback.data) {
          throw new Error(
            `${insertError instanceof Error ? insertError.message : "Project members could not be added."} The partially created project could not be removed${rollback.error ? `: ${rollback.error.message}` : "."}`,
          );
        }
        throw insertError;
      }
    }
  });
}

export async function updateDemoProject(
  workspaceId: string,
  projectId: string,
  project: Partial<DemoProject>,
) {
  return runMutation(workspaceId, async (client, userId) => {
    const update: Database["public"]["Tables"]["projects"]["Update"] = {};
    if (project.name !== undefined) update.name = project.name;
    if (project.description !== undefined) update.description = project.description;
    if (project.category !== undefined) update.category = project.category;
    if (project.status !== undefined) update.status = project.status;
    if (project.priority !== undefined) update.priority = project.priority;
    if (project.startDate !== undefined) update.start_date = project.startDate;
    if (project.dueDate !== undefined) update.due_date = project.dueDate;
    if (project.managerId !== undefined) update.manager_id = project.managerId || null;
    if (project.color !== undefined) update.color = project.color;
    if (project.archived !== undefined) update.archived = project.archived;
    requireRow(
      await client
        .from("projects")
        .update(update)
        .eq("id", projectId)
        .eq("workspace_id", workspaceId)
        .select("id")
        .maybeSingle(),
      "The project could not be updated because it is no longer available or you lack permission.",
    );
    const current = getCurrentProject(workspaceId, projectId);
    if (current && (project.memberIds !== undefined || project.managerId !== undefined)) {
      const currentIds = new Set(current.memberIds);
      const nextIds = new Set(project.memberIds ?? current.memberIds);
      const nextManagerId = project.managerId ?? current.managerId;
      if (nextManagerId) nextIds.add(nextManagerId);
      const add = [...nextIds].filter((id) => !currentIds.has(id));
      const remove = [...currentIds].filter((id) => !nextIds.has(id));
      if (add.length) {
        const inserted = throwOnError(
          await client
            .from("project_members")
            .insert(
            add.map((id) => ({
              workspace_id: workspaceId,
              project_id: projectId,
              user_id: id,
            })),
            )
            .select("user_id"),
        ) ?? [];
        if (inserted.length !== add.length) {
          throw new Error("Some project members could not be added.");
        }
      }
      if (remove.length) {
        const removed = throwOnError(
          await client
            .from("project_members")
            .delete()
            .eq("workspace_id", workspaceId)
            .eq("project_id", projectId)
            .in("user_id", remove)
            .select("user_id"),
        ) ?? [];
        if (removed.length !== remove.length) {
          throw new Error("Some project members could not be removed.");
        }
      }
    }
    if (project.comments) {
      await syncProjectComments(client, workspaceId, projectId, project.comments, userId);
    }
  });
}

export async function duplicateDemoProject(
  workspaceId: string,
  projectId: string,
): Promise<DemoProject | null> {
  const project = getCurrentProject(workspaceId, projectId);
  if (!project) {
    setError(new Error("The project is no longer available."));
    return null;
  }
  const duplicate: DemoProject = {
    ...project,
    id: crypto.randomUUID(),
    name: `${project.name} (copy)`,
    status: "Planning",
    progress: 0,
    completedTasks: 0,
    totalTasks: 0,
    activity: [],
    comments: [],
    archived: false,
    createdAt: new Date().toISOString(),
  };
  return (await createDemoProject(workspaceId, duplicate)) ? duplicate : null;
}

function isUuid(value: string) {
  return /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
    value,
  );
}

export async function removeDemoProject(workspaceId: string, projectId: string) {
  return runMutation(workspaceId, async (client) => {
    requireRow(
      await client
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("workspace_id", workspaceId)
        .select("id")
        .maybeSingle(),
      "The project could not be deleted because it is no longer available or you lack permission.",
    );
  });
}

export async function createDemoTask(workspaceId: string, task: DemoTask) {
  const projectExists = state.projectsByWorkspace[workspaceId]?.some(
    (project) => project.id === task.projectId,
  );
  if (task.workspaceId !== workspaceId || !projectExists) {
    setError(
      new Error("Choose a project from the active workspace before saving this task."),
    );
    return false;
  }

  return runMutation(workspaceId, async (client) => {
    const { data, error } = await client
      .from("tasks")
      .insert({
        workspace_id: workspaceId,
        project_id: task.projectId,
        title: task.title,
        description: task.description,
        assignee_id: task.assigneeId || null,
        priority: task.priority,
        status: task.status,
        start_date: task.startDate || null,
        due_date: task.dueDate || null,
        estimated_hours: task.estimatedHours,
        labels: task.labels,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (task.subtasks.length) {
      throwOnError(
        await client.from("task_subtasks").insert(
          task.subtasks.map((item, position) => ({
            workspace_id: workspaceId,
            task_id: data.id,
            title: item.title,
            completed: item.completed,
            position,
          })),
        ),
      );
    }
    if (task.checklist.length) {
      throwOnError(
        await client.from("task_checklist_items").insert(
          task.checklist.map((item, position) => ({
            workspace_id: workspaceId,
            task_id: data.id,
            text: item.text,
            completed: item.completed,
            position,
          })),
        ),
      );
    }
  });
}

async function syncTaskComments(
  client: ReturnType<typeof createClient>,
  workspaceId: string,
  taskId: string,
  comments: DemoTask["comments"],
  userId: string,
) {
  const existing = getCurrentTask(workspaceId, taskId)?.comments ?? [];
  const existingIds = new Set(existing.map((comment) => comment.id));
  const desiredIds = new Set(comments.map((comment) => comment.id));
  for (const comment of comments) {
    if (existingIds.has(comment.id)) {
      const old = existing.find((item) => item.id === comment.id);
      if (old?.body !== comment.body && old?.authorId === userId) {
        const result = await client
          .from("task_comments")
          .update({ body: comment.body })
          .eq("id", comment.id)
          .eq("author_id", userId)
          .select("id");
        const updated = throwOnError(result) ?? [];
        if (updated.length !== 1) {
          throw new Error("You can only edit comments you wrote.");
        }
      }
    } else {
      throwOnError(
        await client.from("task_comments").insert({
          workspace_id: workspaceId,
          task_id: taskId,
          author_id: userId,
          body: comment.body,
        }),
      );
    }
  }
  for (const comment of existing) {
    if (desiredIds.has(comment.id)) continue;
    const result = await client
      .from("task_comments")
      .delete()
      .eq("id", comment.id)
      .eq("author_id", userId)
      .select("id");
    const removed = throwOnError(result) ?? [];
    if (removed.length !== 1) {
      throw new Error("You can only delete comments you wrote.");
    }
  }
}

async function syncTaskSubtasks(
  client: ReturnType<typeof createClient>,
  workspaceId: string,
  taskId: string,
  desired: DemoTask["subtasks"],
) {
  const existing = getCurrentTask(workspaceId, taskId)?.subtasks ?? [];
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const desiredById = new Map(desired.map((item) => [item.id, item]));
  for (const item of existing) {
    const next = desiredById.get(item.id);
    if (!next) {
      const { error } = await client
        .from("task_subtasks")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("task_id", taskId)
        .eq("id", item.id);
      if (error) throw error;
      continue;
    }
    if (item.title !== next.title || item.completed !== next.completed) {
      const { error } = await client
        .from("task_subtasks")
        .update({ title: next.title, completed: next.completed })
        .eq("workspace_id", workspaceId)
        .eq("task_id", taskId)
        .eq("id", item.id);
      if (error) throw error;
    }
  }
  for (const [position, item] of desired.entries()) {
    if (existingById.has(item.id)) continue;
    const { error } = await client.from("task_subtasks").insert({
      workspace_id: workspaceId,
      task_id: taskId,
      title: item.title,
      completed: item.completed,
      position,
    });
    if (error) throw error;
  }
}

async function syncTaskChecklist(
  client: ReturnType<typeof createClient>,
  workspaceId: string,
  taskId: string,
  desired: DemoTask["checklist"],
) {
  const existing = getCurrentTask(workspaceId, taskId)?.checklist ?? [];
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const desiredById = new Map(desired.map((item) => [item.id, item]));
  for (const item of existing) {
    const next = desiredById.get(item.id);
    if (!next) {
      const { error } = await client
        .from("task_checklist_items")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("task_id", taskId)
        .eq("id", item.id);
      if (error) throw error;
      continue;
    }
    if (item.text !== next.text || item.completed !== next.completed) {
      const { error } = await client
        .from("task_checklist_items")
        .update({ text: next.text, completed: next.completed })
        .eq("workspace_id", workspaceId)
        .eq("task_id", taskId)
        .eq("id", item.id);
      if (error) throw error;
    }
  }
  for (const [position, item] of desired.entries()) {
    if (existingById.has(item.id)) continue;
    const { error } = await client.from("task_checklist_items").insert({
      workspace_id: workspaceId,
      task_id: taskId,
      text: item.text,
      completed: item.completed,
      position,
    });
    if (error) throw error;
  }
}

export async function updateDemoTask(
  workspaceId: string,
  taskId: string,
  task: Partial<DemoTask>,
) {
  return runMutation(workspaceId, async (client, userId) => {
    const update: Database["public"]["Tables"]["tasks"]["Update"] = {};
    if (task.projectId !== undefined) update.project_id = task.projectId;
    if (task.title !== undefined) update.title = task.title;
    if (task.description !== undefined) update.description = task.description;
    if (task.assigneeId !== undefined) update.assignee_id = task.assigneeId || null;
    if (task.priority !== undefined) update.priority = task.priority;
    if (task.status !== undefined) update.status = task.status;
    if (task.startDate !== undefined) update.start_date = task.startDate || null;
    if (task.dueDate !== undefined) update.due_date = task.dueDate || null;
    if (task.estimatedHours !== undefined) update.estimated_hours = task.estimatedHours;
    if (task.labels !== undefined) update.labels = task.labels;
    if (Object.keys(update).length > 0) {
      requireRow(
        await client
          .from("tasks")
          .update(update)
          .eq("id", taskId)
          .eq("workspace_id", workspaceId)
          .select("id")
          .maybeSingle(),
        "The task could not be updated because it is no longer available or you lack permission.",
      );
    }
    if (task.subtasks) {
      await syncTaskSubtasks(client, workspaceId, taskId, task.subtasks);
    }
    if (task.checklist) {
      await syncTaskChecklist(client, workspaceId, taskId, task.checklist);
    }
    if (task.comments) {
      await syncTaskComments(client, workspaceId, taskId, task.comments, userId);
    }
  });
}

export async function removeDemoTask(workspaceId: string, taskId: string) {
  return runMutation(workspaceId, async (client) => {
    requireRow(
      await client
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("workspace_id", workspaceId)
        .select("id")
        .maybeSingle(),
      "The task could not be deleted because it is no longer available or you lack permission.",
    );
  });
}

export async function addDemoMember(
  workspaceId: string,
  member: DemoMember,
) {
  return runMutation(workspaceId, async (client, userId) => {
    const { error } = await client.from("workspace_invitations").insert({
      workspace_id: workspaceId,
      email: member.email.trim().toLowerCase(),
      full_name: member.name.trim(),
      department: member.department,
      role: toDatabaseRole(member.role),
      invited_by: userId,
    });
    if (error) throw error;
  });
}

export async function updateDemoMember(
  workspaceId: string,
  memberId: string,
  member: DemoMember,
) {
  return runMutation(workspaceId, async (client) => {
    if (member.status === "Pending") {
      requireRow(
        await client
          .from("workspace_invitations")
          .update({
            email: member.email.trim().toLowerCase(),
            full_name: member.name.trim(),
            department: member.department,
            role: toDatabaseRole(member.role),
          })
          .eq("id", memberId)
          .eq("workspace_id", workspaceId)
          .select("id")
          .maybeSingle(),
        "The invitation could not be updated because it is no longer available or you lack permission.",
      );
      return;
    }
    const existing = state.membersByWorkspace[workspaceId]?.find(
      (item) => item.id === memberId,
    );
    if (existing?.email !== member.email) {
      throw new Error("Changing a teammate's email requires a separate account email confirmation flow.");
    }
    if (existing?.name !== member.name) {
      throw new Error("Teammates manage their own account name.");
    }
    requireRow(
      await client
        .from("workspace_members")
        .update({
          role: toDatabaseRole(member.role),
          department: member.department,
        })
        .eq("workspace_id", workspaceId)
        .eq("user_id", memberId)
        .select("user_id")
        .maybeSingle(),
      "The team member could not be updated because they are no longer in this workspace or you lack permission.",
    );
  });
}

export async function removeDemoMember(workspaceId: string, memberId: string) {
  return runMutation(workspaceId, async (client) => {
    const member = state.membersByWorkspace[workspaceId]?.find(
      (item) => item.id === memberId,
    );
    if (!member) throw new Error("The teammate is no longer available.");
    if (member.status === "Pending") {
      requireRow(
        await client
          .from("workspace_invitations")
          .delete()
          .eq("id", memberId)
          .eq("workspace_id", workspaceId)
          .select("id")
          .maybeSingle(),
        "The invitation could not be revoked because it is no longer available or you lack permission.",
      );
      return;
    }
    requireRow(
      await client
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", memberId)
        .select("user_id")
        .maybeSingle(),
      "The team member could not be removed because they are no longer in this workspace or you lack permission.",
    );
  });
}

export async function listMyPendingWorkspaceInvitations() {
  const result = await createClient().rpc("list_my_pending_invitations");
  return throwOnError(result) ?? [];
}

export async function acceptWorkspaceInvitation(
  invitationId: string,
  workspaceId: string,
) {
  const client = createClient();
  const accepted = throwOnError(
    await client.rpc("accept_workspace_invitation", {
      invitation_id: invitationId,
    }),
  );
  if (!accepted) {
    throw new Error("This invitation is no longer available or is addressed to another email.");
  }
  await loadWorkspaceData(client);
  if (!(await switchWorkspace(workspaceId))) {
    throw new Error("The invitation was accepted, but the workspace could not be selected.");
  }
}

export async function createDemoAnnouncement(
  workspaceId: string,
  announcement: DemoAnnouncement,
) {
  return runMutation(workspaceId, async (client, userId) => {
    const { error } = await client.from("announcements").insert({
      workspace_id: workspaceId,
      author_id: userId,
      title: announcement.title,
      description: announcement.description,
      priority: announcement.priority,
    });
    if (error) throw error;
  });
}

export async function updateDemoAnnouncement(
  workspaceId: string,
  announcementId: string,
  announcement: DemoAnnouncement,
) {
  return runMutation(workspaceId, async (client) => {
    requireRow(
      await client
      .from("announcements")
      .update({
        title: announcement.title,
        description: announcement.description,
        priority: announcement.priority,
      })
      .eq("id", announcementId)
      .eq("workspace_id", workspaceId)
      .select("id")
      .maybeSingle(),
      "The announcement could not be updated because it is no longer available or you lack permission.",
    );
  });
}

export async function removeDemoAnnouncement(
  workspaceId: string,
  announcementId: string,
) {
  return runMutation(workspaceId, async (client) => {
    requireRow(
      await client
        .from("announcements")
        .delete()
        .eq("id", announcementId)
        .eq("workspace_id", workspaceId)
        .select("id")
        .maybeSingle(),
      "The announcement could not be deleted because it is no longer available or you lack permission.",
    );
  });
}

async function saveEventAttendees(
  client: ReturnType<typeof createClient>,
  workspaceId: string,
  eventId: string,
  attendeeIds: string[],
) {
  const { error: deleteError } = await client
    .from("calendar_event_attendees")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("event_id", eventId);
  if (deleteError) throw deleteError;
  if (attendeeIds.length) {
    const { error } = await client.from("calendar_event_attendees").insert(
      [...new Set(attendeeIds)].map((userId) => ({
        workspace_id: workspaceId,
        event_id: eventId,
        user_id: userId,
      })),
    );
    if (error) throw error;
  }
}

export async function createDemoCalendarEvent(
  workspaceId: string,
  event: DemoCalendarEvent,
) {
  return runMutation(workspaceId, async (client, userId) => {
    const { data, error } = await client
      .from("calendar_events")
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        title: event.title,
        description: event.description,
        event_type: event.type,
        starts_at: event.startsAt,
        ends_at: event.endsAt,
        project_id: event.projectId || null,
        location: event.location,
      })
      .select("id")
      .single();
    if (error) throw error;
    await saveEventAttendees(client, workspaceId, data.id, event.attendeeIds);
  });
}

export async function updateDemoCalendarEvent(
  workspaceId: string,
  eventId: string,
  event: DemoCalendarEvent,
) {
  return runMutation(workspaceId, async (client) => {
    requireRow(
      await client
        .from("calendar_events")
        .update({
          title: event.title,
          description: event.description,
          event_type: event.type,
          starts_at: event.startsAt,
          ends_at: event.endsAt,
          project_id: event.projectId || null,
          location: event.location,
        })
        .eq("id", eventId)
        .eq("workspace_id", workspaceId)
        .select("id")
        .maybeSingle(),
      "The event could not be updated because it is no longer available or you lack permission.",
    );
    await saveEventAttendees(client, workspaceId, eventId, event.attendeeIds);
  });
}

export async function removeDemoCalendarEvent(
  workspaceId: string,
  eventId: string,
) {
  return runMutation(workspaceId, async (client) => {
    requireRow(
      await client
        .from("calendar_events")
        .delete()
        .eq("id", eventId)
        .eq("workspace_id", workspaceId)
        .select("id")
        .maybeSingle(),
      "The event could not be deleted because it is no longer available or you lack permission.",
    );
  });
}

export async function markDemoNotificationRead(
  workspaceId: string,
  notificationId: string,
) {
  return runMutation(workspaceId, async (client) => {
    requireRow(
      await client
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("workspace_id", workspaceId)
        .select("id")
        .maybeSingle(),
      "The notification could not be updated because it is no longer available.",
    );
  });
}

export async function markAllDemoNotificationsRead(workspaceId: string) {
  return runMutation(workspaceId, async (client) => {
    const { error } = await client
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .is("read_at", null);
    if (error) throw error;
  });
}

export async function removeDemoNotification(
  workspaceId: string,
  notificationId: string,
) {
  return runMutation(workspaceId, async (client) => {
    const { error } = await client
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("workspace_id", workspaceId);
    if (error) throw error;
  });
}

export async function signOut() {
  try {
    const client = createClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    state = emptyState;
    clearError();
    emit();
    return true;
  } catch (error) {
    setError(error);
    return false;
  }
}
