"use client";

import {
  Check,
  ChevronDown,
  MailPlus,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import {
  departments,
  memberRoles,
  type DemoMember,
  type MemberRole,
  type MemberStatus,
} from "@/lib/workspace-demo-data";
import {
  addDemoMember,
  removeDemoMember,
  updateDemoMember,
} from "@/lib/workspace-demo-store";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";

type MemberFilter = "All roles" | MemberRole;
type StatusFilter = "All statuses" | MemberStatus;
type MemberDraft = Omit<DemoMember, "id" | "joinedAt" | "status">;

const avatarColors = [
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-200",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200",
];

export function MembersManagementPage() {
  const { activeWorkspace, isHydrated, members } = useWorkspaceDemo();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberFilter>("All roles");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All statuses");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DemoMember | null>(null);
  const [removingMember, setRemovingMember] = useState<DemoMember | null>(null);
  const [menuMemberId, setMenuMemberId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery =
        !normalizedQuery ||
        `${member.name} ${member.email} ${member.department}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesRole =
        roleFilter === "All roles" || member.role === roleFilter;
      const matchesStatus =
        statusFilter === "All statuses" || member.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [members, query, roleFilter, statusFilter]);

  async function handleInvite(draft: MemberDraft) {
    if (!activeWorkspace) return false;
    const saved = await addDemoMember(activeWorkspace.id, {
      ...draft,
      id: `member-${crypto.randomUUID()}`,
      status: "Pending",
      joinedAt: "Invitation pending",
    });
    if (saved) {
      setInviteOpen(false);
      setNotice(`Invitation record for ${draft.name} was saved. No email was sent.`);
    }
    return saved;
  }

  async function handleEdit(member: DemoMember, draft: MemberDraft) {
    if (!activeWorkspace) return false;
    const saved = await updateDemoMember(activeWorkspace.id, member.id, {
      ...member,
      ...draft,
    });
    if (saved) {
      setEditingMember(null);
      setNotice(`${draft.name}'s member details were updated.`);
    }
    return saved;
  }

  async function handleRemove() {
    if (!removingMember || !activeWorkspace) return;
    const removed = await removeDemoMember(activeWorkspace.id, removingMember.id);
    if (removed) {
      setNotice(`${removingMember.name} was removed from the workspace.`);
      setRemovingMember(null);
    }
  }

  if (!isHydrated) {
    return (
      <Card
        aria-busy="true"
        className="p-6 text-sm text-muted-foreground"
        role="status"
      >
        Loading workspace members…
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge className="mb-3" variant="secondary">
            <UsersRound aria-hidden="true" size={13} />
            Team access
          </Badge>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.8rem]">
            Members
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
            Invite teammates and manage the roles shown in this workspace.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setInviteOpen(true)}
          size="md"
        >
          <UserPlus aria-hidden="true" size={16} />
          Invite member
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <MemberSummary label="Total members" value={members.length} />
        <MemberSummary
          label="Active"
          value={members.filter((member) => member.status === "Active").length}
        />
        <MemberSummary
          label="Invitations pending"
          value={members.filter((member) => member.status === "Pending").length}
        />
      </div>

      {notice && (
        <p
          aria-live="polite"
          className="rounded-control border border-success/20 bg-success-muted px-3.5 py-3 text-xs text-foreground"
          role="status"
        >
          {notice}
        </p>
      )}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Team members
            </h2>
            <p className="mt-1 text-[0.675rem] text-muted-foreground">
              {activeWorkspace?.name ?? "Workspace"} · {filteredMembers.length} shown
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-56">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={15}
              />
              <Input
                aria-label="Search members"
                className="min-h-9 pl-9 text-xs shadow-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search members..."
                value={query}
              />
            </label>
            <FilterSelect
              ariaLabel="Filter by role"
              onChange={(value) => setRoleFilter(value as MemberFilter)}
              value={roleFilter}
              values={["All roles", ...memberRoles]}
            />
            <FilterSelect
              ariaLabel="Filter by status"
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              value={statusFilter}
              values={["All statuses", "Active", "Pending"]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[54rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface-muted/45 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => (
                <tr
                  className="border-b border-border/70 last:border-0 transition hover:bg-surface-muted/35"
                  key={member.id}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className={avatarColors[index % avatarColors.length]}
                        name={member.name}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {member.name}
                        </p>
                        <p className="mt-1 truncate text-[0.675rem] text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {member.department}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={getRoleBadge(member.role)}>
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={member.status === "Active" ? "success" : "warning"}>
                      <span className="size-1.5 rounded-full bg-current" />
                      {member.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {member.joinedAt}
                  </td>
                  <td className="relative px-4 py-3.5 text-right">
                    <button
                      aria-expanded={menuMemberId === member.id}
                      aria-label={`Actions for ${member.name}`}
                      className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
                      onClick={() =>
                        setMenuMemberId((current) =>
                          current === member.id ? null : member.id,
                        )
                      }
                      type="button"
                    >
                      <MoreHorizontal aria-hidden="true" size={17} />
                    </button>
                    {menuMemberId === member.id && (
                      <div className="dashboard-popover absolute right-8 top-10 z-20 w-40 rounded-control border border-border bg-surface p-1.5 text-left shadow-popover">
                        <button
                          className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-xs text-foreground transition hover:bg-surface-muted"
                          onClick={() => {
                            setEditingMember(member);
                            setMenuMemberId(null);
                          }}
                          type="button"
                        >
                          <Pencil aria-hidden="true" size={14} />
                          Edit details
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-xs text-danger transition hover:bg-danger-muted"
                          onClick={() => {
                            setRemovingMember(member);
                            setMenuMemberId(null);
                          }}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={14} />
                          Remove member
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="px-5 py-12 text-center">
              <UsersRound
                aria-hidden="true"
                className="mx-auto text-muted-foreground"
                size={22}
              />
              <p className="mt-3 text-sm font-semibold text-foreground">
                No members found
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try another search or clear the selected filters.
              </p>
              <button
                className="mt-3 text-xs font-semibold text-primary"
                onClick={() => {
                  setQuery("");
                  setRoleFilter("All roles");
                  setStatusFilter("All statuses");
                }}
                type="button"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-border bg-surface-muted/30 px-4 py-3 text-[0.675rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p>
            <MailPlus aria-hidden="true" className="mr-1 inline" size={13} />
            Pending invitations are recorded in Supabase; email delivery is not configured.
          </p>
          <p>Role changes are enforced by database policies.</p>
        </div>
      </Card>

      <div aria-live="polite" className="sr-only">
        {notice}
      </div>

      {inviteOpen && (
        <MemberDialog
          onCancel={() => setInviteOpen(false)}
          onSubmit={handleInvite}
          title="Invite a team member"
        />
      )}
      {editingMember && (
        <MemberDialog
          member={editingMember}
          onCancel={() => setEditingMember(null)}
          onSubmit={(draft) => handleEdit(editingMember, draft)}
          title="Edit member details"
        />
      )}
      {removingMember && (
        <ConfirmDialog
          confirmLabel="Remove member"
          description={`${removingMember.name} will lose access to this company workspace. This change can’t be undone.`}
          onCancel={() => setRemovingMember(null)}
          onConfirm={handleRemove}
          title="Remove this member?"
        />
      )}
    </div>
  );
}

function MemberSummary({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex items-center justify-between p-4">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
      </div>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <UsersRound aria-hidden="true" size={17} />
      </span>
    </Card>
  );
}

function FilterSelect({
  ariaLabel,
  onChange,
  value,
  values,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  value: string;
  values: string[];
}) {
  return (
    <div className="relative min-w-0">
      <select
        aria-label={ariaLabel}
        className="min-h-9 w-full appearance-none rounded-control border border-border bg-surface py-2 pl-3 pr-8 text-xs text-foreground transition hover:border-primary/35 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-auto"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={13}
      />
    </div>
  );
}

function getRoleBadge(role: MemberRole): "primary" | "secondary" | "default" {
  if (role === "Owner" || role === "Admin") return "primary";
  if (role === "Project Manager") return "secondary";
  return "default";
}

function MemberDialog({
  member,
  onCancel,
  onSubmit,
  title,
}: {
  member?: DemoMember;
  onCancel: () => void;
  onSubmit: (draft: MemberDraft) => Promise<boolean>;
  title: string;
}) {
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [department, setDepartment] = useState(member?.department ?? "Design");
  const [role, setRole] = useState<MemberRole>(member?.role ?? "Member");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid work email address.");
      return;
    }
    if (!trimmedName) {
      setError("Enter the team member’s full name.");
      return;
    }
    if (role === "Owner") {
      setError("Owner access can only be assigned through an authorized ownership transfer.");
      return;
    }
    setSaving(true);
    const saved = await onSubmit({
      name: trimmedName,
      email: trimmedEmail,
      department,
      role,
    });
    setSaving(false);
    if (saved) onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        aria-labelledby="member-dialog-title"
        aria-modal="true"
        className="auth-enter w-full max-w-[29rem] rounded-panel border border-border bg-surface p-5 shadow-popover sm:p-7"
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <span className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus aria-hidden="true" size={18} />
            </span>
            <h2
              className="text-base font-semibold text-foreground"
              id="member-dialog-title"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              {member
                ? "Update this teammate’s workspace role and department. Account details are managed by the teammate."
                : "Their invitation will be recorded for this company workspace."}
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="inline-flex size-8 items-center justify-center rounded-control text-muted-foreground transition hover:bg-surface-muted"
            onClick={onCancel}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <DialogField htmlFor="member-name" label="Full name">
            <Input
              autoComplete="name"
              autoFocus
              disabled={member?.status === "Active"}
              id="member-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Morgan Taylor"
              required
              value={name}
            />
          </DialogField>
          <DialogField htmlFor="member-email" label="Work email">
            <Input
              autoComplete="email"
              disabled={member?.status === "Active"}
              id="member-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="morgan@company.com"
              required
              type="email"
              value={email}
            />
          </DialogField>
          <div className="grid gap-4 sm:grid-cols-2">
            <DialogField htmlFor="member-department" label="Department">
              <select
                className={memberSelectClass}
                id="member-department"
                onChange={(event) => setDepartment(event.target.value)}
                value={department}
              >
                {!departments.includes(department) && (
                  <option value={department}>{department}</option>
                )}
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </DialogField>
            <DialogField htmlFor="member-role" label="Role">
              <select
                className={memberSelectClass}
                id="member-role"
                onChange={(event) => setRole(event.target.value as MemberRole)}
                value={role}
              >
                {memberRoles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </DialogField>
          </div>
          {error && (
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
          )}
          <p className="rounded-control bg-surface-muted px-3 py-2.5 text-[0.675rem] leading-5 text-muted-foreground">
            {member
              ? "Company roles are enforced by database policies. Teammates manage their own account name and email."
              : "No email will be sent; this records a pending invitation for an administrator to onboard."}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
            <Button disabled={saving || !name.trim() || !email.trim()} type="submit">
              {member ? (
                <>
                  <Check aria-hidden="true" size={15} />
                  Save member
                </>
              ) : (
                <>
                  <MailPlus aria-hidden="true" size={15} />
                  Add pending invite
                </>
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

const memberSelectClass =
  "min-h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground shadow-sm transition hover:border-primary/35 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

function DialogField({
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
