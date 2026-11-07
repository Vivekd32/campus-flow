"use client";

import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  KanbanSquare,
  List,
  Plus,
  Search,
  SquareCheckBig,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Brand } from "@/components/brand";
import { DemoPersistenceNotice } from "@/components/settings/demo-persistence-notice";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import {
  getTodayServerSnapshot,
  getTodaySnapshot,
  subscribeToDateChange,
} from "@/lib/project-demo-data";
import { taskStatuses, type DemoTask, type TaskStatus } from "@/lib/task-demo-data";
import {
  createDemoTask,
  updateDemoTask,
} from "@/lib/workspace-demo-store";
import { TaskFormDialog } from "./task-form-dialog";

type ViewMode = "board" | "list";
type SortMode = "dueDate" | "priority";

const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

export function TasksPage() {
  const { activeWorkspace, isHydrated, members, projects, tasks } =
    useWorkspaceDemo();
  const today = useSyncExternalStore(
    subscribeToDateChange,
    getTodaySnapshot,
    getTodayServerSnapshot,
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [assigneeFilter, setAssigneeFilter] = useState("All assignees");
  const [projectFilter, setProjectFilter] = useState("All projects");
  const [sortMode, setSortMode] = useState<SortMode>("dueDate");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [dialogTask, setDialogTask] = useState<DemoTask | null | false>(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const previousOverflowX = root.style.overflowX;
    root.style.overflowX = "clip";
    return () => {
      root.style.overflowX = previousOverflowX;
    };
  }, []);

  const availableProjects = projects.filter((project) => !project.archived);
  const availableProjectIds = new Set(availableProjects.map((project) => project.id));
  const activeTasks = tasks.filter((task) =>
    availableProjectIds.has(task.projectId),
  );
  const filteredTasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activeTasks
      .filter(
        (task) => statusFilter === "All statuses" || task.status === statusFilter,
      )
      .filter(
        (task) =>
          priorityFilter === "All priorities" ||
          task.priority === priorityFilter,
      )
      .filter(
        (task) =>
          assigneeFilter === "All assignees" ||
          task.assigneeId === assigneeFilter,
      )
      .filter(
        (task) =>
          projectFilter === "All projects" ||
          task.projectId === projectFilter,
      )
      .filter((task) => {
        const projectName =
          projects.find((project) => project.id === task.projectId)?.name ?? "";
        const assigneeName =
          members.find((member) => member.id === task.assigneeId)?.name ?? "";
        return (
          !needle ||
          `${task.title} ${task.description} ${projectName} ${assigneeName} ${task.labels.join(" ")}`
            .toLowerCase()
            .includes(needle)
        );
      })
      .sort((a, b) =>
        sortMode === "dueDate"
          ? a.dueDate.localeCompare(b.dueDate)
          : priorityOrder[a.priority] - priorityOrder[b.priority],
      );
  }, [
    activeTasks,
    assigneeFilter,
    members,
    priorityFilter,
    projectFilter,
    projects,
    query,
    sortMode,
    statusFilter,
  ]);
  const count = (status: TaskStatus) =>
    activeTasks.filter((task) => task.status === status).length;
  const overdueCount = activeTasks.filter(
    (task) => task.status !== "Done" && today && task.dueDate < today,
  ).length;

  async function saveTask(task: DemoTask) {
    if (!activeWorkspace) return false;
    if (dialogTask) {
      return updateDemoTask(activeWorkspace.id, task.id, task);
    }
    return createDemoTask(activeWorkspace.id, task);
  }

  function changeStatus(taskId: string, status: TaskStatus) {
    if (!activeWorkspace) return;
    updateDemoTask(activeWorkspace.id, taskId, { status });
  }

  if (!isHydrated || !activeWorkspace) {
    return (
      <div
        className="min-h-screen bg-background p-6 text-sm text-muted-foreground"
        role="status"
      >
        Loading workspace tasks…
      </div>
    );
  }

  const selectClass =
    "min-h-9 rounded-control border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
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
          <span className="max-w-40 truncate text-xs font-medium text-muted-foreground">
            {activeWorkspace.name}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-[100rem] overflow-x-clip px-4 pb-14 pt-7 sm:px-6 lg:px-9 lg:pt-10">
        <div className="mb-6 hidden items-center gap-2 text-[0.7rem] text-muted-foreground sm:flex">
          <Link className="hover:text-foreground" href="/dashboard">
            Workspace
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-foreground">My Tasks</span>
        </div>
        <DemoPersistenceNotice />

        <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="mb-3" variant="primary">
              <SquareCheckBig aria-hidden="true" size={13} />
              Task management
            </Badge>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.9rem]">
              My Tasks
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
              Keep work moving across projects in {activeWorkspace.name}.
            </p>
          </div>
          <Button
            className="w-full shadow-[0_8px_20px_-10px_var(--primary)] sm:w-auto"
            disabled={availableProjects.length === 0}
            onClick={() => setDialogTask(null)}
          >
            <Plus aria-hidden="true" size={16} />
            Create task
          </Button>
        </section>

        <section
          aria-label="Task statistics"
          className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
        >
          <Metric icon={KanbanSquare} label="Total tasks" value={activeTasks.length} />
          <Metric icon={Clock3} label="To Do" value={count("To Do")} />
          <Metric icon={ArrowUpDown} label="In Progress" value={count("In Progress")} />
          <Metric icon={CheckCircle2} label="Completed" value={count("Done")} />
          <Metric icon={CircleAlert} label="Overdue" value={overdueCount} />
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
                aria-label="Search tasks"
                className="min-h-9 pl-9 text-xs"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks, projects, labels..."
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
                {taskStatuses.map((status) => (
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
                {(["Urgent", "High", "Medium", "Low"] as const).map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
              <select
                aria-label="Filter by assignee"
                className={selectClass}
                onChange={(event) => setAssigneeFilter(event.target.value)}
                value={assigneeFilter}
              >
                <option>All assignees</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by project"
                className={selectClass}
                onChange={(event) => setProjectFilter(event.target.value)}
                value={projectFilter}
              >
                <option>All projects</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <label className="flex min-h-9 items-center gap-2 rounded-control border border-border px-3 text-xs text-muted-foreground">
                <ArrowDownWideNarrow aria-hidden="true" size={14} />
                <span className="sr-only">Sort tasks</span>
                <select
                  aria-label="Sort tasks"
                  className="max-w-32 bg-transparent text-xs text-foreground outline-none"
                  onChange={(event) =>
                    setSortMode(event.target.value as SortMode)
                  }
                  value={sortMode}
                >
                  <option value="dueDate">Due date</option>
                  <option value="priority">Priority</option>
                </select>
              </label>
              <div aria-label="Task view" className="inline-flex rounded-control border border-border p-0.5">
                <ViewButton
                  active={viewMode === "board"}
                  label="Kanban board"
                  onClick={() => setViewMode("board")}
                >
                  <KanbanSquare aria-hidden="true" size={15} />
                </ViewButton>
                <ViewButton
                  active={viewMode === "list"}
                  label="List view"
                  onClick={() => setViewMode("list")}
                >
                  <List aria-hidden="true" size={15} />
                </ViewButton>
              </div>
            </div>
          </div>
        </Card>

        {viewMode === "board" ? (
          <section
            aria-label="Kanban board"
            className="w-full min-w-0 max-w-full flex items-start gap-3 overflow-x-auto pb-3 xl:grid xl:grid-cols-4"
          >
            {taskStatuses.map((status) => {
              const columnTasks = filteredTasks.filter(
                (task) => task.status === status,
              );
              return (
                <div
                  aria-label={`Drop tasks into ${status}`}
                  className={`min-h-[20rem] w-[min(85vw,21rem)] shrink-0 rounded-card border p-3 transition-colors xl:w-auto xl:min-w-0 ${
                    draggingTaskId
                      ? "border-primary/30 bg-primary/[0.025]"
                      : "border-border bg-surface-muted/45"
                  }`}
                  key={status}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const taskId =
                      event.dataTransfer.getData("text/plain") ||
                      draggingTaskId;
                    if (taskId) changeStatus(taskId, status);
                    setDraggingTaskId(null);
                  }}
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <h2 className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <span className={`size-2 rounded-full ${statusDot(status)}`} />
                      {status}
                    </h2>
                    <span className="rounded-pill bg-surface px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </div>
                  <div className="max-h-[calc(100vh-20rem)] min-h-24 space-y-2.5 overflow-y-auto">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        members={members}
                        onDragEnd={() => setDraggingTaskId(null)}
                        onDragStart={() => setDraggingTaskId(task.id)}
                        onStatusChange={(nextStatus) =>
                          changeStatus(task.id, nextStatus)
                        }
                        projects={projects}
                        task={task}
                      />
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="flex min-h-24 items-center justify-center rounded-control border border-dashed border-border px-3 text-center text-xs text-muted-foreground">
                        Drop a task here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <TaskTable
            members={members}
            onEdit={setDialogTask}
            projects={projects}
            tasks={filteredTasks}
          />
        )}
        {filteredTasks.length === 0 && (
          <Card className="mt-4 p-8 text-center">
            <Search
              aria-hidden="true"
              className="mx-auto text-muted-foreground"
              size={22}
            />
            <p className="mt-3 text-sm font-semibold text-foreground">
              No tasks match these filters
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {availableProjects.length === 0
                ? "Create a project before adding tasks to this workspace."
                : "Clear a filter or create a task in an active project."}
            </p>
            {availableProjects.length === 0 && (
              <Link
                className="mt-3 inline-flex text-xs font-semibold text-primary hover:text-primary-hover"
                href="/projects"
              >
                Go to projects <ArrowLeft aria-hidden="true" className="ml-1 rotate-180" size={13} />
              </Link>
            )}
          </Card>
        )}
      </main>

      {dialogTask !== false && (
        <TaskFormDialog
          initialTask={dialogTask ?? undefined}
          members={members}
          onClose={() => setDialogTask(false)}
          onSave={saveTask}
          projects={availableProjects}
          workspaceId={activeWorkspace.id}
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
  icon: typeof KanbanSquare;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4">
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

function TaskCard({
  members,
  onDragEnd,
  onDragStart,
  onStatusChange,
  projects,
  task,
}: {
  members: { id: string; name: string }[];
  onDragEnd: () => void;
  onDragStart: () => void;
  onStatusChange: (status: TaskStatus) => void;
  projects: { id: string; name: string }[];
  task: DemoTask;
}) {
  const project = projects.find((item) => item.id === task.projectId);
  const assignee = members.find((member) => member.id === task.assigneeId);
  const completedSubtasks = task.subtasks.filter((item) => item.completed).length;
  return (
    <Card
      className="group cursor-grab p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-popover active:cursor-grabbing"
      draggable
      onDragEnd={onDragEnd}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link
          className="text-xs font-semibold leading-5 text-foreground hover:text-primary"
          href={`/tasks/${task.id}`}
        >
          {task.title}
        </Link>
        <PriorityBadge priority={task.priority} />
      </div>
      <Link
        className="mb-3 block truncate text-[0.675rem] font-medium text-muted-foreground hover:text-primary"
        href={`/projects/${task.projectId}`}
      >
        {project?.name ?? "Project"}
      </Link>
      {task.labels.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <Badge className="px-2 py-0.5 text-[0.6rem]" key={label} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
      )}
      <div className="mb-3 flex items-center justify-between text-[0.65rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarDays aria-hidden="true" size={12} />
          {formatDate(task.dueDate)}
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 aria-hidden="true" size={12} />
          {completedSubtasks}/{task.subtasks.length}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <label className="sr-only" htmlFor={`task-status-${task.id}`}>
          Change status for {task.title}
        </label>
        <select
          className="max-w-32 rounded-control bg-transparent py-1 text-[0.65rem] text-muted-foreground outline-none focus:text-foreground"
          id={`task-status-${task.id}`}
          onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
          onClick={(event) => event.stopPropagation()}
          value={task.status}
        >
          {taskStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        {assignee ? (
          <Avatar name={assignee.name} size="sm" />
        ) : (
          <span className="text-[0.625rem] text-muted-foreground">Unassigned</span>
        )}
      </div>
    </Card>
  );
}

function TaskTable({
  members,
  onEdit,
  projects,
  tasks,
}: {
  members: { id: string; name: string }[];
  onEdit: (task: DemoTask) => void;
  projects: { id: string; name: string }[];
  tasks: DemoTask[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="border-b border-border bg-surface-muted/60 text-[0.675rem] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Task</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Assignee</th>
              <th className="px-4 py-3 font-semibold">Due date</th>
              <th className="px-4 py-3 font-semibold">Subtasks</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr className="transition hover:bg-surface-muted/40" key={task.id}>
                <td className="px-4 py-3">
                  <Link
                    className="font-semibold text-foreground hover:text-primary"
                    href={`/tasks/${task.id}`}
                  >
                    {task.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {task.labels.map((label) => (
                      <Badge className="px-1.5 py-0 text-[0.55rem]" key={label} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {projects.find((project) => project.id === task.projectId)?.name}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3">
                  {members.find((member) => member.id === task.assigneeId)?.name ??
                    "Unassigned"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{formatDate(task.dueDate)}</td>
                <td className="px-4 py-3">
                  {task.subtasks.filter((item) => item.completed).length}/
                  {task.subtasks.length}
                </td>
                <td className="px-4 py-3">
                  <Button onClick={() => onEdit(task)} size="sm" variant="outline">
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

function PriorityBadge({ priority }: { priority: DemoTask["priority"] }) {
  const variants = {
    Low: "default",
    Medium: "primary",
    High: "warning",
    Urgent: "danger",
  } as const;
  return <Badge variant={variants[priority]}>{priority}</Badge>;
}

function statusVariant(status: TaskStatus) {
  return {
    "To Do": "secondary",
    "In Progress": "primary",
    "In Review": "warning",
    Done: "success",
  }[status] as "secondary" | "primary" | "warning" | "success";
}

function statusDot(status: TaskStatus) {
  return {
    "To Do": "bg-slate-400",
    "In Progress": "bg-primary",
    "In Review": "bg-warning",
    Done: "bg-success",
  }[status];
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}
