"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  FilePlus2,
  FolderKanban,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import {
  getTodayServerSnapshot,
  getTodaySnapshot,
  subscribeToDateChange,
} from "@/lib/project-demo-data";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { DemoPersistenceNotice } from "@/components/settings/demo-persistence-notice";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import {
  markAllDemoNotificationsRead,
  markDemoNotificationRead,
  signOut,
  switchWorkspace as switchDemoWorkspace,
} from "@/lib/workspace-demo-store";
import {
  dashboardStats,
  sidebarItems,
  type DashboardProject,
} from "@/lib/dashboard-demo-data";
import { createDemoProject } from "@/lib/workspace-demo-store";
import type { DemoTask } from "@/lib/task-demo-data";
import type { DemoActivityEvent } from "@/lib/workspace-demo-data";

type Popover = "workspace" | "notifications" | "profile" | "help" | null;
type ProjectStatus = DashboardProject["status"];

const statusVariants: Record<
  ProjectStatus,
  "success" | "warning" | "primary" | "secondary"
> = {
  Planning: "secondary",
  Active: "success",
  "On Hold": "warning",
  Completed: "primary",
};

const statusColors: Record<ProjectStatus, "primary" | "warning" | "success"> = {
  Planning: "primary",
  Active: "success",
  "On Hold": "warning",
  Completed: "primary",
};
const themeChangeEvent = "campusflow-theme-change";

function subscribeToTheme(callback: () => void) {
  window.addEventListener(themeChangeEvent, callback);
  return () => window.removeEventListener(themeChangeEvent, callback);
}

function getThemeSnapshot() {
  return document.documentElement.dataset.theme === "dark";
}

function getServerThemeSnapshot() {
  return false;
}

function notifyThemeChange() {
  window.dispatchEvent(new Event(themeChangeEvent));
}

function getWorkspaceInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function DashboardShell() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activePopover, setActivePopover] = useState<Popover>(null);
  const [query, setQuery] = useState("");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const {
    activeWorkspace,
    activities,
    currentUser,
    isHydrated,
    workspaces,
    projects,
    members,
    tasks,
    events,
    notifications,
  } =
    useWorkspaceDemo();
  const today = useSyncExternalStore(
    subscribeToDateChange,
    getTodaySnapshot,
    getTodayServerSnapshot,
  );
  const darkMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = window.localStorage.getItem("campusflow-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = savedTheme ? savedTheme === "dark" : prefersDark;
    root.dataset.theme = useDark ? "dark" : "light";
    notifyThemeChange();
  }, []);

  useEffect(() => {
    if (!projectDialogOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProjectDialogOpen(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [projectDialogOpen]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return projects.filter((project) => !project.archived).slice(0, 3);
    }
    return projects.filter((project) => !project.archived).filter((project) =>
      `${project.name} ${project.description} ${project.status}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [projects, query]);
  const activeProjects = projects.filter(
    (project) => !project.archived && project.status === "Active",
  ).length;
  const completedProjects = projects.filter(
    (project) => !project.archived && project.status === "Completed",
  ).length;
  const overdueProjects = projects.filter(
    (project) =>
      !project.archived &&
      project.status !== "Completed" &&
      today !== "" &&
      project.dueDate < today,
  ).length;
  const activeWorkspaceTasks = tasks.filter((task) =>
    projects.some(
      (project) => project.id === task.projectId && !project.archived,
    ),
  );
  const openTaskCount = activeWorkspaceTasks.filter(
    (task) => task.status !== "Done",
  ).length;
  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const upcomingEvents = events
    .filter((event) => !today || event.startsAt.slice(0, 10) >= today)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 3);
  const weeklyCompletions = useMemo(() => {
    const baseDate = new Date(`${today || "1970-01-01"}T12:00:00`);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() - (6 - index));
      const dateKey = date.toISOString().slice(0, 10);
      return {
        day: date.toLocaleDateString("en", { weekday: "short" }),
        count: activeWorkspaceTasks.reduce(
          (total, task) =>
            total +
            task.activity.filter(
              (item) =>
                item.action === "completed the task" &&
                item.createdAt.slice(0, 10) === dateKey,
            ).length,
          0,
        ),
      };
    });
  }, [activeWorkspaceTasks, today]);

  function toggleTheme() {
    const nextDarkMode = !darkMode;
    document.documentElement.dataset.theme = nextDarkMode ? "dark" : "light";
    window.localStorage.setItem("campusflow-theme", nextDarkMode ? "dark" : "light");
    notifyThemeChange();
    setActivePopover(null);
  }

  function togglePopover(popover: Exclude<Popover, null>) {
    setActivePopover((current) => (current === popover ? null : popover));
  }

  if (!isHydrated || !activeWorkspace) {
    return (
      <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
        <div className="mx-auto max-w-3xl">
          <DemoPersistenceNotice />
          <Card className="p-6 text-sm text-muted-foreground" role="status">
            {!isHydrated
              ? "Loading your company workspace…"
              : "This account is not part of a company workspace yet. If you were invited, review your invitations or contact a workspace owner."}
            {isHydrated && (
              <Link
                className="mt-3 inline-flex items-center gap-2 font-semibold text-primary hover:text-primary-hover"
                href="/invitations"
              >
                <Mail aria-hidden="true" size={14} />
                Review workspace invitations
              </Link>
            )}
          </Card>
        </div>
      </main>
    );
  }

  return (
    <div className="dashboard-app flex min-h-screen bg-background text-foreground">
      {mobileNavOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileNavOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`dashboard-sidebar fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-border bg-surface transition-[width,transform] duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-[5rem]" : "md:w-[17rem]"}`}
      >
        <div className="flex h-[4.5rem] items-center justify-between px-5">
          {!collapsed && <Brand className="gap-2" />}
          {collapsed && (
            <Brand className="mx-auto [&>span:last-child]:hidden" />
          )}
          <button
            aria-label="Close navigation"
            className="inline-flex size-9 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted md:hidden"
            onClick={() => setMobileNavOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="relative px-3 pb-5">
          <button
            aria-expanded={activePopover === "workspace"}
            aria-label="Choose workspace"
            className={`flex min-h-12 w-full items-center gap-3 rounded-control border border-border/80 bg-surface-muted/65 px-2.5 text-left transition hover:border-primary/30 hover:bg-surface-muted ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
            onClick={() => togglePopover("workspace")}
            type="button"
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-[0.65rem] text-[0.65rem] font-bold text-white ${activeWorkspace.color}`}
            >
              {getWorkspaceInitials(activeWorkspace.name)}
            </span>
            <span className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
              <span className="block truncate text-xs font-semibold text-foreground">
                {activeWorkspace.name}
              </span>
              <span className="mt-0.5 block text-[0.625rem] text-muted-foreground">
                Business workspace
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`shrink-0 text-muted-foreground ${collapsed ? "md:hidden" : ""}`}
              size={15}
            />
          </button>
          {activePopover === "workspace" && (
            <div className="dashboard-popover absolute left-3 right-3 top-[3.55rem] z-50 rounded-card border border-border bg-surface p-1.5 shadow-popover">
              <p className="px-2.5 pb-1.5 pt-2 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Switch workspace
              </p>
              {workspaces.map((workspace) => (
                <button
                  className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-left text-xs transition hover:bg-surface-muted"
                  key={workspace.name}
                  onClick={() => {
                    switchDemoWorkspace(workspace.id);
                    setActivePopover(null);
                  }}
                  type="button"
                >
                  <span
                    className={`flex size-7 items-center justify-center rounded-lg text-[0.6rem] font-bold text-white ${workspace.color}`}
                  >
                    {getWorkspaceInitials(workspace.name)}
                  </span>
                  <span className="flex-1 font-medium">{workspace.name}</span>
                  {activeWorkspace.name === workspace.name && (
                    <Check aria-hidden="true" className="text-primary" size={15} />
                  )}
                </button>
              ))}
              <Link
                className="mt-1 flex items-center gap-2.5 rounded-control border-t border-border px-2.5 py-2.5 text-xs font-semibold text-primary"
                href="/settings/workspace"
                onClick={() => setActivePopover(null)}
              >
                <Settings aria-hidden="true" size={14} />
                Manage workspaces
              </Link>
            </div>
          )}
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3">
          <p
            className={`mb-2 px-2.5 text-[0.625rem] font-bold uppercase tracking-[0.13em] text-muted-foreground/80 ${
              collapsed ? "md:sr-only" : ""
            }`}
          >
            Workspace
          </p>
          <div className="space-y-1">
            {sidebarItems.map(({ label, icon: Icon, target }) => {
              const isOverview = label === "Overview";
              return (
                <div key={label}>
                  <Link
                    aria-current={isOverview ? "page" : undefined}
                    aria-label={collapsed ? label : undefined}
                    className={`group flex min-h-10 items-center gap-3 rounded-control px-2.5 text-[0.8125rem] font-medium transition ${
                      isOverview
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    } ${collapsed ? "md:justify-center md:px-0" : ""}`}
                    href={
                      label === "Settings"
                        ? "/settings/workspace"
                        : label === "My Tasks"
                          ? "/tasks"
                        : label === "Projects"
                          ? "/projects"
                        : label === "Activity"
                          ? "/activity"
                        : label === "Calendar"
                          ? "/calendar"
                        : label === "Documents"
                          ? "/documents"
                        : label === "Teams"
                          ? "/settings/members"
                          : `/dashboard#${target}`
                    }
                    onClick={() => setMobileNavOpen(false)}
                    title={collapsed ? label : undefined}
                  >
                    <Icon
                      aria-hidden="true"
                      className={isOverview ? "text-primary" : ""}
                      size={17}
                      strokeWidth={1.8}
                    />
                    <span className={collapsed ? "md:hidden" : ""}>{label}</span>
                    {label === "My Tasks" && (
                      <span
                        className={`ml-auto rounded-pill bg-surface-muted px-2 py-0.5 text-[0.625rem] text-muted-foreground ${
                          collapsed ? "md:hidden" : ""
                        }`}
                      >
                        {openTaskCount}
                      </span>
                    )}
                  </Link>
                  {label === "Settings" && !collapsed && (
                    <div className="ml-8 mt-1 space-y-0.5 border-l border-border pl-2.5">
                      {[
                        { label: "Workspace settings", href: "/settings/workspace" },
                        { label: "Members", href: "/settings/members" },
                        { label: "Roles & permissions", href: "/settings/roles" },
                      ].map((item) => (
                        <Link
                          className="block rounded-control px-2 py-2 text-[0.7rem] text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
                          href={item.href}
                          key={item.href}
                          onClick={() => setMobileNavOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p
            className={`mb-2 mt-7 px-2.5 text-[0.625rem] font-bold uppercase tracking-[0.13em] text-muted-foreground/80 ${
              collapsed ? "md:sr-only" : ""
            }`}
          >
            Your space
          </p>
          <Link
            className={`flex min-h-10 items-center gap-3 rounded-control px-2.5 text-[0.8125rem] font-medium text-muted-foreground transition hover:bg-surface-muted hover:text-foreground ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
            href="/dashboard#projects"
            onClick={() => setMobileNavOpen(false)}
            title={collapsed ? "Favorites" : undefined}
          >
            <Sparkles aria-hidden="true" size={17} strokeWidth={1.8} />
            <span className={collapsed ? "md:hidden" : ""}>Favorites</span>
          </Link>
        </nav>

        <div
          className="border-t border-border p-3"
          id="settings"
        >
          <div
            className={`flex items-center gap-2.5 rounded-control px-2 py-2 ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
          >
            <Avatar
              className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
              name={currentUser?.name ?? "Team member"}
              size="sm"
            />
            <span className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
              <span className="block truncate text-xs font-semibold text-foreground">
                {currentUser?.name ?? "Team member"}
              </span>
              <span className="mt-0.5 block truncate text-[0.625rem] text-muted-foreground">
                {currentUser?.email ?? ""}
              </span>
            </span>
            <button
              aria-label="Open profile menu"
              className={`inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted hover:text-foreground ${
                collapsed ? "md:hidden" : ""
              }`}
              onClick={() => togglePopover("profile")}
              type="button"
            >
              <MoreHorizontal aria-hidden="true" size={17} />
            </button>
          </div>
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="mt-1 hidden min-h-9 w-full items-center justify-center gap-2 rounded-control text-xs text-muted-foreground transition hover:bg-surface-muted hover:text-foreground md:flex"
            onClick={() => setCollapsed((current) => !current)}
            type="button"
          >
            <LayoutDashboard aria-hidden="true" size={15} />
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between gap-4 border-b border-border/80 bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open navigation"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted md:hidden"
              onClick={() => setMobileNavOpen(true)}
              type="button"
            >
              <Menu aria-hidden="true" size={19} />
            </button>
            <div className="hidden items-center gap-2 text-xs sm:flex">
              <Link
                className="text-muted-foreground transition hover:text-foreground"
                href="/dashboard"
              >
                Workspace
              </Link>
              <span className="text-border">/</span>
              <span className="font-semibold text-foreground">Overview</span>
            </div>
            <label className="relative hidden w-[min(22vw,16rem)] md:block">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={15}
              />
              <Input
                aria-label="Search projects"
                className="min-h-9 border-transparent bg-surface-muted/75 pl-9 pr-12 text-xs shadow-none focus:border-primary/40 focus:bg-surface"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects..."
                type="search"
                value={query}
              />
              <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border bg-surface px-1.5 py-0.5 text-[0.6rem] text-muted-foreground xl:flex">
                <Command aria-hidden="true" size={10} /> K
              </span>
            </label>
          </div>

          <div className="flex shrink-0 items-center gap-1">
          <div className="relative md:hidden">
            <IconAction
              label="Search projects"
              onClick={() => setMobileSearchOpen((current) => !current)}
              active={mobileSearchOpen}
            >
              <Search aria-hidden="true" size={18} />
            </IconAction>
            {mobileSearchOpen && (
              <div className="dashboard-popover absolute right-0 top-11 z-50 w-[min(18rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-2 shadow-popover">
                <Input
                  aria-label="Search projects"
                  autoFocus
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects..."
                  type="search"
                  value={query}
                />
              </div>
            )}
          </div>
          <div className="relative">
              <IconAction
                label="Help"
                onClick={() => togglePopover("help")}
                active={activePopover === "help"}
              >
                <CircleHelp aria-hidden="true" size={18} />
              </IconAction>
              {activePopover === "help" && (
                <PopoverPanel className="right-0 w-60">
                  <p className="px-2.5 pb-2 pt-1 text-xs font-semibold text-foreground">
                    How can we help?
                  </p>
                  <p className="px-2.5 pb-2 text-xs leading-5 text-muted-foreground">
                    Explore your workspace or reach out to your team admin.
                  </p>
                  <button
                    className="flex w-full items-center justify-between rounded-control px-2.5 py-2 text-xs font-semibold text-primary transition hover:bg-surface-muted"
                    onClick={() => setActivePopover(null)}
                    type="button"
                  >
                    View workspace guide <ArrowRight aria-hidden="true" size={14} />
                  </button>
                </PopoverPanel>
              )}
            </div>

            <div className="relative">
              <IconAction
                label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`}
                onClick={() => togglePopover("notifications")}
                active={activePopover === "notifications"}
              >
                <Bell aria-hidden="true" size={18} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.55rem] font-bold text-white">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </IconAction>
              {activePopover === "notifications" && (
                <PopoverPanel className="right-0 w-[min(20rem,calc(100vw-2rem))]">
                  <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
                    <p className="text-xs font-semibold text-foreground">
                      Notifications
                    </p>
                    <Badge variant={unreadNotificationCount ? "primary" : "secondary"}>
                      {unreadNotificationCount} unread
                    </Badge>
                  </div>
                  <div className="max-h-72 space-y-0.5 overflow-y-auto">
                    {notifications.slice(0, 4).map((notification) => (
                      <Link
                        className={`flex gap-2.5 rounded-control px-2.5 py-2.5 transition hover:bg-surface-muted ${
                          notification.read ? "" : "bg-primary/[0.04]"
                        }`}
                        href={notification.href}
                        key={notification.id}
                        onClick={() => {
                          markDemoNotificationRead(activeWorkspace.id, notification.id);
                          setActivePopover(null);
                        }}
                      >
                        <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.read ? "bg-border" : "bg-primary"}`} />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-foreground">{notification.title}</span>
                          <span className="mt-1 block truncate text-[0.675rem] text-muted-foreground">{notification.description}</span>
                          <span className="mt-1 block text-[0.625rem] text-muted-foreground/80">{formatActivityDate(notification.createdAt)}</span>
                        </span>
                      </Link>
                    ))}
                    {notifications.length === 0 && (
                      <p className="px-2.5 py-5 text-center text-xs text-muted-foreground">No notifications yet.</p>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 border-t border-border px-2.5 pt-2">
                    <button
                      className="text-[0.675rem] font-semibold text-muted-foreground hover:text-primary disabled:opacity-50"
                      disabled={unreadNotificationCount === 0}
                      onClick={() => markAllDemoNotificationsRead(activeWorkspace.id)}
                      type="button"
                    >
                      Mark all read
                    </button>
                    <Link
                      className="text-[0.675rem] font-semibold text-primary hover:text-primary-hover"
                      href="/notifications"
                      onClick={() => setActivePopover(null)}
                    >
                      View all
                    </Link>
                  </div>
                </PopoverPanel>
              )}
            </div>

            <div className="relative ml-1">
              <button
                aria-expanded={activePopover === "profile"}
                aria-label="Open profile menu"
                className="flex items-center gap-2 rounded-pill p-1 transition hover:bg-surface-muted"
                onClick={() => togglePopover("profile")}
                type="button"
              >
                <Avatar
                  className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                  name={currentUser?.name ?? "Team member"}
                  size="sm"
                />
                <ChevronDown
                  aria-hidden="true"
                  className="hidden text-muted-foreground sm:block"
                  size={14}
                />
              </button>
              {activePopover === "profile" && (
                <div className="dashboard-popover absolute right-0 top-11 z-50 w-56 rounded-card border border-border bg-surface p-2 shadow-popover">
                  <div className="border-b border-border px-2.5 pb-2.5 pt-1">
                    <p className="text-xs font-semibold text-foreground">
                      {currentUser?.name ?? "Team member"}
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                      {currentUser?.email ?? ""}
                    </p>
                  </div>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2.5 text-left text-xs text-foreground transition hover:bg-surface-muted"
                    onClick={toggleTheme}
                    type="button"
                  >
                    {darkMode ? (
                      <Sun
                        aria-hidden="true"
                        className="text-muted-foreground"
                        size={15}
                      />
                    ) : (
                      <Moon
                        aria-hidden="true"
                        className="text-muted-foreground"
                        size={15}
                      />
                    )}
                    {darkMode ? "Switch to light mode" : "Switch to dark mode"}
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2.5 text-left text-xs text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
                    onClick={() => setActivePopover(null)}
                    type="button"
                  >
                    <Settings aria-hidden="true" size={15} />
                    Account settings
                  </button>
                  <Link
                    className="flex items-center gap-2.5 rounded-control px-2.5 py-2.5 text-xs text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
                    href="/invitations"
                    onClick={() => setActivePopover(null)}
                  >
                    <Mail aria-hidden="true" size={15} />
                    Workspace invitations
                  </Link>
                  <Link
                    className="flex items-center gap-2.5 rounded-control px-2.5 py-2.5 text-xs text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
                    href="/login"
                    onClick={(event) => {
                      event.preventDefault();
                      void signOut().then((success) => {
                        if (!success) return;
                        setActivePopover(null);
                        router.replace("/login");
                        router.refresh();
                      });
                    }}
                  >
                    <LogOut aria-hidden="true" size={15} />
                    Sign out
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[100rem] px-4 pb-10 pt-7 sm:px-6 lg:px-9">
          <DemoPersistenceNotice />
          <section
            aria-labelledby="welcome-heading"
            className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
            id="overview"
          >
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="size-2 rounded-full bg-success" />
                <p className="text-xs font-medium text-muted-foreground">
                  {activeWorkspace.name}
                  <span className="mx-1.5">·</span>
                  {today
                    ? new Date(`${today}T12:00:00`).toLocaleDateString("en", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    })
                    : ""}
                </p>
              </div>
              <h1
                className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.8rem]"
                id="welcome-heading"
              >
                Good morning, {currentUser?.name.split(/\s+/)[0] ?? "there"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                A little progress each day adds up to remarkable results.
              </p>
            </div>
            <Button
              className="w-full shadow-[0_8px_20px_-10px_var(--primary)] transition hover:-translate-y-0.5 sm:w-auto"
              onClick={() => setProjectDialogOpen(true)}
              size="md"
            >
              <Plus aria-hidden="true" size={17} />
              New project
            </Button>
          </section>

          <section aria-label="Task statistics" className="mb-7">
            <SectionHeading
              action={
                <Link
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover"
                  href="/tasks"
                >
                  Open tasks <ArrowRight aria-hidden="true" size={14} />
                </Link>
              }
              description="Work currently tracked across this workspace."
              title="Task overview"
              titleId="task-overview-heading"
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: "Open tasks",
                  value: openTaskCount,
                  icon: Check,
                  tone: "text-primary bg-primary/10",
                },
                {
                  label: "To do",
                  value: activeWorkspaceTasks.filter((task) => task.status === "To Do").length,
                  icon: Clock3,
                  tone: "text-muted-foreground bg-surface-muted",
                },
                {
                  label: "In progress",
                  value: activeWorkspaceTasks.filter(
                    (task) => task.status === "In Progress",
                  ).length,
                  icon: ArrowUpRight,
                  tone: "text-sky-600 bg-sky-500/10 dark:text-sky-300",
                },
                {
                  label: "Completed",
                  value: activeWorkspaceTasks.filter((task) => task.status === "Done").length,
                  icon: Check,
                  tone: "text-success bg-success-muted",
                },
              ].map(({ icon: Icon, label, tone, value }) => (
                <Card className="flex items-center gap-3 p-4" key={label}>
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon aria-hidden="true" size={16} />
                  </span>
                  <div>
                    <p className="text-[0.675rem] font-medium text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-0.5 text-lg font-semibold text-foreground">
                      {value}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section
            aria-label="Workspace statistics"
            className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
          >
            {dashboardStats.map((stat, index) => {
              const Icon = stat.icon;
              const value = [
                projects.filter((project) => !project.archived).length,
                activeProjects,
                completedProjects,
                overdueProjects,
              ][index];
              return (
                <Card
                  className="dashboard-card relative overflow-hidden p-4 sm:p-5"
                  key={stat.label}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${stat.style}`}
                    >
                      <Icon aria-hidden="true" size={17} strokeWidth={1.9} />
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-4 text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.8rem]">
                    {value}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[0.6875rem]">
                    {stat.trend === "attention" ? (
                      <ArrowDownRight aria-hidden="true" className="text-warning" size={14} />
                    ) : stat.trend === "up" ? (
                      <ArrowUpRight aria-hidden="true" className="text-success" size={14} />
                    ) : null}
                    <span
                      className={
                        stat.trend === "attention"
                          ? "text-warning"
                          : stat.trend === "up"
                            ? "text-success"
                            : "text-muted-foreground"
                      }
                    >
                      {index === 0
                        ? "In this workspace"
                        : index === 1
                          ? "Currently in progress"
                          : index === 2
                            ? "Successfully delivered"
                            : "Past their due date"}
                    </span>
                  </div>
                </Card>
              );
            })}
          </section>

          <section
            aria-labelledby="projects-heading"
            className="mb-7"
            id="projects"
          >
            <SectionHeading
              action={
                <Link
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:text-primary-hover"
                  href="/projects"
                >
                  View all projects <ArrowRight aria-hidden="true" size={14} />
                </Link>
              }
              description="Keep an eye on the work moving your team forward."
              title="Project overview"
              titleId="projects-heading"
            />

            {filteredProjects.length ? (
              <div className="grid gap-4 lg:grid-cols-3">
                {filteredProjects.map((project, index) => (
                  <ProjectCard
                    index={index}
                    key={project.id}
                    members={members}
                    project={project}
                  />
                ))}
              </div>
            ) : (
              <Card className="px-5 py-10 text-center">
                <Search
                  aria-hidden="true"
                  className="mx-auto text-muted-foreground"
                  size={20}
                />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  No projects match “{query}”
                </p>
                <button
                  className="mt-2 text-xs font-semibold text-primary"
                  onClick={() => setQuery("")}
                  type="button"
                >
                  Clear search
                </button>
              </Card>
            )}
          </section>

          <section
            aria-label="Productivity analytics"
            className="mb-7 grid gap-4 lg:grid-cols-[1.45fr_1fr]"
            id="analytics"
          >
            <WeeklyChart completions={weeklyCompletions} />
            <ProjectDistribution projects={projects} />
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <ActivityFeed activities={activities} />
            <Deadlines
              members={members}
              projects={projects}
              tasks={activeWorkspaceTasks}
              today={today}
            />
          </section>
          <UpcomingEvents
            events={upcomingEvents}
            members={members}
            projects={projects}
          />
          <div aria-live="polite" className="sr-only">
            {query ? `Showing ${filteredProjects.length} matching projects.` : ""}
          </div>
        </main>
      </div>

      {projectDialogOpen && (
        <NewProjectDialog
          members={members}
          onClose={() => setProjectDialogOpen(false)}
          onCreate={(project) => createDemoProject(activeWorkspace.id, project)}
        />
      )}
    </div>
  );
}

function IconAction({
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
      aria-expanded={active}
      aria-label={label}
      className={`relative inline-flex size-9 items-center justify-center rounded-control transition ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PopoverPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <div className={`dashboard-popover absolute top-11 z-50 rounded-card border border-border bg-surface p-2 shadow-popover ${className}`}>
      {children}
    </div>
  );
}

function SectionHeading({
  action,
  description,
  title,
  titleId,
}: {
  action?: React.ReactNode;
  description?: string;
  title: string;
  titleId: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2
          className="text-base font-semibold tracking-tight text-foreground"
          id={titleId}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function ProjectCard({
  index,
  members,
  project,
}: {
  index: number;
  members: { id: string; name: string }[];
  project: DashboardProject;
}) {
  const memberNames = project.memberIds.map(
    (id) => members.find((member) => member.id === id)?.name ?? "Team member",
  );
  const accent: Record<DashboardProject["color"], string> = {
    violet: "from-violet-500/15 via-primary/5 to-transparent",
    indigo: "from-indigo-500/15 via-primary/5 to-transparent",
    blue: "from-sky-500/15 via-indigo-500/5 to-transparent",
    emerald: "from-emerald-500/15 via-primary/5 to-transparent",
    amber: "from-amber-500/15 via-orange-500/5 to-transparent",
    rose: "from-rose-500/15 via-pink-500/5 to-transparent",
  };
  return (
    <Link
      className="dashboard-card group relative block overflow-hidden rounded-card border border-border bg-surface p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-popover sm:p-5"
      href={`/projects/${project.id}`}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-br ${accent[project.color]} opacity-80`}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-primary shadow-sm ring-1 ring-border/70">
              <FolderKanban aria-hidden="true" size={17} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {project.name}
              </h3>
              <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
                Updated today
              </p>
            </div>
          </div>
          <ArrowRight
            aria-hidden="true"
            className="shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
            size={16}
          />
        </div>
        <p className="mt-4 min-h-10 text-xs leading-5 text-muted-foreground">
          {project.description}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge variant={statusVariants[project.status]}>
            <span className="size-1.5 rounded-full bg-current" />
            {project.status}
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <CalendarDays aria-hidden="true" size={13} />
            Due {new Date(`${project.dueDate}T00:00:00`).toLocaleDateString(
              "en",
              { month: "short", day: "numeric" },
            )}
          </span>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[0.6875rem]">
            <span className="font-medium text-foreground">Progress</span>
            <span className="font-semibold text-foreground">
              {project.progress}%
            </span>
          </div>
          <Progress
            className="h-1.5"
            label={`${project.name} progress`}
            tone={statusColors[project.status]}
            value={project.progress}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3.5">
          <span className="text-[0.6875rem] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {project.completedTasks}/{project.totalTasks}
            </span>{" "}
            tasks
          </span>
          <AvatarStack names={memberNames} />
        </div>
      </div>
    </Link>
  );
}

function AvatarStack({ names }: { names: string[] }) {
  const colors = [
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200",
    "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  ];

  return (
    <div aria-label={`Team members: ${names.join(", ")}`} className="flex -space-x-2">
      {names.slice(0, 3).map((name, index) => (
        <Avatar
          className={`border-2 border-surface ${colors[index % colors.length]}`}
          key={name}
          name={name}
          size="sm"
        />
      ))}
      {names.length > 3 && (
        <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-surface bg-surface-muted text-[0.6rem] font-semibold text-muted-foreground">
          +{names.length - 3}
        </span>
      )}
    </div>
  );
}

function WeeklyChart({
  completions,
}: {
  completions: { day: string; count: number }[];
}) {
  const max = Math.max(1, ...completions.map(({ count }) => count));
  const points = completions
    .map((item, index) => {
      const x = 20 + index * 52;
      const y = 116 - (item.count / max) * 92;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <Card className="dashboard-card p-4 sm:p-5" id="reports">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Weekly task completion
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your team completed{" "}
            <strong className="font-semibold text-foreground">
              {completions.reduce((total, item) => total + item.count, 0)} tasks
            </strong>{" "}
            this week
          </p>
        </div>
        <button
          aria-label="Analytics options"
          className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted"
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={15} />
        </button>
      </div>
      <div className="mt-5">
        <svg
          aria-label="Weekly task completion chart"
          className="h-40 w-full overflow-visible"
          role="img"
          viewBox="0 0 360 150"
        >
          <defs>
            <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity=".2" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[24, 54, 84, 114].map((y) => (
            <line
              key={y}
              stroke="var(--border)"
              strokeDasharray="3 5"
              strokeOpacity=".8"
              x1="12"
              x2="350"
              y1={y}
              y2={y}
            />
          ))}
          <path
            d={`${points} L 332 128 L 20 128 Z`}
            fill="url(#chartFill)"
          />
          <path
            d={points}
            fill="none"
            stroke="var(--primary)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {completions.map((item, index) => {
            const x = 20 + index * 52;
            const y = 116 - (item.count / max) * 92;
            return (
              <circle
                cx={x}
                cy={y}
                fill="var(--surface)"
                key={item.day}
                r="4.25"
                stroke="var(--primary)"
                strokeWidth="2.5"
              />
            );
          })}
        </svg>
        <div className="-mt-1 grid grid-cols-7 text-center text-[0.625rem] font-medium text-muted-foreground">
          {completions.map(({ day }) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ProjectDistribution({ projects }: { projects: DashboardProject[] }) {
  const activeProjects = projects.filter((project) => !project.archived);
  const colors: Record<DashboardProject["status"], string> = {
    Planning: "bg-slate-400",
    Active: "bg-primary",
    "On Hold": "bg-warning",
    Completed: "bg-success",
  };
  const distribution = (
    ["Planning", "Active", "On Hold", "Completed"] as const
  ).map((status) => {
    const count = activeProjects.filter((project) => project.status === status)
      .length;
    return {
      label: status,
      count,
      percent: activeProjects.length
        ? Math.round((count / activeProjects.length) * 100)
        : 0,
      color: colors[status],
    };
  });
  return (
    <Card className="dashboard-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Project status
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            How work is tracking across your workspace
          </p>
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">
          {activeProjects.length}
        </span>
      </div>
      <div
        aria-label="Project status distribution"
        className="mt-5 flex h-2.5 overflow-hidden rounded-pill bg-surface-muted"
        role="img"
      >
        {distribution.map((status) => (
          <span
            className={`${status.color} first:rounded-l-pill last:rounded-r-pill`}
            key={status.label}
            style={{ width: `${status.percent}%` }}
            title={`${status.label}: ${status.count}`}
          />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {distribution.map((status) => (
          <div className="flex items-center gap-2.5" key={status.label}>
            <span className={`size-2 rounded-full ${status.color}`} />
            <span className="flex-1 text-xs text-muted-foreground">
              {status.label}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {status.count}
            </span>
            <span className="w-8 text-right text-[0.625rem] text-muted-foreground">
              {status.percent}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivityFeed({
  activities,
}: {
  activities: DemoActivityEvent[];
}) {
  const recentActivity = activities.slice(0, 4);
  return (
    <Card className="dashboard-card min-w-0 p-4 sm:p-5" id="activity">
      <SectionHeading
        action={
          <Link
            className="text-xs font-semibold text-primary transition hover:text-primary-hover"
            href="/activity"
          >
            See all <ArrowRight aria-hidden="true" className="inline" size={13} />
          </Link>
        }
        title="Recent task activity"
        titleId="activity-heading"
      />
      {recentActivity.length ? (
        <div className="space-y-0.5">
          {recentActivity.map((activity, index) => (
            <Link
              className="flex gap-3 rounded-control py-3 transition hover:bg-surface-muted/60"
              href={activity.href}
              key={activity.id}
            >
              <div className="relative shrink-0">
                <Avatar
                  className="bg-primary/10 text-primary"
                  name={activity.actor}
                  size="sm"
                />
                {index < recentActivity.length - 1 && (
                  <span className="absolute bottom-[-0.9rem] left-1/2 top-9 w-px -translate-x-1/2 bg-border" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-5 text-foreground">
                  <span className="font-semibold">{activity.actor}</span>{" "}
                  {activity.action}{" "}
                  <span className="font-semibold">{activity.relatedTitle}</span>
                </p>
                <p className="mt-1 text-[0.625rem] text-muted-foreground">
                  {formatActivityDate(activity.createdAt)}
                </p>
              </div>
              <CheckCircle2
                aria-hidden="true"
                className="mt-1 shrink-0 text-primary"
                size={15}
              />
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-5 text-xs text-muted-foreground">
          Task updates will appear here as your team works.
        </p>
      )}
    </Card>
  );
}

function UpcomingEvents({
  events,
  members,
  projects,
}: {
  events: {
    id: string;
    title: string;
    startsAt: string;
    endsAt: string;
    type: string;
    projectId: string;
    attendeeIds: string[];
    location: string;
  }[];
  members: { id: string; name: string }[];
  projects: DashboardProject[];
}) {
  return (
    <Card className="dashboard-card mt-4 p-4 sm:p-5">
      <SectionHeading
        action={
          <Link
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover"
            href="/calendar"
          >
            Open calendar <ArrowRight aria-hidden="true" size={14} />
          </Link>
        }
        description="Meetings and events scheduled for your workspace."
        title="Upcoming calendar events"
        titleId="upcoming-calendar-events-heading"
      />
      {events.length ? (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const project = projects.find((item) => item.id === event.projectId);
            const attendees = event.attendeeIds
              .map((id) => members.find((member) => member.id === id))
              .filter((member): member is (typeof members)[number] => Boolean(member));
            return (
              <Link
                className="flex items-start gap-3 rounded-control border border-border p-3 transition hover:border-primary/25 hover:bg-surface-muted/45"
                href="/calendar"
                key={event.id}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays aria-hidden="true" size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-xs font-semibold text-foreground">{event.title}</span>
                    <Badge variant={event.type === "Meeting" ? "primary" : "secondary"}>{event.type}</Badge>
                  </span>
                  <span className="mt-1 block text-[0.675rem] text-muted-foreground">
                    {new Date(event.startsAt).toLocaleString("en", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {project ? ` · ${project.name}` : ""}
                  </span>
                  {attendees.length > 0 && (
                    <span className="mt-2 flex -space-x-2">
                      {attendees.slice(0, 4).map((member) => (
                        <Avatar className="border-2 border-surface" key={member.id} name={member.name} size="sm" />
                      ))}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="py-4 text-xs text-muted-foreground">No upcoming team events. Add one from the calendar.</p>
      )}
    </Card>
  );
}

function Deadlines({
  members,
  projects,
  tasks,
  today,
}: {
  members: { id: string; name: string }[];
  projects: DashboardProject[];
  tasks: DemoTask[];
  today: string;
}) {
  const upcomingTasks = tasks
    .filter((task) => task.status !== "Done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  return (
    <Card className="dashboard-card min-w-0 p-4 sm:p-5" id="deadlines">
      <SectionHeading
        action={
          <Link
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover"
            href="/tasks"
          >
            Calendar <ArrowRight aria-hidden="true" size={14} />
          </Link>
        }
        title="Upcoming deadlines"
        titleId="deadlines-heading"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[31rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <th className="pb-2.5 pr-3 font-semibold">Task</th>
              <th className="pb-2.5 pr-3 font-semibold">Assignee</th>
              <th className="pb-2.5 pr-3 font-semibold">Due date</th>
              <th className="pb-2.5 text-right font-semibold">Priority</th>
            </tr>
          </thead>
          <tbody>
            {upcomingTasks.length === 0 && (
              <tr>
                <td
                  className="py-5 text-xs text-muted-foreground"
                  colSpan={4}
                >
                  No upcoming tasks. Create a task to track the next deadline.
                </td>
              </tr>
            )}
            {upcomingTasks.map((task) => {
              const projectName =
                projects.find((project) => project.id === task.projectId)?.name ??
                "Project";
              const assignee = members.find(
                (member) => member.id === task.assigneeId,
              );
              const overdue = Boolean(today && task.dueDate < today);
              return (
              <tr
                className="border-b border-border/70 last:border-0"
                key={task.id}
              >
                <td className="py-3 pr-3">
                  <Link href={`/tasks/${task.id}`}>
                  <p className="max-w-40 truncate text-xs font-semibold text-foreground">
                    {task.title}
                  </p>
                  <p className="mt-1 max-w-40 truncate text-[0.625rem] text-muted-foreground">
                    {projectName}
                  </p>
                  </Link>
                </td>
                <td className="py-3 pr-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar
                      name={assignee?.name ?? "Unassigned"}
                      size="sm"
                    />
                    <span className="hidden text-[0.6875rem] text-muted-foreground 2xl:inline">
                      {assignee?.name.split(" ")[0] ?? "Unassigned"}
                    </span>
                  </span>
                </td>
                <td className="py-3 pr-3">
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[0.6875rem] ${
                      overdue
                        ? "font-semibold text-danger"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Clock3 aria-hidden="true" size={12} />
                    {formatActivityDate(task.dueDate)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <Badge
                    variant={
                      task.priority === "Urgent" || task.priority === "High"
                        ? "danger"
                        : task.priority === "Medium"
                          ? "primary"
                          : "default"
                    }
                  >
                    {task.priority}
                  </Badge>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function formatActivityDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString(
    "en",
    { month: "short", day: "numeric", timeZone: "UTC" },
  );
}

function NewProjectDialog({
  members,
  onClose,
  onCreate,
}: {
  members: { id: string; role: string }[];
  onClose: () => void;
  onCreate: (project: DashboardProject) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const startDate = new Date().toISOString().slice(0, 10);
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const managerId =
      members.find((member) => member.role === "Project Manager")?.id ??
      members[0]?.id ??
      "";
    const project: DashboardProject = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() || "A new project for your team.",
      category: "Other",
      status: "Planning",
      priority: "Medium",
      progress: 0,
      startDate,
      dueDate,
      managerId,
      memberIds: managerId ? [managerId] : [],
      color: "violet",
      completedTasks: 0,
      totalTasks: 0,
      archived: false,
      createdAt: new Date().toISOString(),
      activity: [],
    };
    const saved = await onCreate(project);
    setIsSaving(false);
    if (saved) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        aria-labelledby="new-project-title"
        aria-modal="true"
        className="auth-enter w-full max-w-[28rem] rounded-panel border border-border bg-surface p-5 shadow-popover sm:p-7"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <span className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FilePlus2 aria-hidden="true" size={19} />
            </span>
            <h2
              className="text-lg font-semibold tracking-tight text-foreground"
              id="new-project-title"
            >
              Create a project
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              Set up a shared space for your team&apos;s next piece of work.
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={17} />
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-foreground"
              htmlFor="project-name"
            >
              Project name
            </label>
            <Input
              autoFocus
              id="project-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Website refresh"
              required
              value={name}
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-foreground"
              htmlFor="project-description"
            >
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              className="min-h-24 w-full resize-y rounded-control border border-border bg-surface px-3.5 py-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              id="project-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this project about?"
              value={description}
            />
          </div>
          <p className="rounded-control bg-surface-muted px-3 py-2.5 text-[0.6875rem] leading-5 text-muted-foreground">
            Demo mode: this project is saved in this browser and scoped to the current workspace.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button disabled={isSaving} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button disabled={!name.trim() || isSaving} type="submit">
              {isSaving ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                    size={15}
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Plus aria-hidden="true" size={16} />
                  Create project
                </>
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
