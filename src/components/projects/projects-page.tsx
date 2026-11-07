"use client";

import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FolderKanban,
  Grid2X2,
  List,
  MoreHorizontal,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
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
import {
  projectPriorities,
  projectStatuses,
  getTodayServerSnapshot,
  getTodaySnapshot,
  subscribeToDateChange,
  type DemoProject,
  type ProjectPriority,
  type ProjectStatus,
} from "@/lib/project-demo-data";
import {
  createDemoProject,
  duplicateDemoProject,
  removeDemoProject,
  updateDemoProject,
} from "@/lib/workspace-demo-store";
import { ProjectFormDialog } from "./project-form-dialog";

type ViewMode = "grid" | "list";
type SortMode = "deadline" | "recent";

export function ProjectsPage() {
  const { activeWorkspace, isHydrated, members, projects } = useWorkspaceDemo();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [sortMode, setSortMode] = useState<SortMode>("deadline");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showArchived, setShowArchived] = useState(false);
  const today = useSyncExternalStore(
    subscribeToDateChange,
    getTodaySnapshot,
    getTodayServerSnapshot,
  );
  const [dialogProject, setDialogProject] = useState<DemoProject | null | false>(
    false,
  );
  const [deletingProject, setDeletingProject] = useState<DemoProject | null>(
    null,
  );

  const visibleProjects = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects
      .filter((project) => project.archived === showArchived)
      .filter(
        (project) =>
          statusFilter === "All statuses" || project.status === statusFilter,
      )
      .filter(
        (project) =>
          priorityFilter === "All priorities" ||
          project.priority === priorityFilter,
      )
      .filter(
        (project) =>
          !needle ||
          `${project.name} ${project.description} ${project.category}`
            .toLowerCase()
            .includes(needle),
      )
      .sort((a, b) =>
        sortMode === "deadline"
          ? a.dueDate.localeCompare(b.dueDate)
          : b.createdAt.localeCompare(a.createdAt),
      );
  }, [projects, priorityFilter, query, showArchived, sortMode, statusFilter]);

  const currentProjects = projects.filter((project) => !project.archived);
  const overdueCount = currentProjects.filter(
    (project) =>
      today !== "" &&
      project.status !== "Completed" &&
      project.dueDate < today,
  ).length;

  async function saveProject(project: DemoProject) {
    if (!activeWorkspace) return false;
    if (dialogProject) {
      return updateDemoProject(activeWorkspace.id, project.id, project);
    }
    return createDemoProject(activeWorkspace.id, project);
  }

  if (!isHydrated || !activeWorkspace) {
    return (
      <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground" role="status">
        Loading workspace projects…
      </div>
    );
  }

  const selectClass =
    "min-h-9 rounded-control border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-[88rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
          <div className="flex items-center gap-4">
            <Brand />
            <span className="hidden h-6 w-px bg-border sm:block" />
            <Link
              className="hidden items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground sm:inline-flex"
              href="/dashboard"
            >
              <ArrowLeft aria-hidden="true" size={14} />
              Dashboard
            </Link>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-xs">
            <span className={`size-2 rounded-full ${activeWorkspace.color}`} />
            <span className="max-w-40 truncate font-medium text-muted-foreground">
              {activeWorkspace.name}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[88rem] px-4 pb-14 pt-7 sm:px-6 lg:px-9 lg:pt-10">
        <div className="mb-6 hidden items-center gap-2 text-[0.7rem] text-muted-foreground sm:flex">
          <Link className="hover:text-foreground" href="/dashboard">
            Workspace
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-foreground">Projects</span>
        </div>
        <DemoPersistenceNotice />

        <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="mb-3" variant="primary">
              <FolderKanban aria-hidden="true" size={13} />
              Project management
            </Badge>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.9rem]">
              Projects
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
              Plan work, keep teams aligned, and track progress across{" "}
              {activeWorkspace.name}.
            </p>
          </div>
          <Button
            className="w-full shadow-[0_8px_20px_-10px_var(--primary)] sm:w-auto"
            onClick={() => setDialogProject(null)}
          >
            <Plus aria-hidden="true" size={16} />
            Create project
          </Button>
        </section>

        <section
          aria-label="Project statistics"
          className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <Metric label="Total projects" value={currentProjects.length} icon={FolderKanban} />
          <Metric
            label="Active"
            value={currentProjects.filter((project) => project.status === "Active").length}
            icon={ArrowUpDown}
          />
          <Metric
            label="Completed"
            value={currentProjects.filter((project) => project.status === "Completed").length}
            icon={CheckCircle2}
          />
          <Metric label="Overdue" value={overdueCount} icon={CircleAlert} />
        </section>

        <Card className="mb-5 p-3 sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative min-w-0 flex-1 xl:max-w-sm">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={15}
              />
              <Input
                aria-label="Search projects"
                className="min-h-9 pl-9 text-xs"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects..."
                type="search"
                value={query}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter by status"
                className={selectClass}
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option>All statuses</option>
                {projectStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <select
                aria-label="Filter by priority"
                className={selectClass}
                onChange={(event) => setPriorityFilter(event.target.value)}
                value={priorityFilter}
              >
                <option>All priorities</option>
                {projectPriorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
              <label className="flex min-h-9 items-center gap-2 rounded-control border border-border px-3 text-xs text-muted-foreground">
                <ArrowDownWideNarrow aria-hidden="true" size={14} />
                <span className="sr-only">Sort projects</span>
                <select
                  aria-label="Sort projects"
                  className="max-w-36 bg-transparent text-xs text-foreground outline-none"
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  value={sortMode}
                >
                  <option value="deadline">Due date</option>
                  <option value="recent">Recently created</option>
                </select>
              </label>
              <div aria-label="Project view" className="inline-flex rounded-control border border-border p-0.5">
                <ViewButton
                  active={viewMode === "grid"}
                  label="Grid view"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid2X2 aria-hidden="true" size={15} />
                </ViewButton>
                <ViewButton
                  active={viewMode === "list"}
                  label="List view"
                  onClick={() => setViewMode("list")}
                >
                  <List aria-hidden="true" size={15} />
                </ViewButton>
              </div>
              <button
                aria-pressed={showArchived}
                className={`min-h-9 rounded-control px-3 text-xs font-medium transition ${
                  showArchived
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-muted"
                }`}
                onClick={() => setShowArchived((value) => !value)}
                type="button"
              >
                {showArchived ? "Archived" : "Show archived"}
              </button>
            </div>
          </div>
        </Card>

        {visibleProjects.length ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {visibleProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  members={members}
                  onArchive={() =>
                    updateDemoProject(activeWorkspace.id, project.id, {
                      archived: !project.archived,
                    })
                  }
                  onDelete={() => setDeletingProject(project)}
                  onDuplicate={() =>
                    duplicateDemoProject(activeWorkspace.id, project.id)
                  }
                  onEdit={() => setDialogProject(project)}
                  project={project}
                />
              ))}
            </div>
          ) : (
            <ProjectTable
              members={members}
              onEdit={setDialogProject}
              projects={visibleProjects}
            />
          )
        ) : (
          <Card className="px-5 py-14 text-center">
            <FolderKanban
              aria-hidden="true"
              className="mx-auto text-muted-foreground"
              size={24}
            />
            <h2 className="mt-3 text-sm font-semibold text-foreground">
              {showArchived ? "No archived projects" : "No projects found"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Adjust your filters or create a project for this workspace.
            </p>
            {!showArchived && (
              <Button className="mt-4" onClick={() => setDialogProject(null)} size="sm">
                <Plus aria-hidden="true" size={14} />
                Create project
              </Button>
            )}
          </Card>
        )}
      </main>

      {dialogProject !== false && (
        <ProjectFormDialog
          initialProject={dialogProject ?? undefined}
          members={members}
          onClose={() => setDialogProject(false)}
          onSave={saveProject}
        />
      )}
      {deletingProject && (
        <ConfirmDialog
          confirmLabel="Delete project"
          description={`“${deletingProject.name}” will be permanently removed from this workspace. This cannot be undone.`}
          onCancel={() => setDeletingProject(null)}
          onConfirm={() => {
            removeDemoProject(activeWorkspace.id, deletingProject.id);
            setDeletingProject(null);
          }}
          title="Delete this project?"
        />
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon aria-hidden="true" size={16} />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </Card>
  );
}

function ViewButton({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`flex size-8 items-center justify-center rounded-control transition ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-surface-muted"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ProjectCard({
  members,
  onArchive,
  onDelete,
  onDuplicate,
  onEdit,
  project,
}: {
  members: { id: string; name: string }[];
  onArchive: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  project: DemoProject;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const manager = members.find((member) => member.id === project.managerId);
  return (
    <Card className="group relative overflow-visible p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-popover sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <Link
          className="flex min-w-0 items-center gap-3"
          href={`/projects/${project.id}`}
        >
          <ProjectMark color={project.color} />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground transition group-hover:text-primary">
              {project.name}
            </h2>
            <p className="mt-0.5 text-[0.675rem] text-muted-foreground">
              {project.category}
            </p>
          </div>
        </Link>
        <div className="relative">
          <button
            aria-expanded={menuOpen}
            aria-label={`Actions for ${project.name}`}
            className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <MoreHorizontal aria-hidden="true" size={17} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-40 rounded-control border border-border bg-surface p-1 shadow-popover">
              <MenuAction
                label="Edit project"
                onClick={() => {
                  onEdit();
                  setMenuOpen(false);
                }}
              />
              <MenuAction
                label="Duplicate"
                onClick={() => {
                  onDuplicate();
                  setMenuOpen(false);
                }}
              />
              <MenuAction
                label={project.archived ? "Unarchive" : "Archive"}
                onClick={() => {
                  onArchive();
                  setMenuOpen(false);
                }}
              />
              <MenuAction
                danger
                label="Delete"
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <Link
        className="block"
        href={`/projects/${project.id}`}
      >
        <p className="min-h-10 text-xs leading-5 text-muted-foreground">
          {project.description || "No description provided."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <PriorityBadge priority={project.priority} />
          {project.archived && <Badge variant="outline">Archived</Badge>}
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[0.6875rem]">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{project.progress}%</span>
          </div>
          <Progress
            className="h-1.5"
            label={`${project.name} progress`}
            value={project.progress}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3.5 text-[0.675rem]">
          <div>
            <p className="text-muted-foreground">Due date</p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-medium text-foreground">
              <CalendarDays aria-hidden="true" size={13} />
              {formatDate(project.dueDate)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Tasks</p>
            <p className="mt-1 font-medium text-foreground">
              {project.completedTasks}/{project.totalTasks} complete
            </p>
          </div>
        </div>
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[0.675rem] text-muted-foreground">
          <UsersRound aria-hidden="true" size={13} />
          {manager?.name ?? "No project manager"}
        </span>
        <AvatarGroup
          members={members.filter((member) =>
            project.memberIds.includes(member.id),
          )}
        />
      </div>
    </Card>
  );
}

function ProjectTable({
  members,
  onEdit,
  projects,
}: {
  members: { id: string; name: string }[];
  onEdit: (project: DemoProject) => void;
  projects: DemoProject[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-border bg-surface-muted/60 text-[0.675rem] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Progress</th>
              <th className="px-4 py-3 font-semibold">Manager</th>
              <th className="px-4 py-3 font-semibold">Due date</th>
              <th className="px-4 py-3 font-semibold">Tasks</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {projects.map((project) => (
              <tr className="transition hover:bg-surface-muted/40" key={project.id}>
                <td className="px-4 py-3">
                  <Link
                    className="font-semibold text-foreground hover:text-primary"
                    href={`/projects/${project.id}`}
                  >
                    {project.name}
                  </Link>
                  <p className="mt-1 text-[0.675rem] text-muted-foreground">
                    {project.category}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={project.priority} />
                </td>
                <td className="min-w-36 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Progress
                      className="h-1.5 flex-1"
                      label={`${project.name} progress`}
                      value={project.progress}
                    />
                    <span>{project.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {members.find((member) => member.id === project.managerId)?.name ??
                    "Unassigned"}
                </td>
                <td className="px-4 py-3">{formatDate(project.dueDate)}</td>
                <td className="px-4 py-3">
                  {project.completedTasks}/{project.totalTasks}
                </td>
                <td className="px-4 py-3">
                  <Button
                    onClick={() => onEdit(project)}
                    size="sm"
                    variant="outline"
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
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
    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
      <FolderKanban aria-hidden="true" size={18} />
    </span>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const variants: Record<ProjectStatus, "secondary" | "success" | "warning" | "primary"> = {
    Planning: "secondary",
    Active: "success",
    "On Hold": "warning",
    Completed: "primary",
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  const variants: Record<ProjectPriority, "default" | "primary" | "warning" | "danger"> = {
    Low: "default",
    Medium: "primary",
    High: "warning",
    Urgent: "danger",
  };
  return <Badge variant={variants[priority]}>{priority}</Badge>;
}

function AvatarGroup({
  members,
}: {
  members: { id: string; name: string }[];
}) {
  return (
    <div aria-label={`${members.length} team members`} className="flex -space-x-2">
      {members.slice(0, 3).map((member) => (
        <Avatar
          className="ring-2 ring-surface"
          key={member.id}
          name={member.name}
          size="sm"
        />
      ))}
      {members.length > 3 && (
        <span className="flex size-6 items-center justify-center rounded-full bg-surface-muted text-[0.55rem] font-semibold text-muted-foreground ring-2 ring-surface">
          +{members.length - 3}
        </span>
      )}
    </div>
  );
}

function MenuAction({
  danger = false,
  label,
  onClick,
}: {
  danger?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`block w-full rounded px-2.5 py-2 text-left text-xs transition hover:bg-surface-muted ${
        danger ? "text-danger" : "text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function formatDate(value: string) {
  if (!value) return "Not set";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
