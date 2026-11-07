"use client";

import Link from "next/link";
import {
  AtSign,
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  MessageCircle,
  Megaphone,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { CollaborationHeader } from "@/components/collaboration/collaboration-header";
import { DemoPersistenceNotice } from "@/components/settings/demo-persistence-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import { notificationTypes } from "@/lib/collaboration-demo-data";
import {
  markAllDemoNotificationsRead,
  markDemoNotificationRead,
  removeDemoNotification,
} from "@/lib/workspace-demo-store";

const icons = {
  "Task assigned": UserPlus,
  "Task deadline approaching": CalendarClock,
  "Task completed": Check,
  "Mention received": AtSign,
  "New comment": MessageCircle,
  "Project update": Bell,
  "Team announcement": Megaphone,
  "Team member invited": UserPlus,
} as const;

export function NotificationsPage() {
  const { activeWorkspace, isHydrated, notifications } = useWorkspaceDemo();
  const [filter, setFilter] = useState("All notifications");
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const visibleNotifications = notifications.filter(
    (notification) =>
      filter === "All notifications" ||
      (filter === "Unread" ? !notification.read : notification.type === filter),
  );

  if (!isHydrated || !activeWorkspace) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CollaborationHeader current="/notifications" />
      <main className="mx-auto max-w-[88rem] px-4 pb-14 pt-7 sm:px-6 lg:px-9 lg:pt-10">
        <div className="mb-6 hidden items-center gap-2 text-[0.7rem] text-muted-foreground sm:flex">
          <Link className="hover:text-foreground" href="/dashboard">Workspace</Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-foreground">Notifications</span>
        </div>
        <DemoPersistenceNotice />
        <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="mb-3" variant="primary">
              <Bell aria-hidden="true" size={13} />
              Team inbox
            </Badge>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Workspace updates and collaboration activity in one place.
            </p>
          </div>
          <Button
            disabled={unreadCount === 0}
            onClick={() => markAllDemoNotificationsRead(activeWorkspace.id)}
            size="sm"
            variant="outline"
          >
            <CheckCheck aria-hidden="true" size={14} />
            Mark all as read
          </Button>
        </section>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={unreadCount ? "primary" : "secondary"}>
              {unreadCount} unread
            </Badge>
            <span className="text-xs text-muted-foreground">
              {notifications.length} total
            </span>
          </div>
          <label className="sr-only" htmlFor="notification-filter">Filter notifications</label>
          <select
            className="min-h-9 rounded-control border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            id="notification-filter"
            onChange={(event) => setFilter(event.target.value)}
            value={filter}
          >
            <option>All notifications</option>
            <option>Unread</option>
            {notificationTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
        </div>

        <Card className="divide-y divide-border overflow-hidden">
          {visibleNotifications.length ? visibleNotifications.map((notification) => {
            const Icon = icons[notification.type];
            return (
              <div
                className={`flex items-start gap-3 p-4 transition sm:gap-4 sm:p-5 ${
                  notification.read ? "" : "bg-primary/[0.035]"
                }`}
                key={notification.id}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon aria-hidden="true" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{notification.title}</p>
                    {!notification.read && <span className="size-2 rounded-full bg-primary" />}
                    <Badge variant="secondary">{notification.type}</Badge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {notification.description}
                  </p>
                  <time
                    className="mt-2 block text-[0.65rem] text-muted-foreground"
                    dateTime={notification.createdAt}
                  >
                    {formatTimestamp(notification.createdAt)}
                  </time>
                  <Link
                    className="mt-2 inline-flex text-xs font-semibold text-primary hover:text-primary-hover"
                    href={notification.href}
                    onClick={() => markDemoNotificationRead(activeWorkspace.id, notification.id)}
                  >
                    View update
                  </Link>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!notification.read && (
                    <button
                      aria-label={`Mark ${notification.title} as read`}
                      className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted hover:text-primary"
                      onClick={() => markDemoNotificationRead(activeWorkspace.id, notification.id)}
                      type="button"
                    >
                      <Check aria-hidden="true" size={15} />
                    </button>
                  )}
                  <button
                    aria-label={`Delete ${notification.title}`}
                    className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-danger-muted hover:text-danger"
                    onClick={() => removeDemoNotification(activeWorkspace.id, notification.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={14} />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="px-5 py-14 text-center">
              <Bell aria-hidden="true" className="mx-auto text-muted-foreground" size={23} />
              <p className="mt-3 text-sm font-semibold">You’re all caught up</p>
              <p className="mt-1 text-xs text-muted-foreground">
                New workspace updates will appear here.
              </p>
            </div>
          )}
        </Card>
        <p className="mt-3 text-[0.675rem] text-muted-foreground">
          Notifications are stored in this workspace and refresh when the page loads; delivery is not real-time.
        </p>
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground" role="status">
      Loading notifications…
    </div>
  );
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
