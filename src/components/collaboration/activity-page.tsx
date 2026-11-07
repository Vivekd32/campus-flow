"use client";

import Link from "next/link";
import {
  BellRing,
  CheckCircle2,
  FilePlus2,
  MessageCircle,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { CollaborationHeader } from "@/components/collaboration/collaboration-header";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";
import { DemoPersistenceNotice } from "@/components/settings/demo-persistence-notice";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import type { DemoAnnouncement } from "@/lib/collaboration-demo-data";
import {
  createDemoAnnouncement,
  removeDemoAnnouncement,
  updateDemoAnnouncement,
} from "@/lib/workspace-demo-store";

type ActivityType =
  | "Project created"
  | "Project updated"
  | "Task assigned"
  | "Task created"
  | "Task completed"
  | "Task status changed"
  | "Team member invited"
  | "Comment added"
  | "Announcement posted";

type ActivityEntry = {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
  type: ActivityType;
  relatedTitle: string;
  projectId: string;
  href: string;
};

const activityIcons: Record<ActivityType, typeof BellRing> = {
  "Project created": FilePlus2,
  "Project updated": Pencil,
  "Task assigned": UserPlus,
  "Task created": FilePlus2,
  "Task completed": CheckCircle2,
  "Task status changed": BellRing,
  "Team member invited": UsersRound,
  "Comment added": MessageCircle,
  "Announcement posted": Megaphone,
};

const activityTypes: ActivityType[] = [
  "Project created",
  "Project updated",
  "Task assigned",
  "Task created",
  "Task completed",
  "Task status changed",
  "Team member invited",
  "Comment added",
  "Announcement posted",
];

export function ActivityPage() {
  const { activeWorkspace, activities, announcements, currentUser, isHydrated, members, projects } =
    useWorkspaceDemo();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All activity");
  const [projectFilter, setProjectFilter] = useState("All projects");
  const [announcementDialog, setAnnouncementDialog] =
    useState<DemoAnnouncement | null | false>(false);
  const [deleteAnnouncement, setDeleteAnnouncement] =
    useState<DemoAnnouncement | null>(null);

  const entries: ActivityEntry[] = activities;
  const filtered = entries.filter((entry) => {
    const matchesText = `${entry.actor} ${entry.action} ${entry.relatedTitle}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesType = typeFilter === "All activity" || entry.type === typeFilter;
    const matchesProject =
      projectFilter === "All projects" || entry.projectId === projectFilter;
    return matchesText && matchesType && matchesProject;
  });

  if (!isHydrated || !activeWorkspace) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CollaborationHeader current="/activity" />
      <main className="mx-auto max-w-[88rem] px-4 pb-14 pt-7 sm:px-6 lg:px-9 lg:pt-10">
        <div className="mb-6 hidden items-center gap-2 text-[0.7rem] text-muted-foreground sm:flex">
          <Link className="hover:text-foreground" href="/dashboard">Workspace</Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-foreground">Team activity</span>
        </div>
        <DemoPersistenceNotice />
        <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="mb-3" variant="primary">
              <UsersRound aria-hidden="true" size={13} />
              Team collaboration
            </Badge>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Team activity
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Catch up on the work, conversations, and decisions across {activeWorkspace.name}.
            </p>
          </div>
          <Button onClick={() => setAnnouncementDialog(null)} size="sm">
            <Plus aria-hidden="true" size={15} />
            New announcement
          </Button>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.8fr)]">
          <Card className="min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm font-semibold">Recent activity</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updates from projects, tasks, and team collaboration.
                </p>
              </div>
              <Badge variant="secondary">{filtered.length} updates</Badge>
            </div>
            <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto_auto]">
              <label className="relative">
                <span className="sr-only">Search activity</span>
                <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                <Input
                  className="min-h-9 pl-9 text-xs"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search activity..."
                  value={query}
                />
              </label>
              <select
                aria-label="Filter by activity type"
                className={selectClass}
                onChange={(event) => setTypeFilter(event.target.value)}
                value={typeFilter}
              >
                <option>All activity</option>
                {activityTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
              <select
                aria-label="Filter by project"
                className={selectClass}
                onChange={(event) => setProjectFilter(event.target.value)}
                value={projectFilter}
              >
                <option>All projects</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>
            <ol className="divide-y divide-border">
              {filtered.slice(0, 60).map((entry) => {
                const Icon = activityIcons[entry.type];
                return (
                  <li className="flex gap-3 py-4 first:pt-1" key={entry.id}>
                    <Avatar name={entry.actor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-5">
                        <span className="font-semibold">{entry.actor}</span>{" "}
                        <span className="text-muted-foreground">{entry.action}</span>{" "}
                        <Link className="font-semibold text-foreground hover:text-primary" href={entry.href}>
                          {entry.relatedTitle}
                        </Link>
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          <Icon aria-hidden="true" size={11} />
                          {entry.type}
                        </Badge>
                        {projects.find((project) => project.id === entry.projectId) && (
                          <span className="text-[0.65rem] text-muted-foreground">
                            {projects.find((project) => project.id === entry.projectId)?.name}
                          </span>
                        )}
                        <time className="text-[0.65rem] text-muted-foreground" dateTime={entry.createdAt}>
                          {formatActivityTime(entry.createdAt)}
                        </time>
                      </div>
                    </div>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="py-12 text-center text-xs text-muted-foreground">
                  No activity matches those filters.
                </li>
              )}
            </ol>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Team announcements</h2>
                <p className="mt-1 text-xs text-muted-foreground">Important notes for your workspace.</p>
              </div>
              <Megaphone aria-hidden="true" className="text-primary" size={17} />
            </div>
            <div className="space-y-3">
              {announcements.map((announcement) => {
                const author = members.find((member) => member.id === announcement.authorId);
                return (
                  <article className="rounded-card border border-border bg-surface-muted/35 p-4" key={announcement.id}>
                    <div className="flex items-start gap-3">
                      <Avatar name={author?.name ?? "Jordan Lee"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs font-semibold">{announcement.title}</h3>
                          {announcement.priority !== "Normal" && (
                            <Badge variant={announcement.priority === "Urgent" ? "danger" : "warning"}>{announcement.priority}</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-[0.65rem] text-muted-foreground">
                          {author?.name ?? "Team member"} · {formatDate(announcement.createdAt)}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{announcement.description}</p>
                      </div>
                    </div>
                    {announcement.authorId === currentUser?.id && (
                      <div className="mt-3 flex justify-end gap-1">
                        <button
                          aria-label={`Edit ${announcement.title}`}
                          className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted hover:text-primary"
                          onClick={() => setAnnouncementDialog(announcement)}
                          type="button"
                        >
                          <Pencil aria-hidden="true" size={14} />
                        </button>
                        <button
                          aria-label={`Delete ${announcement.title}`}
                          className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-danger-muted hover:text-danger"
                          onClick={() => setDeleteAnnouncement(announcement)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={14} />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
              {announcements.length === 0 && (
                <div className="rounded-card border border-dashed border-border px-4 py-9 text-center">
                  <Megaphone aria-hidden="true" className="mx-auto text-muted-foreground" size={20} />
                  <p className="mt-3 text-xs font-semibold">No announcements yet</p>
                  <p className="mt-1 text-[0.675rem] text-muted-foreground">Share a team update to get started.</p>
                </div>
              )}
            </div>
            <Button className="mt-4 w-full" onClick={() => setAnnouncementDialog(null)} size="sm" variant="outline">
              <Plus aria-hidden="true" size={14} />
              Create announcement
            </Button>
          </Card>
        </section>
      </main>
      {announcementDialog !== false && (
        <AnnouncementDialog
          announcement={announcementDialog}
          authorId={currentUser?.id ?? ""}
          onClose={() => setAnnouncementDialog(false)}
          onSave={async (announcement) => {
            let saved = false;
            if (announcementDialog) {
              saved = await updateDemoAnnouncement(activeWorkspace.id, announcementDialog.id, announcement);
            } else {
              saved = await createDemoAnnouncement(activeWorkspace.id, announcement);
            }
            if (saved) setAnnouncementDialog(false);
            return saved;
          }}
          workspaceId={activeWorkspace.id}
        />
      )}
      {deleteAnnouncement && (
        <ConfirmDialog
          confirmLabel="Delete announcement"
          description={`“${deleteAnnouncement.title}” will be permanently removed from this workspace.`}
          onCancel={() => setDeleteAnnouncement(null)}
          onConfirm={() => {
            void removeDemoAnnouncement(activeWorkspace.id, deleteAnnouncement.id).then(
              (removed) => {
                if (removed) setDeleteAnnouncement(null);
              },
            );
          }}
          title="Delete this announcement?"
        />
      )}
    </div>
  );
}

function AnnouncementDialog({
  announcement,
  authorId,
  onClose,
  onSave,
  workspaceId,
}: {
  announcement: DemoAnnouncement | null;
  authorId: string;
  onClose: () => void;
  onSave: (announcement: DemoAnnouncement) => Promise<boolean>;
  workspaceId: string;
}) {
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [description, setDescription] = useState(announcement?.description ?? "");
  const [priority, setPriority] = useState<DemoAnnouncement["priority"]>(announcement?.priority ?? "Normal");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Enter an announcement title and description.");
      return;
    }
    const now = new Date().toISOString();
    setSaving(true);
    await onSave({
      id: announcement?.id ?? crypto.randomUUID(),
      workspaceId,
      title: title.trim(),
      description: description.trim(),
      authorId: announcement?.authorId ?? authorId,
      createdAt: announcement?.createdAt ?? now,
      updatedAt: now,
      priority,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"     onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section aria-labelledby="announcement-dialog-title" aria-modal="true" className="w-full max-w-xl rounded-panel border border-border bg-surface p-5 shadow-popover sm:p-6" role="dialog">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold" id="announcement-dialog-title">{announcement ? "Edit announcement" : "New announcement"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Share an update with members of this workspace.</p>
          </div>
          <button aria-label="Close dialog" className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted" disabled={saving} onClick={onClose} type="button"><X aria-hidden="true" size={16} /></button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-xs font-semibold">Title
            <Input className="mt-1.5" onChange={(event) => setTitle(event.target.value)} required value={title} />
          </label>
          <label className="block text-xs font-semibold">Description
            <textarea className="mt-1.5 min-h-28 w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm font-normal text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" onChange={(event) => setDescription(event.target.value)} required value={description} />
          </label>
          <label className="block text-xs font-semibold">Priority
            <select className={`${selectClass} mt-1.5 w-full`} onChange={(event) => setPriority(event.target.value as DemoAnnouncement["priority"])} value={priority}>
              {(["Normal", "Important", "Urgent"] as const).map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          {error && <p className="text-xs text-danger" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose} type="button" variant="ghost">Cancel</Button>
            <Button type="submit">{announcement ? "Save changes" : "Post announcement"}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Loading() {
  return <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground" role="status">Loading team activity…</div>;
}

function formatActivityTime(value: string) {
  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

const selectClass =
  "min-h-9 rounded-control border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";
