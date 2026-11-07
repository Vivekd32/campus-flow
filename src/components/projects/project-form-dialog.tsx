"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  projectCategories,
  projectColors,
  projectPriorities,
  projectStatuses,
  type DemoProject,
} from "@/lib/project-demo-data";
import type { DemoMember } from "@/lib/workspace-demo-data";

export function ProjectFormDialog({
  initialProject,
  members,
  onClose,
  onSave,
}: {
  initialProject?: DemoProject;
  members: DemoMember[];
  onClose: () => void;
  onSave: (project: DemoProject) => Promise<boolean>;
}) {
  const [name, setName] = useState(initialProject?.name ?? "");
  const [description, setDescription] = useState(
    initialProject?.description ?? "",
  );
  const [category, setCategory] = useState(
    initialProject?.category ?? "Product",
  );
  const [status, setStatus] = useState(
    initialProject?.status ?? "Planning",
  );
  const [priority, setPriority] = useState(
    initialProject?.priority ?? "Medium",
  );
  const [startDate, setStartDate] = useState(
    initialProject?.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(initialProject?.dueDate ?? "");
  const [managerId, setManagerId] = useState(
    initialProject?.managerId ?? members[0]?.id ?? "",
  );
  const [memberIds, setMemberIds] = useState<string[]>(
    initialProject?.memberIds ?? (members[0] ? [members[0].id] : []),
  );
  const [color, setColor] = useState(initialProject?.color ?? "violet");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a project name.");
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
    setSaving(true);
    const now = new Date().toISOString();
    const project: DemoProject = {
      id: initialProject?.id ?? crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      category,
      status,
      priority,
      progress:
        status === "Completed" ? 100 : initialProject?.progress ?? 0,
      startDate,
      dueDate,
      managerId,
      memberIds,
      color,
      completedTasks: initialProject?.completedTasks ?? 0,
      totalTasks: initialProject?.totalTasks ?? 0,
      archived: initialProject?.archived ?? false,
      createdAt: initialProject?.createdAt ?? now,
      activity: initialProject?.activity ?? [],
    };
    const saved = await onSave(project);
    setSaving(false);
    if (saved) onClose();
  }

  const selectClass =
    "min-h-11 w-full rounded-control border border-border bg-surface px-3.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        aria-labelledby="project-form-title"
        aria-modal="true"
        className="auth-enter max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-panel border border-border bg-surface p-5 shadow-popover sm:p-7"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-lg font-semibold tracking-tight text-foreground"
              id="project-form-title"
            >
              {initialProject ? "Edit project" : "Create a project"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Set up project details for your current workspace.
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
          <Field label="Project name" htmlFor="project-name">
            <Input
              autoFocus
              id="project-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Customer portal"
              required
              value={name}
            />
          </Field>
          <Field label="Description" htmlFor="project-description">
            <textarea
              className="min-h-20 w-full resize-y rounded-control border border-border bg-surface px-3.5 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              id="project-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What outcome will this project deliver?"
              value={description}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="project-category">
              <select
                className={selectClass}
                id="project-category"
                onChange={(event) => setCategory(event.target.value as typeof category)}
                value={category}
              >
                {projectCategories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" htmlFor="project-status">
              <select
                className={selectClass}
                id="project-status"
                onChange={(event) => setStatus(event.target.value as typeof status)}
                value={status}
              >
                {projectStatuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority" htmlFor="project-priority">
              <select
                className={selectClass}
                id="project-priority"
                onChange={(event) =>
                  setPriority(event.target.value as typeof priority)
                }
                value={priority}
              >
                {projectPriorities.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Project manager" htmlFor="project-manager">
              <select
                className={selectClass}
                id="project-manager"
                onChange={(event) => setManagerId(event.target.value)}
                value={managerId}
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start date" htmlFor="project-start-date">
              <Input
                id="project-start-date"
                onChange={(event) => setStartDate(event.target.value)}
                required
                type="date"
                value={startDate}
              />
            </Field>
            <Field label="Due date" htmlFor="project-due-date">
              <Input
                id="project-due-date"
                onChange={(event) => setDueDate(event.target.value)}
                required
                type="date"
                value={dueDate}
              />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-foreground">
              Team members
            </legend>
            {members.length ? (
              <div className="grid max-h-32 gap-2 overflow-y-auto rounded-control border border-border p-3 sm:grid-cols-2">
                {members.map((member) => (
                  <label
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                    key={member.id}
                  >
                    <input
                      checked={memberIds.includes(member.id)}
                      className="accent-primary"
                      onChange={(event) =>
                        setMemberIds((current) =>
                          event.target.checked
                            ? [...current, member.id]
                            : current.filter((id) => id !== member.id),
                        )
                      }
                      type="checkbox"
                    />
                    {member.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="rounded-control bg-surface-muted px-3 py-2.5 text-xs text-muted-foreground">
                No workspace members are available to assign.
              </p>
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-foreground">
              Project color
            </legend>
            <div className="flex flex-wrap gap-3">
              {projectColors.map((item) => (
                <label className="cursor-pointer" key={item}>
                  <input
                    checked={color === item}
                    className="sr-only"
                    name="project-color"
                    onChange={() => setColor(item)}
                    type="radio"
                    value={item}
                  />
                  <span
                    aria-label={`${item} project color`}
                    className={`block size-7 rounded-full ring-offset-2 ring-offset-surface ${
                      color === item ? "ring-2 ring-primary" : ""
                    } ${colorClasses[item]}`}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="rounded-control bg-danger-muted px-3 py-2.5 text-xs text-danger" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button disabled={saving} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button disabled={saving} type="submit">
              {saving ? "Saving…" : initialProject ? "Save changes" : "Create project"}
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

const colorClasses = {
  violet: "bg-violet-500",
  indigo: "bg-indigo-500",
  blue: "bg-sky-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};
