import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { Card } from "@/components/ui/card";

type AuthLayoutProps = {
  children: ReactNode;
};

const projectItems = [
  { title: "Website refresh", label: "Design", color: "bg-violet-400" },
  { title: "Q4 launch plan", label: "In progress", color: "bg-indigo-400" },
  { title: "Customer research", label: "Review", color: "bg-emerald-400" },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 -top-40 size-[32rem] rounded-full bg-primary/10 blur-[120px]"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-[80rem] items-center justify-between px-page py-6">
        <Brand />
        <div className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
          <ShieldCheck aria-hidden="true" className="text-primary" size={15} />
          Your team&apos;s work, in one place
        </div>
      </div>

      <main className="relative z-10 mx-auto grid w-full max-w-[80rem] flex-1 items-center gap-8 px-page pb-10 pt-2 md:grid-cols-[minmax(0,1fr)_minmax(28rem,0.9fr)] md:gap-12 md:pb-14">
        <aside className="auth-enter hidden max-w-xl md:block">
          <p className="mb-5 inline-flex items-center gap-2 rounded-pill border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            A clearer way to work together
          </p>
          <h1 className="max-w-lg text-balance text-4xl font-semibold leading-[1.12] tracking-[-0.045em] text-foreground lg:text-5xl">
            Make room for
            <br />
            <span className="bg-linear-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              meaningful work.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-pretty text-base leading-7 text-muted-foreground">
            Bring projects, priorities, and people together in a workspace
            designed for teams that get things done.
          </p>

          <Card className="mt-9 max-w-md overflow-hidden border-border/80 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  YOUR WORKSPACE
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Studio North
                </p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ArrowUpRight aria-hidden="true" size={17} />
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {projectItems.map((item) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-control bg-surface-muted/70 px-3 py-2.5"
                  key={item.title}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`size-2 rounded-full ${item.color}`}
                    />
                    <span className="truncate text-xs font-medium text-foreground">
                      {item.title}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="flex -space-x-1.5" aria-hidden="true">
                {["bg-violet-400", "bg-sky-400", "bg-amber-400"].map(
                  (color, index) => (
                    <span
                      className={`size-6 rounded-full border-2 border-surface ${color}`}
                      key={color}
                      style={{ zIndex: 3 - index }}
                    />
                  ),
                )}
              </span>
              <span>Good work happens together.</span>
              <Check
                aria-hidden="true"
                className="ml-auto text-success"
                size={15}
              />
            </div>
          </Card>
          <p className="mt-6 text-xs text-muted-foreground">
            Built for focused, collaborative teams.
          </p>
        </aside>

        <section className="auth-enter mx-auto w-full max-w-[30rem]">
          {children}
        </section>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-[80rem] items-center justify-between px-page py-5 text-xs text-muted-foreground">
        <span>© CampusFlow</span>
        <span className="hidden sm:inline">Made for teams that move work forward</span>
      </footer>
    </div>
  );
}
