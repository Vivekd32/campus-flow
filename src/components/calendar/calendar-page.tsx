"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import {
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { CollaborationHeader } from "@/components/collaboration/collaboration-header";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";
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
import type { DemoCalendarEvent } from "@/lib/collaboration-demo-data";
import {
  createDemoCalendarEvent,
  removeDemoCalendarEvent,
  updateDemoCalendarEvent,
} from "@/lib/workspace-demo-store";

type CalendarMode = "Month" | "Week" | "Day";
type CalendarKind = "Project deadline" | "Task deadline" | "Meeting" | "Event";
type CalendarItem = {
  id: string;
  title: string;
  kind: CalendarKind;
  date: string;
  time: string;
  description: string;
  projectId: string;
  attendeeIds: string[];
  location: string;
  href?: string;
  event?: DemoCalendarEvent;
};

const kindStyles: Record<CalendarKind, string> = {
  "Project deadline": "border-l-violet-500 bg-violet-500/10 text-violet-800 dark:text-violet-200",
  "Task deadline": "border-l-sky-500 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  Meeting: "border-l-primary bg-primary/10 text-primary",
  Event: "border-l-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200",
};

export function CalendarPage() {
  const { activeWorkspace, events, isHydrated, members, projects, tasks } =
    useWorkspaceDemo();
  const today = useSyncExternalStore(
    subscribeToDateChange,
    getTodaySnapshot,
    getTodayServerSnapshot,
  );
  const [mode, setMode] = useState<CalendarMode>("Month");
  const [cursor, setCursor] = useState<Date | null>(null);
  const [eventDialog, setEventDialog] = useState<DemoCalendarEvent | null | false>(false);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<DemoCalendarEvent | null>(null);
  const activeCursor = cursor ?? new Date(`${today || "2026-11-01"}T00:00:00`);
  const todayKey = today || dateKey(activeCursor);

  const items = useMemo(() => {
    const projectItems: CalendarItem[] = projects
      .filter((project) => !project.archived)
      .map((project) => ({
        id: `project-${project.id}`,
        title: project.name,
        kind: "Project deadline",
        date: project.dueDate.slice(0, 10),
        time: "",
        description: project.description,
        projectId: project.id,
        attendeeIds: project.memberIds,
        location: "",
        href: `/projects/${project.id}`,
      }));
    const taskItems: CalendarItem[] = tasks
      .filter((task) => task.status !== "Done" && projects.some((project) => project.id === task.projectId && !project.archived))
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        kind: "Task deadline",
        date: task.dueDate.slice(0, 10),
        time: "",
        description: task.description,
        projectId: task.projectId,
        attendeeIds: task.assigneeId ? [task.assigneeId] : [],
        location: "",
        href: `/tasks/${task.id}`,
      }));
    const eventItems: CalendarItem[] = events.map((event) => ({
      id: event.id,
      title: event.title,
      kind: event.type === "Meeting" ? "Meeting" : "Event",
      date: dateKey(new Date(event.startsAt)),
      time: formatTime(event.startsAt),
      description: event.description,
      projectId: event.projectId,
      attendeeIds: event.attendeeIds,
      location: event.location,
      event,
    }));
    return [...projectItems, ...taskItems, ...eventItems].sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    );
  }, [events, projects, tasks]);

  const days = getVisibleDays(activeCursor, mode);
  const visibleStart = days[0];
  const visibleEnd = days[days.length - 1];
  const upcoming = items
    .filter((item) => item.date >= todayKey)
    .slice(0, 10);

  if (!isHydrated || !activeWorkspace) {
    return <Loading />;
  }

  function moveCursor(direction: number) {
    setCursor((current) => {
      const next = new Date(current ?? activeCursor);
      if (mode === "Month") next.setMonth(next.getMonth() + direction);
      else if (mode === "Week") next.setDate(next.getDate() + direction * 7);
      else next.setDate(next.getDate() + direction);
      return next;
    });
  }

  function openCreate(date: Date = activeCursor) {
    const start = new Date(date);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 45);
    setEventDialog({
      id: "",
      workspaceId: activeWorkspace.id,
      title: "",
      description: "",
      type: "Meeting",
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      projectId: "",
      attendeeIds: [],
      location: "",
      createdAt: "",
    });
  }

  async function saveEvent(event: DemoCalendarEvent) {
    let saved: boolean;
    if (eventDialog && eventDialog.id) {
      saved = await updateDemoCalendarEvent(activeWorkspace.id, eventDialog.id, event);
    } else {
      saved = await createDemoCalendarEvent(activeWorkspace.id, event);
    }
    if (saved) {
      setEventDialog(false);
      setSelectedItem(null);
    }
    return saved;
  }

  const title = mode === "Month"
    ? activeCursor.toLocaleDateString("en", { month: "long", year: "numeric" })
    : `${visibleStart.toLocaleDateString("en", { month: "short", day: "numeric" })} – ${visibleEnd.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CollaborationHeader current="/calendar" />
      <main className="mx-auto max-w-[100rem] px-4 pb-14 pt-7 sm:px-6 lg:px-9 lg:pt-10">
        <div className="mb-6 hidden items-center gap-2 text-[0.7rem] text-muted-foreground sm:flex">
          <Link className="hover:text-foreground" href="/dashboard">Workspace</Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-foreground">Calendar</span>
        </div>
        <DemoPersistenceNotice />
        <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="mb-3" variant="primary">
              <CalendarDays aria-hidden="true" size={13} />
              Team schedule
            </Badge>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Calendar</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Deadlines, milestones, and meetings for {activeWorkspace.name}.
            </p>
          </div>
          <Button onClick={() => openCreate(activeCursor)} size="sm">
            <Plus aria-hidden="true" size={15} />
            Create event
          </Button>
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.65fr)]">
          <Card className="min-w-0 overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:px-5">
              <div className="flex items-center gap-2">
                <h2 className="min-w-0 text-sm font-semibold">{title}</h2>
                <button aria-label="Previous period" className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted" onClick={() => moveCursor(-1)} type="button"><ChevronLeft aria-hidden="true" size={17} /></button>
                <button aria-label="Next period" className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted" onClick={() => moveCursor(1)} type="button"><ChevronRight aria-hidden="true" size={17} /></button>
                <Button onClick={() => setCursor(null)} size="sm" variant="outline">Today</Button>
              </div>
              <div aria-label="Calendar view" className="flex rounded-control border border-border p-0.5">
                {(["Month", "Week", "Day"] as const).map((value) => (
                  <button
                    aria-pressed={mode === value}
                    className={`rounded-[0.6rem] px-3 py-1.5 text-xs font-medium transition ${mode === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    key={value}
                    onClick={() => setMode(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              {mode === "Month" && (
                <MonthGrid
                  cursor={activeCursor}
                  days={days}
                  items={items}
                  onCreate={openCreate}
                  onSelect={setSelectedItem}
                  todayKey={todayKey}
                />
              )}
              {mode === "Week" && (
                <WeekGrid
                  days={days}
                  items={items}
                  onCreate={openCreate}
                  onSelect={setSelectedItem}
                  todayKey={todayKey}
                />
              )}
              {mode === "Day" && (
                <DayAgenda
                  date={activeCursor}
                  items={items.filter((item) => item.date === dateKey(activeCursor))}
                  onCreate={openCreate}
                  onSelect={setSelectedItem}
                  todayKey={todayKey}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border px-4 py-3 text-[0.65rem] text-muted-foreground sm:px-5">
              {(Object.entries(kindStyles) as [CalendarKind, string][]).map(([kind]) => (
                <span className="inline-flex items-center gap-1.5" key={kind}>
                  <span className={`size-2 rounded-full ${legendColor(kind)}`} />
                  {kind}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Upcoming events</h2>
                <p className="mt-1 text-xs text-muted-foreground">Deadlines and team moments ahead.</p>
              </div>
              <Badge variant="secondary">{upcoming.length}</Badge>
            </div>
            <div className="space-y-2">
              {upcoming.map((item) => {
                const project = projects.find((entry) => entry.id === item.projectId);
                const attendees = item.attendeeIds
                  .map((id) => members.find((member) => member.id === id))
                  .filter((member): member is (typeof members)[number] => Boolean(member));
                return (
                  <button
                    className="flex w-full items-start gap-3 rounded-control border border-transparent p-3 text-left transition hover:border-border hover:bg-surface-muted/55"
                    key={`upcoming-${item.id}`}
                    onClick={() => setSelectedItem(item)}
                    type="button"
                  >
                    <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${legendSurface(item.kind)}`}>
                      {item.kind.includes("deadline") ? <CalendarDays aria-hidden="true" size={15} /> : <Clock3 aria-hidden="true" size={15} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold">{item.title}</span>
                      </span>
                      <span className="mt-1 block text-[0.65rem] text-muted-foreground">
                        {formatDate(item.date)}{item.time ? ` · ${item.time}` : ""}
                      </span>
                      {project && <span className="mt-1 block truncate text-[0.65rem] text-muted-foreground">{project.name}</span>}
                      {attendees.length > 0 && (
                        <span className="mt-2 flex items-center gap-1">
                          {attendees.slice(0, 3).map((member) => <Avatar className="size-6 text-[0.55rem]" key={member.id} name={member.name} size="sm" />)}
                          <span className="ml-1 text-[0.6rem] text-muted-foreground">{attendees.length} {attendees.length === 1 ? "attendee" : "attendees"}</span>
                        </span>
                      )}
                    </span>
                    {item.time && <span className="pt-1 text-[0.65rem] font-semibold text-muted-foreground">{item.time}</span>}
                  </button>
                );
              })}
              {upcoming.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No upcoming dates. Add an event to plan ahead.</p>}
            </div>
          </Card>
        </section>
      </main>
      {eventDialog && (
        <EventFormDialog
          event={eventDialog.id ? eventDialog : null}
          initialEvent={eventDialog}
          members={members}
          onClose={() => setEventDialog(false)}
          onSave={saveEvent}
          projects={projects.filter((project) => !project.archived)}
          workspaceId={activeWorkspace.id}
        />
      )}
      {selectedItem?.event && !eventDialog && (
        <EventDetailsDialog
          event={selectedItem.event}
          members={members}
          onClose={() => setSelectedItem(null)}
          onDelete={() => setDeleteEvent(selectedItem.event ?? null)}
          onEdit={() => setEventDialog(selectedItem.event ?? false)}
          project={projects.find((project) => project.id === selectedItem.projectId)}
        />
      )}
      {selectedItem && !selectedItem.event && selectedItem.href && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]" onMouseDown={(event) => event.target === event.currentTarget && setSelectedItem(null)}>
          <Card className="w-full max-w-md p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <Badge variant="secondary">{selectedItem.kind}</Badge>
                <h2 className="mt-3 text-lg font-semibold">{selectedItem.title}</h2>
              </div>
              <button aria-label="Close event details" className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted" onClick={() => setSelectedItem(null)} type="button"><X aria-hidden="true" size={16} /></button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{selectedItem.description}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium"><CalendarDays aria-hidden="true" size={14} />{formatDate(selectedItem.date)}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setSelectedItem(null)} variant="ghost">Close</Button>
              <Link className="inline-flex min-h-9 items-center gap-2 rounded-control bg-primary px-3 text-xs font-semibold text-primary-foreground" href={selectedItem.href} onClick={() => setSelectedItem(null)}>
                Open details <ExternalLink aria-hidden="true" size={13} />
              </Link>
            </div>
          </Card>
        </div>
      )}
      {deleteEvent && (
        <ConfirmDialog
          confirmLabel="Delete event"
          description={`“${deleteEvent.title}” will be removed from this workspace’s calendar.`}
          onCancel={() => setDeleteEvent(null)}
          onConfirm={() => {
            void removeDemoCalendarEvent(activeWorkspace.id, deleteEvent.id).then(
              (removed) => {
                if (removed) setDeleteEvent(null);
              },
            );
            setSelectedItem(null);
          }}
          title="Delete this event?"
        />
      )}
    </div>
  );
}

function MonthGrid({
  cursor,
  days,
  items,
  onCreate,
  onSelect,
  todayKey,
}: {
  cursor: Date;
  days: Date[];
  items: CalendarItem[];
  onCreate: (date: Date) => void;
  onSelect: (item: CalendarItem) => void;
  todayKey: string;
}) {
  const month = cursor.getMonth();
  return (
    <div className="min-w-[34rem]">
      <div className="grid grid-cols-7 border-b border-border bg-surface-muted/35">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div className="px-2 py-2.5 text-center text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground sm:py-3" key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day);
          const dayItems = items.filter((item) => item.date === key);
          return (
            <div className={`group min-h-24 border-b border-r border-border p-1.5 sm:min-h-28 sm:p-2 ${day.getMonth() !== month ? "bg-surface-muted/25" : ""}`} key={key}>
              <div className="mb-1 flex items-center justify-between">
                <span className={`inline-flex size-6 items-center justify-center rounded-full text-[0.65rem] ${key === todayKey ? "bg-primary font-bold text-primary-foreground" : day.getMonth() === month ? "text-foreground" : "text-muted-foreground/60"}`}>{day.getDate()}</span>
                <button aria-label={`Add event on ${formatDate(key)}`} className="inline-flex size-6 items-center justify-center rounded-control text-muted-foreground opacity-0 transition hover:bg-primary/10 hover:text-primary group-hover:opacity-100 focus:opacity-100" onClick={() => onCreate(day)} type="button"><Plus aria-hidden="true" size={13} /></button>
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <CalendarItemButton item={item} key={item.id} onSelect={onSelect} />
                ))}
                {dayItems.length > 3 && <p className="px-1 text-[0.58rem] text-muted-foreground">+{dayItems.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  days,
  items,
  onCreate,
  onSelect,
  todayKey,
}: {
  days: Date[];
  items: CalendarItem[];
  onCreate: (date: Date) => void;
  onSelect: (item: CalendarItem) => void;
  todayKey: string;
}) {
  return (
    <div className="grid min-w-[42rem] grid-cols-7 divide-x divide-border">
      {days.map((day) => {
        const key = dateKey(day);
        const dayItems = items.filter((item) => item.date === key);
        return (
          <div className="min-h-[28rem] p-2" key={key}>
            <button className={`mb-3 flex w-full flex-col items-center rounded-control py-2 text-xs ${key === todayKey ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-muted"}`} onClick={() => onCreate(day)} type="button">
              <span className="text-[0.6rem] uppercase">{day.toLocaleDateString("en", { weekday: "short" })}</span>
              <span className={`mt-1 flex size-7 items-center justify-center rounded-full text-sm font-semibold ${key === todayKey ? "bg-primary text-primary-foreground" : "text-foreground"}`}>{day.getDate()}</span>
            </button>
            <div className="space-y-1.5">
              {dayItems.map((item) => <CalendarItemButton item={item} key={item.id} onSelect={onSelect} />)}
              {dayItems.length === 0 && <button className="w-full rounded-control border border-dashed border-border py-3 text-[0.6rem] text-muted-foreground opacity-0 hover:bg-surface-muted focus:opacity-100" onClick={() => onCreate(day)} type="button">+ Add event</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayAgenda({
  date,
  items,
  onCreate,
  onSelect,
  todayKey,
}: {
  date: Date;
  items: CalendarItem[];
  onCreate: (date: Date) => void;
  onSelect: (item: CalendarItem) => void;
  todayKey: string;
}) {
  return (
    <div className="min-h-[28rem] p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{date.toLocaleDateString("en", { weekday: "long" })}</p>
          <p className={`mt-1 text-2xl font-semibold ${dateKey(date) === todayKey ? "text-primary" : ""}`}>{date.toLocaleDateString("en", { month: "long", day: "numeric" })}</p>
        </div>
        <Button onClick={() => onCreate(date)} size="sm" variant="outline"><Plus aria-hidden="true" size={14} />Add event</Button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <button className={`flex w-full items-center gap-3 rounded-control border-l-4 p-3 text-left ${kindStyles[item.kind]}`} key={item.id} onClick={() => onSelect(item)} type="button">
            <Clock3 aria-hidden="true" size={15} />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold">{item.title}</span>
              <span className="mt-1 block text-[0.65rem] opacity-80">{item.time || "All day"} · {item.kind}</span>
            </span>
            <ArrowRight aria-hidden="true" size={14} />
          </button>
        ))}
        {items.length === 0 && <div className="rounded-card border border-dashed border-border px-4 py-12 text-center text-xs text-muted-foreground">Nothing scheduled for this day.</div>}
      </div>
    </div>
  );
}

function CalendarItemButton({ item, onSelect }: { item: CalendarItem; onSelect: (item: CalendarItem) => void }) {
  return (
    <button className={`block w-full truncate rounded-r-control border-l-2 px-1.5 py-1 text-left text-[0.58rem] leading-4 transition hover:brightness-95 ${kindStyles[item.kind]}`} onClick={() => onSelect(item)} title={`${item.title}${item.time ? ` · ${item.time}` : ""}`} type="button">
      {item.time && <span className="mr-1 font-semibold">{item.time}</span>}{item.title}
    </button>
  );
}

function EventFormDialog({
  event,
  initialEvent,
  members,
  onClose,
  onSave,
  projects,
  workspaceId,
}: {
  event: DemoCalendarEvent | null;
  initialEvent: DemoCalendarEvent;
  members: { id: string; name: string; status: string }[];
  onClose: () => void;
  onSave: (event: DemoCalendarEvent) => Promise<boolean>;
  projects: { id: string; name: string }[];
  workspaceId: string;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [type, setType] = useState<DemoCalendarEvent["type"]>(event?.type ?? initialEvent.type);
  const [startsAt, setStartsAt] = useState(toLocalInput(event?.startsAt ?? initialEvent.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(event?.endsAt ?? initialEvent.endsAt));
  const [projectId, setProjectId] = useState(event?.projectId ?? "");
  const [attendeeIds, setAttendeeIds] = useState<string[]>(event?.attendeeIds ?? []);
  const [location, setLocation] = useState(event?.location ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!title.trim() || !startsAt || !endsAt) {
      setError("Enter a title and choose both start and end times.");
      return;
    }
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setError("The end time must be after the start time.");
      return;
    }
    setSaving(true);
    const saved = await onSave({
      id: event?.id ?? crypto.randomUUID(),
      workspaceId,
      title: title.trim(),
      description: description.trim(),
      type,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      projectId,
      attendeeIds,
      location: location.trim(),
      createdAt: event?.createdAt ?? new Date().toISOString(),
    });
    setSaving(false);
    if (!saved) setError("The event could not be saved. Check the workspace status and try again.");
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[3px] sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section aria-labelledby="calendar-event-title" aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-panel border border-border bg-surface p-5 shadow-popover sm:p-7" role="dialog">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div><h2 className="text-lg font-semibold" id="calendar-event-title">{event ? "Edit event" : "Create event"}</h2><p className="mt-1 text-xs text-muted-foreground">Plan a meeting or add an event to this workspace calendar.</p></div>
          <button aria-label="Close event form" className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted" disabled={saving} onClick={onClose} type="button"><X aria-hidden="true" size={16} /></button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-xs font-semibold">Event title<Input className="mt-1.5" onChange={(e) => setTitle(e.target.value)} required value={title} /></label>
          <label className="block text-xs font-semibold">Description<textarea className="mt-1.5 min-h-20 w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm font-normal text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" onChange={(e) => setDescription(e.target.value)} value={description} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Event type"><select className={selectClass} onChange={(e) => setType(e.target.value as DemoCalendarEvent["type"])} value={type}><option>Meeting</option><option>General</option></select></Field>
            <Field label="Related project"><select className={selectClass} onChange={(e) => setProjectId(e.target.value)} value={projectId}><option value="">No project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
            <Field label="Start date and time"><Input className="min-h-10 text-xs" onChange={(e) => setStartsAt(e.target.value)} required type="datetime-local" value={startsAt} /></Field>
            <Field label="End date and time"><Input className="min-h-10 text-xs" onChange={(e) => setEndsAt(e.target.value)} required type="datetime-local" value={endsAt} /></Field>
          </div>
          <label className="block text-xs font-semibold">Location or meeting link<Input className="mt-1.5" onChange={(e) => setLocation(e.target.value)} placeholder="Office room or https://..." value={location} /></label>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold">Attendees</legend>
            <div className="grid max-h-32 gap-2 overflow-y-auto rounded-control border border-border p-3 sm:grid-cols-2">
              {members.filter((member) => member.status === "Active").map((member) => (
                <label className="flex items-center gap-2 text-xs text-muted-foreground" key={member.id}>
                  <input checked={attendeeIds.includes(member.id)} className="size-4 accent-primary" onChange={(e) => setAttendeeIds((current) => e.target.checked ? [...current, member.id] : current.filter((id) => id !== member.id))} type="checkbox" />
                  <Avatar name={member.name} size="sm" />{member.name}
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p className="text-xs text-danger" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 pt-2"><Button disabled={saving} onClick={onClose} type="button" variant="ghost">Cancel</Button><Button disabled={saving} type="submit">{saving ? "Saving…" : event ? "Save changes" : "Create event"}</Button></div>
        </form>
      </section>
    </div>
  );
}

function EventDetailsDialog({
  event,
  members,
  onClose,
  onDelete,
  onEdit,
  project,
}: {
  event: DemoCalendarEvent;
  members: { id: string; name: string }[];
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  project?: { id: string; name: string };
}) {
  const attendees = event.attendeeIds.map((id) => members.find((member) => member.id === id)).filter((member): member is (typeof members)[number] => Boolean(member));
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <Card className="w-full max-w-lg p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div><Badge variant="primary">{event.type}</Badge><h2 className="mt-3 text-xl font-semibold">{event.title}</h2></div>
          <button aria-label="Close event details" className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground hover:bg-surface-muted" onClick={onClose} type="button"><X aria-hidden="true" size={16} /></button>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{event.description || "No description added."}</p>
        <div className="mt-5 space-y-3 border-t border-border pt-4 text-xs">
          <p className="flex items-center gap-2"><CalendarDays aria-hidden="true" size={14} />{new Date(event.startsAt).toLocaleString("en", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
          <p className="flex items-center gap-2"><Clock3 aria-hidden="true" size={14} />Until {new Date(event.endsAt).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</p>
          {event.location && <p className="flex items-center gap-2 break-all"><MapPin aria-hidden="true" size={14} />{event.location}</p>}
          {project && <p className="flex items-center gap-2"><CalendarDays aria-hidden="true" size={14} />{project.name}</p>}
          <div className="flex items-start gap-2"><UsersRound aria-hidden="true" className="mt-0.5" size={14} /><span className="flex flex-wrap gap-2">{attendees.length ? attendees.map((member) => <span className="inline-flex items-center gap-1.5" key={member.id}><Avatar name={member.name} size="sm" />{member.name}</span>) : "No attendees"}</span></div>
        </div>
        <div className="mt-6 flex justify-between gap-2"><Button className="text-danger hover:bg-danger-muted" onClick={onDelete} size="sm" variant="ghost"><Trash2 aria-hidden="true" size={14} />Delete</Button><div className="flex gap-2"><Button onClick={onClose} size="sm" variant="outline">Close</Button><Button onClick={onEdit} size="sm"><Pencil aria-hidden="true" size={14} />Edit event</Button></div></div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-semibold">{label}<div className="mt-1.5">{children}</div></label>;
}

function Loading() {
  return <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground" role="status">Loading calendar…</div>;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getVisibleDays(cursor: Date, mode: CalendarMode) {
  const start = startOfDay(cursor);
  if (mode === "Month") {
    start.setDate(1);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }
  if (mode === "Week") {
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }
  return [start];
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function legendColor(kind: CalendarKind) {
  return {
    "Project deadline": "bg-violet-500",
    "Task deadline": "bg-sky-500",
    Meeting: "bg-primary",
    Event: "bg-amber-500",
  }[kind];
}

function legendSurface(kind: CalendarKind) {
  return {
    "Project deadline": "bg-violet-500/10 text-violet-700 dark:text-violet-200",
    "Task deadline": "bg-sky-500/10 text-sky-700 dark:text-sky-200",
    Meeting: "bg-primary/10 text-primary",
    Event: "bg-amber-500/10 text-amber-700 dark:text-amber-200",
  }[kind];
}

const selectClass =
  "min-h-10 w-full rounded-control border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";
