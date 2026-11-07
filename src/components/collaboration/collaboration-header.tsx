"use client";

import Link from "next/link";
import { Bell, CalendarDays, LayoutDashboard, UsersRound } from "lucide-react";
import { Brand } from "@/components/brand";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";

export function CollaborationHeader({ current }: { current: string }) {
  const { activeWorkspace, notifications } = useWorkspaceDemo();
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const links = [
    { href: "/activity", label: "Activity", icon: UsersRound },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.25rem] max-w-[88rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-9">
        <div className="flex min-w-0 items-center gap-4">
          <Brand />
          <span className="hidden h-6 w-px bg-border sm:block" />
          <nav aria-label="Collaboration" className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                aria-current={current === href ? "page" : undefined}
                className={`relative inline-flex size-9 items-center justify-center gap-2 rounded-control px-2 text-xs font-medium transition sm:w-auto sm:px-3 ${
                  current === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
                href={href}
                key={href}
                title={label}
              >
                <Icon aria-hidden="true" size={15} />
                <span className="hidden sm:inline">{label}</span>
                {href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[0.55rem] font-bold text-white sm:static sm:ml-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden max-w-36 truncate text-xs text-muted-foreground sm:inline">
            {activeWorkspace?.name}
          </span>
          <Link
            aria-label="Go to dashboard"
            className="inline-flex size-9 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
            href="/dashboard"
            title="Dashboard"
          >
            <LayoutDashboard aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}
