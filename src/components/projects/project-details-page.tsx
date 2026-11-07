"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Ellipsis,
  FolderKanban,
  MessageCircle,
  Pencil,
  Trash,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/brand";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";
import { DemoPersistenceNotice } from "@/components/settings/demo-persistence-notice";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import {
  projectPriorities,
  projectStatuses,
  type DemoProject,
  type ProjectPriority,
  type ProjectStatus,
  type ProjectComment,
} from "@/lib/project-demo-data";
import {
  duplicateDemoProject,
  removeDemoProject,
  updateDemoProject,
} from "@/lib/workspace-demo-store";
import { ProjectFormDialog } from "./project-form-dialog";

export function ProjectDetailsPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { activeWorkspace, currentUser, isHydrated, members, projects } = useWorkspaceDemo();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedComment, setEditedComment] = useState("");
  const project = projects.find((item) => item.id === projectId);

  if (!isHydrated || !activeWorkspace) {
    return (
      <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground" role="status">
        Loading project…
      </div>
    );
  }
  if (!project) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 text-center text-foreground">
        <FolderKanban aria-hidden="true" className="mx-auto text-muted-foreground" size={28} />
        <h1 className="mt-4 text-xl font-semibold">Project not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This project may have been removed or belongs to another workspace.
        </p>
        <Button className="mt-5" onClick={() => router.push("/projects")}>
          <ArrowLeft aria-hidden="true" size={15} />
          Back to projects
        </Button>
      </div>
    );
  }

  const currentProject = project;
  const manager = members.find(
    (member) => member.id === currentProject.managerId,
  );
  const team = members.filter((member) =>
    currentProject.memberIds.includes(member.id),
  );
  const currentMember = members.find((member) => member.id === currentUser?.id);
  const mentionQuery = commentText.match(/(?:^|\s)@([\w ]*)$/)?.[1];
  const mentionSuggestions =
    mentionQuery === undefined
      ? []
      : members
          .filter((member) =>
            member.name.toLowerCase().includes(mentionQuery.trim().toLowerCase()),
          )
          .slice(0, 5);

  function updateProject(updates: Partial<DemoProject>) {
    updateDemoProject(activeWorkspace.id, currentProject.id, updates);
  }

  async function handleDelete() {
    if (await removeDemoProject(activeWorkspace.id, currentProject.id)) {
      router.push("/projects");
    }
  }

  function addProjectComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = commentText.trim();
    if (!body) return;
    const comment: ProjectComment = {
      id: `project-comment-${crypto.randomUUID()}`,
      author: currentMember?.name ?? currentUser?.name ?? "Team member",
      authorId: currentUser?.id,
      body,
      createdAt: new Date().toISOString(),
    };
    updateProject({ comments: [...(currentProject.comments ?? []), comment] });
    setCommentText("");
  }

  function saveProjectComment(commentId: string) {
    const body = editedComment.trim();
    if (!body) return;
    updateProject({
      comments: (currentProject.comments ?? []).map((comment) =>
        comment.id === commentId
          ? { ...comment, body, editedAt: new Date().toISOString() }
          : comment,
      ),
    });
    setEditingCommentId(null);
    setEditedComment("");
  }

  function removeProjectComment(commentId: string) {
    updateProject({
      comments: (currentProject.comments ?? []).filter(
        (comment) => comment.id !== commentId,
      ),
    });
  }

  function chooseMention(name: string) {
    const atIndex = commentText.lastIndexOf("@");
    setCommentText(`${commentText.slice(0, atIndex)}@${name} `);
  }

  const selectClass =
    "min-h-9 rounded-control border border-border bg-surface px-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-[88rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
          <div className="flex items-center gap-4">
            <Brand />
            <span className="hidden h-6 w-px bg-border sm:block" />
            <Link
              className="hidden items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground sm:inline-flex"
              href="/projects"
            >
              <ArrowLeft aria-hidden="true" size={14} />
              Projects
            </Link>
          </div>
          <span className="max-w-40 truncate text-xs font-medium text-muted-foreground">
            {activeWorkspace.name}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[88rem] px-4 pb-14 pt-7 sm:px-6 lg:px-9 lg:pt-10">
        <div className="mb-6 hidden items-center gap-2 text-[0.7rem] text-muted-foreground sm:flex">
          <Link className="hover:text-foreground" href="/dashboard">
            Workspace
          </Link>
          <span aria-hidden="true">/</span>
          <Link className="hover:text-foreground" href="/projects">
            Projects
          </Link>
          <span aria-hidden="true">/</span>
          <span className="max-w-64 truncate font-semibold text-foreground">
            {project.name}
          </span>
        </div>
        <DemoPersistenceNotice />

        <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex min-w-0 items-start gap-3">
            <ProjectMark color={project.color} />
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{project.category}</Badge>
                <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
                <Badge variant={priorityVariant(project.priority)}>
                  {project.priority} priority
                </Badge>
                {project.archived && <Badge variant="outline">Archived</Badge>}
              </div>
              <h1 className="break-words text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.9rem]">
                {project.name}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                {project.description || "No project description has been added."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={() => setDialogOpen(true)} size="sm" variant="outline">
              <Pencil aria-hidden="true" size={14} />
              Edit
            </Button>
            <div className="relative">
              <Button
                aria-expanded={menuOpen}
                aria-label="More project actions"
                onClick={() => setMenuOpen((open) => !open)}
                size="sm"
                variant="outline"
              >
                <Ellipsis aria-hidden="true" size={16} />
                <ChevronDown aria-hidden="true" size={13} />
              </Button>
              {menuOpen && (
                <div className="absolute right-0 top-10 z-20 w-48 rounded-control border border-border bg-surface p-1 shadow-popover">
                  <ActionButton
                    icon={<Copy aria-hidden="true" size={14} />}
                    label="Duplicate project"
                    onClick={async () => {
                      const duplicate = await duplicateDemoProject(
                        activeWorkspace.id,
                        project.id,
                      );
                      setMenuOpen(false);
                      if (duplicate) router.push(`/projects/${duplicate.id}`);
                    }}
                  />
                  <ActionButton
                    icon={<FolderKanban aria-hidden="true" size={14} />}
                    label={project.archived ? "Unarchive project" : "Archive project"}
                    onClick={() => {
                      updateProject({ archived: !project.archived });
                      setMenuOpen(false);
                    }}
                  />
                  <ActionButton
                    danger
                    icon={<Trash2 aria-hidden="true" size={14} />}
                    label="Delete project"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.8fr)]">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Project progress</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {project.progress}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {project.completedTasks} of {project.totalTasks} tasks complete
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor="detail-status">
                  Project status
                </label>
                <select
                  className={selectClass}
                  id="detail-status"
                  onChange={(event) => {
                    const status = event.target.value as ProjectStatus;
                    updateProject({
                      status,
                      ...(status === "Completed" ? { progress: 100 } : {}),
                    });
                  }}
                  value={project.status}
                >
                  {projectStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="detail-priority">
                  Project priority
                </label>
                <select
                  className={selectClass}
                  id="detail-priority"
                  onChange={(event) =>
                    updateProject({
                      priority: event.target.value as ProjectPriority,
                    })
                  }
                  value={project.priority}
                >
                  {projectPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority} priority
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Progress
              className="mt-5 h-2"
              label={`${project.name} progress`}
              value={project.progress}
            />
            <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
              <DateDetail label="Start date" value={formatDate(project.startDate)} />
              <DateDetail label="Deadline" value={formatDate(project.dueDate)} />
              <DateDetail
                label="Project manager"
                value={manager?.name ?? "Unassigned"}
                icon={<UsersRound aria-hidden="true" size={14} />}
              />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Project team</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {team.length} {team.length === 1 ? "member" : "members"} assigned
            </p>
            {team.length ? (
              <ul className="mt-4 space-y-3">
                {team.map((member) => (
                  <li className="flex items-center gap-3" key={member.id}>
                    <Avatar name={member.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {member.name}
                      </p>
                      <p className="truncate text-[0.675rem] text-muted-foreground">
                        {member.department}
                      </p>
                    </div>
                    {member.id === project.managerId && (
                      <Badge className="ml-auto" variant="primary">
                        Manager
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-control bg-surface-muted p-3 text-xs text-muted-foreground">
                No team members have been assigned yet.
              </p>
            )}
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.8fr)]">
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Project overview</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Key information and delivery summary.
                </p>
              </div>
              <Badge variant="outline">{project.category}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryItem label="Status" value={project.status} />
              <SummaryItem label="Priority" value={project.priority} />
              <SummaryItem label="Started" value={formatDate(project.startDate)} />
              <SummaryItem label="Due date" value={formatDate(project.dueDate)} />
              <SummaryItem
                label="Task completion"
                value={`${project.completedTasks} completed of ${project.totalTasks}`}
              />
              <SummaryItem label="Created" value={formatDate(project.createdAt.slice(0, 10))} />
            </div>
          </Card>
          <Card className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Updates from this project team.
              </p>
            </div>
            {project.activity.length ? (
              <ol className="space-y-4">
                {project.activity.slice(0, 6).map((activity) => (
                  <li className="flex gap-3" key={activity.id}>
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 aria-hidden="true" size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs leading-5 text-foreground">
                        <span className="font-semibold">{activity.actor}</span>{" "}
                        {activity.action}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                        <Clock3 aria-hidden="true" size={11} />
                        {formatDate(activity.createdAt.slice(0, 10))}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-control bg-surface-muted p-3 text-xs text-muted-foreground">
                Project activity will appear here as updates are made.
              </p>
            )}
          </Card>
        </section>

        <Card className="mt-4 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle aria-hidden="true" className="text-primary" size={16} />
            <h2 className="text-sm font-semibold">Project discussion</h2>
            <Badge variant="secondary">{(project.comments ?? []).length}</Badge>
          </div>
          <form className="relative space-y-2" onSubmit={addProjectComment}>
            <label className="sr-only" htmlFor="project-comment">Add a project comment</label>
            <textarea
              className="min-h-20 w-full resize-y rounded-control border border-border bg-surface px-3.5 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              id="project-comment"
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Share a project update or mention a teammate with @..."
              value={commentText}
            />
            {mentionSuggestions.length > 0 && (
              <div className="absolute bottom-12 left-0 z-10 max-h-40 w-full overflow-y-auto rounded-control border border-border bg-surface p-1 shadow-popover">
                {mentionSuggestions.map((member) => (
                  <button
                    className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-xs hover:bg-surface-muted"
                    key={member.id}
                    onClick={() => chooseMention(member.name)}
                    type="button"
                  >
                    <Avatar name={member.name} size="sm" />
                    {member.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button disabled={!commentText.trim()} size="sm" type="submit">
                <MessageCircle aria-hidden="true" size={14} />Comment
              </Button>
            </div>
          </form>
          <ul className="mt-5 space-y-3">
            {(project.comments ?? []).map((comment) => (
              <li className="flex gap-3" key={comment.id}>
                <Avatar name={comment.author} size="sm" />
                <div className="min-w-0 flex-1 rounded-control bg-surface-muted/65 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{comment.author}</p>
                    <time className="text-[0.625rem] text-muted-foreground" dateTime={comment.createdAt}>
                      {new Date(comment.createdAt).toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </time>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        aria-label="Edit project comment"
                        className="min-h-20 w-full rounded-control border border-border bg-surface p-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                        onChange={(event) => setEditedComment(event.target.value)}
                        value={editedComment}
                      />
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => setEditingCommentId(null)} size="sm" variant="ghost">Cancel</Button>
                        <Button onClick={() => saveProjectComment(comment.id)} size="sm">Save</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{renderMentions(comment.body, members)}</p>
                      {(comment.authorId === currentMember?.id ||
                        (!comment.authorId && comment.author === currentMember?.name)) && (
                        <div className="mt-2 flex justify-end gap-1">
                          <button
                            aria-label="Edit your project comment"
                            className="inline-flex size-7 items-center justify-center rounded-control text-muted-foreground hover:bg-surface hover:text-primary"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditedComment(comment.body);
                            }}
                            type="button"
                          ><Pencil aria-hidden="true" size={13} /></button>
                          <button
                            aria-label="Delete your project comment"
                            className="inline-flex size-7 items-center justify-center rounded-control text-muted-foreground hover:bg-danger-muted hover:text-danger"
                            onClick={() => removeProjectComment(comment.id)}
                            type="button"
                          ><Trash aria-hidden="true" size={13} /></button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {(project.comments ?? []).length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">No comments yet. Start the project conversation.</p>
          )}
        </Card>
      </main>

      {dialogOpen && (
        <ProjectFormDialog
          initialProject={project}
          members={members}
          onClose={() => setDialogOpen(false)}
          onSave={(updatedProject) =>
            updateDemoProject(activeWorkspace.id, project.id, updatedProject)
          }
        />
      )}
      {deleteOpen && (
        <ConfirmDialog
          confirmLabel="Delete project"
          description={`“${project.name}” will be permanently removed from this workspace. This cannot be undone.`}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete this project?"
        />
      )}
    </div>
  );
}

function renderMentions(body: string, members: { name: string }[]) {
  const names = members
    .map((member) => member.name)
    .sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = names.length
    ? new RegExp(`@(?:${names.join("|")})(?=$|[\\s.,!?])`, "g")
    : /$^/g;
  const result: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of body.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) result.push(body.slice(cursor, index));
    result.push(<span className="font-semibold text-primary" key={`${index}-${match[0]}`}>{match[0]}</span>);
    cursor = index + match[0].length;
  }
  if (cursor < body.length) result.push(body.slice(cursor));
  return result;
}

function DateDetail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[0.675rem] text-muted-foreground">{label}</p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
        {icon ?? <CalendarDays aria-hidden="true" size={14} />}
        {value}
      </p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control bg-surface-muted/65 p-3">
      <p className="text-[0.675rem] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProjectMark({ color }: { color: DemoProject["color"] }) {
  const colors = {
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    blue: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  };
  return (
    <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
      <FolderKanban aria-hidden="true" size={19} />
    </span>
  );
}

function ActionButton({
  danger = false,
  icon,
  label,
  onClick,
}: {
  danger?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs transition hover:bg-surface-muted ${
        danger ? "text-danger" : "text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function statusVariant(status: ProjectStatus) {
  return {
    Planning: "secondary",
    Active: "success",
    "On Hold": "warning",
    Completed: "primary",
  }[status] as "secondary" | "success" | "warning" | "primary";
}

function priorityVariant(priority: ProjectPriority) {
  return {
    Low: "default",
    Medium: "primary",
    High: "warning",
    Urgent: "danger",
  }[priority] as "default" | "primary" | "warning" | "danger";
}

function formatDate(value: string) {
  if (!value) return "Not set";
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
