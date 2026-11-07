"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DemoProject, ProjectPriority } from "@/lib/project-demo-data";
import type { DemoMember } from "@/lib/workspace-demo-data";
import {
  taskLabels,
  taskStatuses,
  type DemoTask,
  type TaskLabel,
} from "@/lib/task-demo-data";

export function TaskFormDialog({
  initialTask,
  members,
  onClose,
  onSave,
  projects,
  workspaceId,
}: {
  initialTask?: DemoTask;
  members: DemoMember[];
  onClose: () => void;
  onSave: (task: DemoTask) => Promise<boolean>;
  projects: DemoProject[];
  workspaceId: string;
}) {
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(
    initialTask?.description ?? "",
  );
  const [projectId, setProjectId] = useState(
    initialTask?.projectId ?? projects[0]?.id ?? "",
  );
  const [assigneeId, setAssigneeId] = useState(initialTask?.assigneeId ?? "");
  const [priority, setPriority] = useState<ProjectPriority>(
    initialTask?.priority ?? "Medium",
  );
  const [status, setStatus] = useState(
    initialTask?.status ?? "To Do",
  );
  const [startDate, setStartDate] = useState(
    initialTask?.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? "");
  const [estimatedHours, setEstimatedHours] = useState(
    String(initialTask?.estimatedHours ?? 2),
  );
  const [labels, setLabels] = useState<TaskLabel[]>(
    initialTask?.labels ?? [],
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !projectId) {
      setError("Enter a task title and choose a project.");
      return;
    }
    if (!startDate || !dueDate) {
      setError("Choose both a start date and a due date.");
      return;
    }
    if (dueDate < startDate) {
      setError("The due date cannot be before the start date.");
      return;
    }
    const hours = Number(estimatedHours);
    if (!Number.isFinite(hours) || hours < 0) {
      setError("Estimated hours must be zero or more.");
      return;
    }
    const now = new Date().toISOString();
    const task: DemoTask = {
      id: initialTask?.id ?? crypto.randomUUID(),
      workspaceId,
      projectId,
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      priority,
      status,
      startDate,
      dueDate,
      labels,
      estimatedHours: hours,
      subtasks: initialTask?.subtasks ?? [],
      checklist: initialTask?.checklist ?? [],
      comments: initialTask?.comments ?? [],
      activity: initialTask?.activity ?? [],
      createdAt: initialTask?.createdAt ?? now,
    };
    setSaving(true);
    const saved = await onSave(task);
    setSaving(false);
    if (saved) onClose();
  }

  const selectClass =
    "min-h-10 w-full rounded-control border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        aria-labelledby="task-form-title"
        aria-modal="true"
        className="auth-enter max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-panel border border-border bg-surface p-5 shadow-popover sm:p-7"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-lg font-semibold tracking-tight text-foreground"
              id="task-form-title"
            >
              {initialTask ? "Edit task" : "Create a task"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Tasks are saved to a project in the active workspace.
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field htmlFor="task-title" label="Task title">
            <Input
              autoFocus
              id="task-title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Review customer feedback"
              required
              value={title}
            />
          </Field>
          <Field htmlFor="task-description" label="Description">
            <textarea
              className="min-h-20 w-full resize-y rounded-control border border-border bg-surface px-3.5 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              id="task-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add context and expected outcomes."
              value={description}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field htmlFor="task-project" label="Project">
              <select
                className={selectClass}
                id="task-project"
                onChange={(event) => setProjectId(event.target.value)}
                required
                value={projectId}
              >
                {projects.length === 0 && <option value="">No projects available</option>}
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field htmlFor="task-assignee" label="Assignee">
              <select
                className={selectClass}
                id="task-assignee"
                onChange={(event) => setAssigneeId(event.target.value)}
                value={assigneeId}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field htmlFor="task-priority" label="Priority">
              <select
                className={selectClass}
                id="task-priority"
                onChange={(event) =>
                  setPriority(event.target.value as ProjectPriority)
                }
                value={priority}
              >
                {(["Low", "Medium", "High", "Urgent"] as const).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field htmlFor="task-status" label="Status">
              <select
                className={selectClass}
                id="task-status"
                onChange={(event) =>
                  setStatus(event.target.value as typeof status)
                }
                value={status}
              >
                {taskStatuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field htmlFor="task-start" label="Start date">
              <Input
                id="task-start"
                onChange={(event) => setStartDate(event.target.value)}
                required
                type="date"
                value={startDate}
              />
            </Field>
            <Field htmlFor="task-due" label="Due date">
              <Input
                id="task-due"
                onChange={(event) => setDueDate(event.target.value)}
                required
                type="date"
                value={dueDate}
              />
            </Field>
            <Field htmlFor="task-estimate" label="Estimated hours">
              <Input
                id="task-estimate"
                min="0"
                onChange={(event) => setEstimatedHours(event.target.value)}
                step="0.5"
                type="number"
                value={estimatedHours}
              />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-foreground">
              Labels
            </legend>
            <div className="flex flex-wrap gap-2">
              {taskLabels.map((label) => (
                <label
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs transition ${
                    labels.includes(label)
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-surface-muted"
                  }`}
                  key={label}
                >
                  <input
                    checked={labels.includes(label)}
                    className="sr-only"
                    onChange={(event) =>
                      setLabels((current) =>
                        event.target.checked
                          ? [...current, label]
                          : current.filter((item) => item !== label),
                      )
                    }
                    type="checkbox"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p
              className="rounded-control bg-danger-muted px-3 py-2.5 text-xs text-danger"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button disabled={saving} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button disabled={saving || projects.length === 0} type="submit">
              {saving ? "Saving…" : initialTask ? "Save changes" : "Create task"}
            </Button>
          </div>
        </form>
      </section>
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
