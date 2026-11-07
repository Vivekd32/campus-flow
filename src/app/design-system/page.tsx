import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Brand } from "@/components/brand";

const palette = [
  { label: "Primary", className: "bg-primary" },
  { label: "Secondary", className: "bg-secondary" },
  { label: "Success", className: "bg-success" },
  { label: "Warning", className: "bg-warning" },
  { label: "Danger", className: "bg-danger" },
];

export default function DesignSystemPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 size-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]"
      />

      <header className="relative z-10 mx-auto flex max-w-content items-center justify-between px-page py-6">
        <Brand />
        <Badge className="hidden sm:inline-flex" variant="outline">
          <span className="size-1.5 rounded-full bg-success" />
          Design foundations
        </Badge>
      </header>

      <main className="relative z-10 mx-auto max-w-content px-page">
        <section className="mx-auto flex max-w-4xl flex-col items-center pb-20 pt-16 text-center sm:pb-24 sm:pt-24">
          <Badge className="mb-7 gap-2 px-3 py-1.5" variant="secondary">
            <Sparkles aria-hidden="true" size={14} />
            A thoughtful foundation for professional teams
          </Badge>
          <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.08] tracking-[-0.055em] text-foreground sm:text-6xl md:text-7xl">
            Great work starts
            <br className="hidden sm:block" /> with a{" "}
            <span className="bg-linear-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              clearer flow.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Meet CampusFlow: a calm, considered home for the ideas and people
            behind your next great project.
          </p>
          <a
            className="mt-9 inline-flex min-h-12 items-center gap-2.5 rounded-control bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            href="#design-system"
          >
            Explore the design system
            <ArrowRight aria-hidden="true" size={16} />
          </a>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground">
            {["Made for collaboration", "Thoughtfully accessible", "Ready to grow"].map(
              (item) => (
                <span className="inline-flex items-center gap-2" key={item}>
                  <Check aria-hidden="true" className="text-success" size={14} />
                  {item}
                </span>
              ),
            )}
          </div>
        </section>

        <section
          aria-labelledby="design-system-title"
          className="scroll-mt-8 pb-20 sm:pb-28"
          id="design-system"
        >
          <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                The building blocks
              </p>
              <h2
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                id="design-system-title"
              >
                Simple pieces. One cohesive system.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              A small preview of the reusable elements and visual language
              behind CampusFlow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-5 sm:p-6">
              <SpecimenHeading
                description="Clear actions, with just the right amount of emphasis."
                title="Buttons"
              />
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Button size="sm">Primary</Button>
                <Button size="sm" variant="secondary">
                  Subtle
                </Button>
                <Button size="sm" variant="outline">
                  Outline
                </Button>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <SpecimenHeading
                description="Small, scannable labels for meaningful states."
                title="Badges"
              />
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="primary">In focus</Badge>
                <Badge variant="success">On track</Badge>
                <Badge variant="warning">Needs review</Badge>
                <Badge variant="danger">Blocked</Badge>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <SpecimenHeading
                description="Comfortable form controls with clear focus states."
                title="Input"
              />
              <label
                className="mb-2 mt-5 block text-xs font-semibold text-foreground"
                htmlFor="workspace-name"
              >
                Workspace name
              </label>
              <Input
                autoComplete="off"
                id="workspace-name"
                placeholder="Give your space a name"
              />
            </Card>

            <Card className="p-5 sm:p-6">
              <SpecimenHeading
                description="A friendly way to represent the people in your corner."
                title="Avatars"
              />
              <div className="mt-6 flex items-center gap-3">
                <Avatar name="CampusFlow" size="lg" />
                <Avatar
                  className="bg-primary/10 text-primary"
                  name="Student"
                />
                <Avatar
                  className="bg-success-muted text-success"
                  name="Teammate"
                  size="sm"
                />
                <span className="ml-1 text-sm text-muted-foreground">
                  Thoughtful by design
                </span>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <SpecimenHeading
                description="Quiet visual feedback that keeps progress in view."
                title="Progress"
              />
              <div className="mt-6 flex items-center justify-between text-xs font-medium">
                <span className="text-foreground">Progress preview</span>
                <span className="text-muted-foreground">68%</span>
              </div>
              <Progress className="mt-3" label="Progress preview" value={68} />
            </Card>

            <Card className="p-5 sm:p-6">
              <SpecimenHeading
                description="A balanced palette for emphasis and helpful feedback."
                title="Color palette"
              />
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-3">
                {palette.map((color) => (
                  <div
                    className="flex items-center gap-2"
                    key={color.label}
                    title={color.label}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-4 rounded-full ring-1 ring-black/5 ${color.className}`}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {color.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/80">
        <div className="mx-auto flex max-w-content flex-col gap-3 px-page py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Brand className="scale-90 origin-left" />
          <span>Thoughtfully designed for teams that build together.</span>
        </div>
      </footer>
    </div>
  );
}

function SpecimenHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
