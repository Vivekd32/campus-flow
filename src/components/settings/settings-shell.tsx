import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { DemoPersistenceNotice } from "@/components/settings/demo-persistence-notice";
import { SettingsThemeControl } from "@/components/settings/settings-theme-control";

type SettingsSection = "workspace" | "members" | "roles";

const sections: {
  id: SettingsSection;
  label: string;
  href: string;
  icon: typeof Building2;
}[] = [
  {
    id: "workspace",
    label: "Workspace & company",
    href: "/settings/workspace",
    icon: Building2,
  },
  { id: "members", label: "Members", href: "/settings/members", icon: UsersRound },
  {
    id: "roles",
    label: "Roles & permissions",
    href: "/settings/roles",
    icon: ShieldCheck,
  },
];

export function SettingsShell({
  active,
  children,
}: {
  active: SettingsSection;
  children: ReactNode;
}) {
  const activeSection = sections.find((section) => section.id === active);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-[88rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
          <div className="flex items-center gap-4">
            <Brand />
            <span className="hidden h-6 w-px bg-border sm:block" />
            <p className="hidden text-xs font-medium text-muted-foreground sm:block">
              Workspace settings
            </p>
          </div>
          <div className="flex items-center gap-1">
            <SettingsThemeControl />
            <Link
              className="inline-flex min-h-9 items-center gap-2 rounded-control px-3 text-xs font-semibold text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
              href="/dashboard"
            >
              <ArrowLeft aria-hidden="true" size={15} />
              <span className="hidden sm:inline">Back to dashboard</span>
              <span className="sr-only sm:hidden">Back to dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-w-0 max-w-[88rem] grid-cols-[minmax(0,1fr)] gap-8 px-4 pb-14 pt-7 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12 lg:px-9 lg:pt-10">
        <aside className="min-w-0">
          <div className="mb-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Settings
            </p>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              Manage your company workspace and team access.
            </p>
          </div>
          <nav
            aria-label="Workspace settings"
            className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {sections.map(({ id, label, href, icon: Icon }) => {
              const isActive = active === id;
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-10 shrink-0 items-center gap-2.5 rounded-control px-3 text-xs font-medium transition ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  }`}
                  href={href}
                  key={id}
                >
                  <Icon aria-hidden="true" size={16} />
                  {label}
                  {isActive && (
                    <ChevronRight
                      aria-hidden="true"
                      className="ml-auto hidden lg:block"
                      size={14}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-7 hidden rounded-card border border-primary/10 bg-primary/[0.035] p-3.5 lg:block">
            <p className="text-xs font-semibold text-foreground">
              Supabase workspace
            </p>
            <p className="mt-1.5 text-[0.675rem] leading-5 text-muted-foreground">
              Company data is loaded from the active workspace and protected by
              database access policies.
            </p>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-6 hidden items-center gap-2 text-[0.7rem] text-muted-foreground lg:flex">
            <Link className="transition hover:text-foreground" href="/dashboard">
              Workspace
            </Link>
            <ChevronRight aria-hidden="true" size={13} />
            <span>Settings</span>
            <ChevronRight aria-hidden="true" size={13} />
            <span className="font-semibold text-foreground">
              {activeSection?.label}
            </span>
          </div>
          <DemoPersistenceNotice />
          {children}
        </main>
      </div>
    </div>
  );
}
