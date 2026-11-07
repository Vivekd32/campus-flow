"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FolderKanban,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/brand";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";
import { DemoPersistenceNotice } from "@/components/settings/demo-persistence-notice";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import type { ProjectPriority } from "@/lib/project-demo-data";
import {
  taskLabels,
  taskStatuses,
  type DemoTask,
  type TaskChecklistItem,
  type TaskComment,
  type TaskLabel,
  type TaskStatus,
  type TaskSubtask,
} from "@/lib/task-demo-data";
import { removeDemoTask, updateDemoTask } from "@/lib/workspace-demo-store";
import { TaskFormDialog } from "./task-form-dialog";

export function TaskDetailsPage({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { activeWorkspace, currentUser, isHydrated, members, projects, tasks } =
    useWorkspaceDemo();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editedSubtaskTitle, setEditedSubtaskTitle] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const task = tasks.find((item) => item.id === taskId);

  if (!isHydrated || !activeWorkspace) {
    return (
      <div
        className="min-h-screen bg-background p-6 text-sm text-muted-foreground"
        role="status"
      >
        Loading task…
      </div>
    );
  }
  if (!task) {
    return (
      <div className="min-h-screen bg-background px-4 py-16 text-center text-foreground">
        <CheckCircle2
          aria-hidden="true"
          className="mx-auto text-muted-foreground"
          size={28}
        />
        <h1 className="mt-4 text-xl font-semibold">Task not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This task may have been removed or belongs to another workspace.
        </p>
        <Button className="mt-5" onClick={() => router.push("/tasks")}>
          <ArrowLeft aria-hidden="true" size={15} />
          Back to tasks
        </Button>
      </div>
    );
  }

  const currentTask = task;
  const project = projects.find((item) => item.id === currentTask.projectId);
  const assignee = members.find((item) => item.id === currentTask.assigneeId);
  const currentMember = members.find((member) => member.id === currentUser?.id);
  const mentionQuery = commentText.match(/(?:^|\s)@([\w ]*)$/)?.[1];
  const mentionSuggestions = mentionQuery === undefined
    ? []
    : members
        .filter((member) =>
          member.name.toLowerCase().includes(mentionQuery.trim().toLowerCase()),
        )
        .slice(0, 5);
  const subtaskProgress = currentTask.subtasks.length
    ? Math.round(
        (currentTask.subtasks.filter((item) => item.completed).length /
          currentTask.subtasks.length) *
          100,
      )
    : 0;
  const checklistProgress = currentTask.checklist.length
    ? Math.round(
        (currentTask.checklist.filter((item) => item.completed).length /
          currentTask.checklist.length) *
          100,
      )
    : 0;

  function updateTask(updates: Partial<DemoTask>) {
    updateDemoTask(activeWorkspace.id, currentTask.id, updates);
  }

  function updateSubtasks(subtasks: TaskSubtask[]) {
    void updateTask({ subtasks });
  }

  function handleAddSubtask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = subtaskTitle.trim();
    if (!title) return;
    updateSubtasks(
      [
        ...currentTask.subtasks,
        { id: `subtask-${crypto.randomUUID()}`, title, completed: false },
      ],
    );
    setSubtaskTitle("");
  }

  function saveSubtask(subtaskId: string) {
    const title = editedSubtaskTitle.trim();
    if (!title) return;
    updateSubtasks(
      currentTask.subtasks.map((item) =>
        item.id === subtaskId ? { ...item, title } : item,
      ),
    );
    setEditingSubtaskId(null);
  }

  function toggleSubtask(subtask: TaskSubtask) {
    updateSubtasks(
      currentTask.subtasks.map((item) =>
        item.id === subtask.id ? { ...item, completed: !item.completed } : item,
      ),
    );
  }

  function removeSubtask(subtaskId: string) {
    updateSubtasks(
      currentTask.subtasks.filter((item) => item.id !== subtaskId),
    );
  }

  function addChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = checklistText.trim();
    if (!text) return;
    updateTask({
      checklist: [
        ...currentTask.checklist,
        { id: `check-${crypto.randomUUID()}`, text, completed: false },
      ],
    });
    setChecklistText("");
  }

  function toggleChecklistItem(item: TaskChecklistItem) {
    updateTask({
      checklist: currentTask.checklist.map((check) =>
        check.id === item.id ? { ...check, completed: !check.completed } : check,
      ),
    });
  }

  function removeChecklistItem(itemId: string) {
    updateTask({
      checklist: currentTask.checklist.filter((item) => item.id !== itemId),
    });
  }

  function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = commentText.trim();
    if (!body) return;
    const comment: TaskComment = {
      id: `comment-${crypto.randomUUID()}`,
      author: currentMember?.name ?? currentUser?.name ?? "Team member",
      authorId: currentUser?.id,
      body,
      createdAt: new Date().toISOString(),
    };
    updateTask({
      comments: [...currentTask.comments, comment],
    });
    setCommentText("");
  }

  function chooseMention(memberName: string) {
    const atIndex = commentText.lastIndexOf("@");
    setCommentText(`${commentText.slice(0, atIndex)}@${memberName} `);
  }

  function saveComment(commentId: string) {
    const body = editedCommentText.trim();
    if (!body) return;
    updateTask({
      comments: currentTask.comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, body, editedAt: new Date().toISOString() }
          : comment,
      ),
    });
    setEditingCommentId(null);
    setEditedCommentText("");
  }

  function deleteComment(commentId: string) {
    updateTask({
      comments: currentTask.comments.filter((comment) => comment.id !== commentId),
    });
  }

  function toggleLabel(label: TaskLabel) {
    const labels = currentTask.labels.includes(label)
      ? currentTask.labels.filter((item) => item !== label)
      : [...currentTask.labels, label];
    updateTask({ labels });
  }

  async function handleDelete() {
    if (await removeDemoTask(activeWorkspace.id, currentTask.id)) {
      router.push("/tasks");
    }
  }

  const selectClass =
    "min-h-10 w-full rounded-control border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-[88rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
          <div className="flex items-center gap-4">
            <Brand />
            <span className="hidden h-6 w-px bg-border sm:block" />
            <Link
              className="hidden items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground sm:inline-flex"
              href="/tasks"
            >
              <ArrowLeft aria-hidden="true" size={14} />
              My Tasks
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
          <Link className="hover:text-foreground" href="/tasks">
            My Tasks
          </Link>
          <span aria-hidden="true">/</span>
          <span className="max-w-64 truncate font-semibold text-foreground">
            {currentTask.title}
          </span>
        </div>
        <DemoPersistenceNotice />

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(currentTask.status)}>
                {currentTask.status}
              </Badge>
              <Badge variant={priorityVariant(currentTask.priority)}>
                {currentTask.priority} priority
              </Badge>
              {project && (
                <Link
                  className="inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                  href={`/projects/${project.id}`}
                >
                  <FolderKanban aria-hidden="true" size={12} />
                  {project.name}
                </Link>
              )}
            </div>
            <h1 className="break-words text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.9rem]">
              {currentTask.title}
            </h1>
            <p className="mt-1.5 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {currentTask.description || "No description added."}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => setEditOpen(true)} size="sm" variant="outline">
              <Pencil aria-hidden="true" size={14} />
              Edit
            </Button>
            <Button
              aria-label="Delete task"
              onClick={() => setDeleteOpen(true)}
              size="sm"
              variant="outline"
            >
              <Trash2 aria-hidden="true" size={14} />
            </Button>
          </div>
        </div>

        <section className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.8fr)]">
          <Card className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DetailValue
                icon={<UsersRound aria-hidden="true" size={14} />}
                label="Assignee"
                value={assignee?.name ?? "Unassigned"}
              />
              <DetailValue
                icon={<CalendarDays aria-hidden="true" size={14} />}
                label="Due date"
                value={formatDate(currentTask.dueDate)}
              />
              <DetailValue
                icon={<Clock3 aria-hidden="true" size={14} />}
                label="Estimate"
                value={`${currentTask.estimatedHours} hours`}
              />
              <DetailValue
                icon={<FolderKanban aria-hidden="true" size={14} />}
                label="Project"
                value={project?.name ?? "Project unavailable"}
              />
            </div>
            <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
              <Field htmlFor="detail-task-status" label="Status">
                <select
                  className={selectClass}
                  id="detail-task-status"
                  onChange={(event) =>
                    updateDemoTask(activeWorkspace.id, currentTask.id, {
                      status: event.target.value as TaskStatus,
                    })
                  }
                  value={currentTask.status}
                >
                  {taskStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </Field>
              <Field htmlFor="detail-task-priority" label="Priority">
                <select
                  className={selectClass}
                  id="detail-task-priority"
                  onChange={(event) =>
                    updateDemoTask(activeWorkspace.id, currentTask.id, {
                      priority: event.target.value as ProjectPriority,
                    })
                  }
                  value={currentTask.priority}
                >
                  {(["Low", "Medium", "High", "Urgent"] as const).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-5 border-t border-border pt-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Labels</h2>
                <span className="text-[0.675rem] text-muted-foreground">
                  Add or remove labels
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {taskLabels.map((label) => {
                  const selected = currentTask.labels.includes(label);
                  return (
                    <button
                      aria-pressed={selected}
                      className={`rounded-pill border px-3 py-1.5 text-xs transition ${
                        selected
                          ? "border-primary/30 bg-primary/10 font-semibold text-primary"
                          : "border-border text-muted-foreground hover:bg-surface-muted"
                      }`}
                      key={label}
                      onClick={() => toggleLabel(label)}
                      type="button"
                    >
                      {label}
                      {selected && <span className="sr-only"> (selected)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Subtasks</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {currentTask.subtasks.filter((item) => item.completed).length} of{" "}
                  {currentTask.subtasks.length} complete
                </p>
              </div>
              <Badge variant="secondary">{subtaskProgress}%</Badge>
            </div>
            <Progress
              className="mb-4 h-1.5"
              label="Subtask completion"
              value={subtaskProgress}
            />
            <ul className="space-y-2.5">
              {currentTask.subtasks.map((subtask) => (
                <li className="flex items-center gap-2" key={subtask.id}>
                  <input
                    aria-label={`Complete ${subtask.title}`}
                    checked={subtask.completed}
                    className="size-4 accent-primary"
                    onChange={() => toggleSubtask(subtask)}
                    type="checkbox"
                  />
                  {editingSubtaskId === subtask.id ? (
                    <form
                      className="flex min-w-0 flex-1 gap-1"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveSubtask(subtask.id);
                      }}
                    >
                      <Input
                        autoFocus
                        aria-label="Edit subtask title"
                        className="min-h-8 px-2 text-xs"
                        onChange={(event) =>
                          setEditedSubtaskTitle(event.target.value)
                        }
                        value={editedSubtaskTitle}
                      />
                      <button
                        aria-label="Save subtask"
                        className="text-success"
                        type="submit"
                      >
                        <Check aria-hidden="true" size={15} />
                      </button>
                    </form>
                  ) : (
                    <span
                      className={`min-w-0 flex-1 text-xs ${
                        subtask.completed
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {subtask.title}
                    </span>
                  )}
                  {editingSubtaskId !== subtask.id && (
                    <>
                      <button
                        aria-label={`Edit ${subtask.title}`}
                        className="text-[0.65rem] text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setEditingSubtaskId(subtask.id);
                          setEditedSubtaskTitle(subtask.title);
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Remove ${subtask.title}`}
                        className="text-muted-foreground hover:text-danger"
                        onClick={() => removeSubtask(subtask.id)}
                        type="button"
                      >
                        <X aria-hidden="true" size={14} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <form className="mt-4 flex gap-2" onSubmit={handleAddSubtask}>
              <Input
                aria-label="New subtask"
                className="min-h-9 text-xs"
                onChange={(event) => setSubtaskTitle(event.target.value)}
                placeholder="Add a subtask..."
                value={subtaskTitle}
              />
              <Button
                aria-label="Add subtask"
                disabled={!subtaskTitle.trim()}
                size="sm"
                type="submit"
              >
                <Plus aria-hidden="true" size={14} />
              </Button>
            </form>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Checklist</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {currentTask.checklist.filter((item) => item.completed).length} of{" "}
                  {currentTask.checklist.length} items complete
                </p>
              </div>
              <Badge variant="secondary">{checklistProgress}%</Badge>
            </div>
            <Progress
              className="mb-4 h-1.5"
              label="Checklist completion"
              value={checklistProgress}
            />
            <ul className="space-y-2">
              {currentTask.checklist.map((item) => (
                <li className="flex items-center gap-2" key={item.id}>
                  <input
                    aria-label={`Complete ${item.text}`}
                    checked={item.completed}
                    className="size-4 accent-primary"
                    onChange={() => toggleChecklistItem(item)}
                    type="checkbox"
                  />
                  <span
                    className={`min-w-0 flex-1 text-xs ${
                      item.completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    aria-label={`Remove ${item.text}`}
                    className="text-muted-foreground hover:text-danger"
                    onClick={() => removeChecklistItem(item.id)}
                    type="button"
                  >
                    <X aria-hidden="true" size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="mt-4 flex gap-2"
              onSubmit={addChecklistItem}
            >
              <Input
                aria-label="New checklist item"
                className="min-h-9 text-xs"
                onChange={(event) => setChecklistText(event.target.value)}
                placeholder="Add a checklist item..."
                value={checklistText}
              />
              <Button
                aria-label="Add checklist item"
                disabled={!checklistText.trim()}
                size="sm"
                type="submit"
              >
                <Plus aria-hidden="true" size={14} />
              </Button>
            </form>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle aria-hidden="true" className="text-primary" size={17} />
              <h2 className="text-sm font-semibold text-foreground">Comments</h2>
              <Badge variant="secondary">{currentTask.comments.length}</Badge>
            </div>
            <form className="relative space-y-2" onSubmit={addComment}>
              <label className="sr-only" htmlFor="task-comment">
                Add a comment
              </label>
              <textarea
                className="min-h-20 w-full resize-y rounded-control border border-border bg-surface px-3.5 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                id="task-comment"
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Share an update or ask a question..."
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
                      <span className="font-medium">{member.name}</span>
                      <span className="ml-auto text-[0.65rem] text-muted-foreground">@mention</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <Button disabled={!commentText.trim()} size="sm" type="submit">
                  <MessageCircle aria-hidden="true" size={14} />
                  Comment
                </Button>
              </div>
            </form>
            <ul className="mt-5 space-y-4">
              {currentTask.comments.map((comment) => (
                <li className="flex gap-3" key={comment.id}>
                  <Avatar name={comment.author} size="sm" />
                  <div className="min-w-0 flex-1 rounded-control bg-surface-muted/65 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        {comment.author}
                      </p>
                      <time
                        className="text-[0.625rem] text-muted-foreground"
                        dateTime={comment.createdAt}
                      >
                        {formatDateTime(comment.createdAt)}
                      </time>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          aria-label="Edit comment"
                          className="min-h-20 w-full resize-y rounded-control border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                          onChange={(event) => setEditedCommentText(event.target.value)}
                          value={editedCommentText}
                        />
                        <div className="flex justify-end gap-1">
                          <Button onClick={() => setEditingCommentId(null)} size="sm" variant="ghost">Cancel</Button>
                          <Button disabled={!editedCommentText.trim()} onClick={() => saveComment(comment.id)} size="sm">
                            <Check aria-hidden="true" size={13} />Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                          {renderCommentBody(comment.body, members)}
                        </p>
                        {comment.editedAt && (
                          <span className="mt-1 block text-[0.6rem] text-muted-foreground">Edited</span>
                        )}
                        {(comment.authorId === currentMember?.id ||
                          (!comment.authorId && comment.author === currentMember?.name)) && (
                          <div className="mt-2 flex justify-end gap-1">
                            <button
                              aria-label="Edit your comment"
                              className="inline-flex size-7 items-center justify-center rounded-control text-muted-foreground hover:bg-surface hover:text-primary"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditedCommentText(comment.body);
                              }}
                              type="button"
                            >
                              <Pencil aria-hidden="true" size={13} />
                            </button>
                            <button
                              aria-label="Delete your comment"
                              className="inline-flex size-7 items-center justify-center rounded-control text-muted-foreground hover:bg-danger-muted hover:text-danger"
                              onClick={() => deleteComment(comment.id)}
                              type="button"
                            >
                              <Trash2 aria-hidden="true" size={13} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {currentTask.comments.length === 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                No comments yet. Start the conversation with your team.
              </p>
            )}
          </Card>
        </section>

        <Card className="mt-4 p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Activity history
          </h2>
          {currentTask.activity.length ? (
            <ol className="space-y-3">
              {currentTask.activity.slice(0, 10).map((activity) => (
                <li className="flex items-start gap-3" key={activity.id}>
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 aria-hidden="true" size={14} />
                  </span>
                  <div>
                    <p className="text-xs leading-5 text-foreground">
                      <span className="font-semibold">{activity.actor}</span>{" "}
                      {activity.action}
                    </p>
                    <time
                      className="mt-1 block text-[0.65rem] text-muted-foreground"
                      dateTime={activity.createdAt}
                    >
                      {formatDateTime(activity.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-muted-foreground">
              Task changes will appear here.
            </p>
          )}
        </Card>
      </main>

      {editOpen && project && (
        <TaskFormDialog
          initialTask={currentTask}
          members={members}
          onClose={() => setEditOpen(false)}
          onSave={(updatedTask) =>
            updateDemoTask(activeWorkspace.id, currentTask.id, updatedTask)
          }
          projects={projects}
          workspaceId={activeWorkspace.id}
        />
      )}
      {deleteOpen && (
        <ConfirmDialog
          confirmLabel="Delete task"
          description={`“${currentTask.title}” will be permanently removed from this workspace. Project completion metrics will be updated.`}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete this task?"
        />
      )}
    </div>
  );
}

function renderCommentBody(body: string, members: { name: string }[]) {
  const memberNames = members
    .map((member) => member.name)
    .sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const mentionPattern = memberNames.length
    ? new RegExp(`@(?:${memberNames.join("|")})(?=$|[\\s.,!?])`, "g")
    : /$^/g;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of body.matchAll(mentionPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push(body.slice(cursor, index));
    parts.push(
      <span className="font-semibold text-primary" key={`${index}-${match[0]}`}>
        {match[0]}
      </span>,
    );
    cursor = index + match[0].length;
  }
  if (cursor < body.length) parts.push(body.slice(cursor));
  return parts;
}

function DetailValue({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[0.675rem] text-muted-foreground">{label}</p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
        {icon}
        {value}
      </p>
    </div>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-semibold text-foreground"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function statusVariant(status: TaskStatus) {
  return {
    "To Do": "secondary",
    "In Progress": "primary",
    "In Review": "warning",
    Done: "success",
  }[status] as "secondary" | "primary" | "warning" | "success";
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
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
