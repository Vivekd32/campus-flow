"use client";

import {
  Building2,
  Check,
  CircleHelp,
  Globe2,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import {
  companyIndustries,
  companySizes,
  timeZones,
  type DemoWorkspace,
  type WorkspaceSettings,
} from "@/lib/workspace-demo-data";
import {
  createWorkspace,
  removeWorkspace,
  saveWorkspaceSettings,
  switchWorkspace,
} from "@/lib/workspace-demo-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";

const workspaceColors = [
  "bg-primary",
  "bg-sky-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
];

type SettingsDraft = WorkspaceSettings & { name: string };

export function WorkspaceSettingsPage() {
  const { activeWorkspace, isHydrated, workspaces } = useWorkspaceDemo();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] =
    useState<DemoWorkspace | null>(null);

  if (!isHydrated || !activeWorkspace) {
    return (
      <Card
        aria-busy="true"
        className="p-6 text-sm text-muted-foreground"
        role="status"
      >
        Loading workspace settings…
      </Card>
    );
  }

  function handleDelete() {
    if (!deletingWorkspace) return;
    void removeWorkspace(deletingWorkspace.id).then((removed) => {
      if (removed) setDeletingWorkspace(null);
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge className="mb-3" variant="secondary">
            <Building2 aria-hidden="true" size={13} />
            Company workspace
          </Badge>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.8rem]">
            Workspace settings
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
            Manage your company details, workspace identity, and time zone.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-success" />
          Active:{" "}
          <span className="font-semibold text-foreground">
            {activeWorkspace.name}
          </span>
        </div>
      </header>

      <WorkspaceList
        activeWorkspaceId={activeWorkspace.id}
        onCreate={() => setCreateOpen(true)}
        onDelete={setDeletingWorkspace}
        workspaces={workspaces}
      />

      <CompanyProfile
        key={activeWorkspace.id}
        onSave={(draft) => saveWorkspaceSettings(activeWorkspace.id, draft)}
        workspace={activeWorkspace}
      />

      {createOpen && <CreateWorkspaceDialog onClose={() => setCreateOpen(false)} />}
      {deletingWorkspace && (
        <ConfirmDialog
          confirmLabel="Delete workspace"
          description={`“${deletingWorkspace.name}” and its company data will be permanently deleted. This cannot be undone.`}
          onCancel={() => setDeletingWorkspace(null)}
          onConfirm={handleDelete}
          title="Delete this workspace?"
        />
      )}
    </div>
  );
}

function WorkspaceList({
  activeWorkspaceId,
  onCreate,
  onDelete,
  workspaces,
}: {
  activeWorkspaceId: string;
  onCreate: () => void;
  onDelete: (workspace: DemoWorkspace) => void;
  workspaces: DemoWorkspace[];
}) {
  return (
    <section aria-labelledby="workspaces-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2
            className="text-base font-semibold text-foreground"
            id="workspaces-heading"
          >
            Your workspaces
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Switch between your company spaces or create a new one.
          </p>
        </div>
        <Button onClick={onCreate} size="sm">
          <Plus aria-hidden="true" size={15} />
          <span className="hidden sm:inline">New workspace</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {workspaces.map((workspace) => {
          const isActive = workspace.id === activeWorkspaceId;
          return (
            <Card
              className={`p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-popover ${
                isActive ? "border-primary/35 ring-2 ring-primary/10" : ""
              }`}
              key={workspace.id}
            >
              <div className="flex items-start gap-3">
                <WorkspaceMark workspace={workspace} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {workspace.name}
                    </h3>
                    {isActive && (
                      <Badge variant="primary">
                        <Check aria-hidden="true" size={11} />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {workspace.companyName}
                  </p>
                </div>
                <button
                  aria-label={`Edit ${workspace.name}`}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
                  onClick={() => {
                    switchWorkspace(workspace.id);
                    document
                      .getElementById("company-profile")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  type="button"
                >
                  <Pencil aria-hidden="true" size={14} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="inline-flex items-center gap-1.5 text-[0.675rem] text-muted-foreground">
                  <UsersRound aria-hidden="true" size={13} />
                  Workspace
                </span>
                <div className="flex items-center gap-1">
                  {!isActive && (
                    <Button
                      onClick={() => switchWorkspace(workspace.id)}
                      size="sm"
                      variant="outline"
                    >
                      Switch
                    </Button>
                  )}
                  <button
                    aria-label={`Delete ${workspace.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition hover:bg-danger-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={workspaces.length <= 1}
                    onClick={() => onDelete(workspace)}
                    title={
                      workspaces.length <= 1
                        ? "At least one workspace is required"
                        : "Delete workspace"
                    }
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function WorkspaceMark({ workspace }: { workspace: DemoWorkspace }) {
  const initials = workspace.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return workspace.logoDataUrl ? (
    <span
      aria-label={`${workspace.name} logo`}
      className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface"
      role="img"
      style={{
        backgroundImage: `url("${workspace.logoDataUrl}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    />
  ) : (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${workspace.color}`}
    >
      {initials}
    </span>
  );
}

function CompanyProfile({
  onSave,
  workspace,
}: {
  onSave: (draft: SettingsDraft) => Promise<boolean>;
  workspace: DemoWorkspace;
}) {
  const [draft, setDraft] = useState<SettingsDraft>({
    name: workspace.name,
    companyName: workspace.companyName,
    description: workspace.description,
    industry: workspace.industry,
    website: workspace.website,
    companySize: workspace.companySize,
    timeZone: workspace.timeZone,
    logoDataUrl: workspace.logoDataUrl,
  });
  const [logoError, setLogoError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveMessage("");
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError("");
    if (!file.type.startsWith("image/")) {
      setLogoError("Choose an image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setLogoError("This image could not be previewed. Try another file.");
        return;
      }
      update("logoDataUrl", reader.result);
    };
    reader.onerror = () => {
      setLogoError("This image could not be read. Try another file.");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const saved = await onSave(draft);
    setSaving(false);
    setSaveMessage(
      saved ? "Workspace settings saved." : "Workspace settings could not be saved.",
    );
  }

  return (
    <section aria-labelledby="company-profile-heading" id="company-profile">
      <div className="mb-4">
        <h2
          className="text-base font-semibold text-foreground"
          id="company-profile-heading"
        >
          Company profile
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Share the details your team uses to identify this workspace.
        </p>
      </div>
      <Card className="p-4 sm:p-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
            <WorkspaceMark workspace={{ ...workspace, ...draft }} />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Company logo</p>
              <p className="mt-1 text-[0.675rem] text-muted-foreground">
                PNG, JPG, or WebP. Maximum file size 2 MB.
              </p>
              {logoError && (
                <p className="mt-1.5 text-xs text-danger" role="alert">
                  {logoError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-control border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:bg-surface-muted">
                <Upload aria-hidden="true" size={14} />
                Upload logo
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleLogoChange}
                  type="file"
                />
              </label>
              {draft.logoDataUrl && (
                <button
                  aria-label="Remove company logo"
                  className="inline-flex size-9 items-center justify-center rounded-control text-muted-foreground transition hover:bg-danger-muted hover:text-danger"
                  onClick={() => update("logoDataUrl", "")}
                  type="button"
                >
                  <X aria-hidden="true" size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField label="Company name" htmlFor="company-name">
              <Input
                autoComplete="organization"
                id="company-name"
                onChange={(event) => update("companyName", event.target.value)}
                required
                value={draft.companyName}
              />
            </SettingsField>
            <SettingsField label="Workspace name" htmlFor="workspace-name">
              <Input
                id="workspace-name"
                onChange={(event) => update("name", event.target.value)}
                required
                value={draft.name}
              />
            </SettingsField>
            <SettingsField label="Industry" htmlFor="industry">
              <SelectInput
                id="industry"
                onChange={(value) => update("industry", value)}
                options={companyIndustries}
                value={draft.industry}
              />
            </SettingsField>
            <SettingsField label="Company website" htmlFor="website">
              <div className="relative">
                <Globe2
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={15}
                />
                <Input
                  autoComplete="url"
                  className="pl-9"
                  id="website"
                  onChange={(event) => update("website", event.target.value)}
                  placeholder="https://company.com"
                  type="url"
                  value={draft.website}
                />
              </div>
            </SettingsField>
            <SettingsField label="Company size" htmlFor="company-size">
              <SelectInput
                id="company-size"
                onChange={(value) => update("companySize", value)}
                options={companySizes}
                value={draft.companySize}
              />
            </SettingsField>
            <SettingsField label="Time zone" htmlFor="time-zone">
              <select
                className={selectClassName}
                id="time-zone"
                onChange={(event) => update("timeZone", event.target.value)}
                value={draft.timeZone}
              >
                {timeZones.map((timeZone) => (
                  <option key={timeZone.value} value={timeZone.value}>
                    {timeZone.label}
                  </option>
                ))}
              </select>
            </SettingsField>
            <div className="sm:col-span-2">
              <SettingsField label="Company description" htmlFor="description">
                <textarea
                  className="min-h-24 w-full resize-y rounded-control border border-border bg-surface px-3.5 py-3 text-sm text-foreground shadow-sm transition placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  id="description"
                  maxLength={300}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="What does your company do?"
                  value={draft.description}
                />
                <p className="mt-1 text-right text-[0.625rem] text-muted-foreground">
                  {draft.description.length}/300
                </p>
              </SettingsField>
            </div>
          </div>
          <div className="flex flex-col-reverse justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
            <p
              aria-live="polite"
              className="inline-flex min-h-5 items-center gap-1.5 text-xs text-success"
              role="status"
            >
              {saveMessage && (
                <>
                  <Check aria-hidden="true" size={14} />
                  {saveMessage}
                </>
              )}
            </p>
            <Button className="w-full sm:w-auto" disabled={saving} size="md" type="submit">
              {saving ? (
                <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" size={15} />
              ) : (
                <Save aria-hidden="true" size={15} />
              )}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
      <p className="mt-3 flex items-start gap-2 text-[0.675rem] leading-5 text-muted-foreground">
        <CircleHelp aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
        Workspace access and saved company settings are controlled by your
        Supabase workspace membership.
      </p>
    </section>
  );
}

const selectClassName =
  "min-h-11 w-full rounded-control border border-border bg-surface px-3.5 text-sm text-foreground shadow-sm transition hover:border-primary/35 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

function SettingsField({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-semibold text-foreground"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectInput({
  id,
  onChange,
  options,
  value,
}: {
  id: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <select
      className={selectClassName}
      id={id}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {!options.includes(value) && <option value={value}>{value}</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const { workspaces } = useWorkspaceDemo();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedCompany = companyName.trim();
    if (!trimmedName || !trimmedCompany) {
      setError("Enter both a workspace and company name.");
      return;
    }
    const workspace: DemoWorkspace = {
      id: crypto.randomUUID(),
      name: trimmedName,
      companyName: trimmedCompany,
      description: "",
      industry: "Technology",
      website: "",
      companySize: "1 employee",
      timeZone: "America/Los_Angeles",
      logoDataUrl: "",
      color: workspaceColors[workspaces.length % workspaceColors.length],
    };
    setSaving(true);
    const created = await createWorkspace(workspace);
    setSaving(false);
    if (created) onClose();
    else setError("The company workspace could not be created.");
  }

  return (
    <Modal onClose={onClose} title="Create a workspace">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-xs leading-5 text-muted-foreground">
          Give your new team space a name and connect it to your company.
        </p>
        <SettingsField label="Workspace name" htmlFor="new-workspace-name">
          <Input
            autoFocus
            id="new-workspace-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Product team"
            required
            value={name}
          />
        </SettingsField>
        <SettingsField label="Company name" htmlFor="new-company-name">
          <Input
            id="new-company-name"
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="e.g. Acme, Inc."
            required
            value={companyName}
          />
        </SettingsField>
        {error && (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        <p className="rounded-control bg-surface-muted px-3 py-2.5 text-[0.675rem] leading-5 text-muted-foreground">
          The workspace will be saved to Supabase and made active for your
          account.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button disabled={saving || !name.trim() || !companyName.trim()} type="submit">
            {saving ? (
              <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" size={15} />
            ) : (
              <Plus aria-hidden="true" size={15} />
            )}
            {saving ? "Creating…" : "Create workspace"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="workspace-modal-title"
        aria-modal="true"
        className="auth-enter w-full max-w-[28rem] rounded-panel border border-border bg-surface p-5 shadow-popover sm:p-7"
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2
            className="text-base font-semibold text-foreground"
            id="workspace-modal-title"
          >
            {title}
          </h2>
          <button
            aria-label="Close dialog"
            className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
