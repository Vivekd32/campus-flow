"use client";

import { Check, Info, LockKeyhole, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  memberRoles,
  type MemberRole,
} from "@/lib/workspace-demo-data";

const roleDescriptions: Record<MemberRole, string> = {
  Owner: "Full control of the workspace, including ownership-level settings.",
  Admin: "Manage workspace configuration, members, and company-wide work.",
  "Project Manager":
    "Create and organize projects, coordinate tasks, and review reports.",
  Member: "Collaborate on assigned projects, tasks, and shared documents.",
  Guest: "Limited collaboration on explicitly shared project work.",
};

const permissionRows = [
  {
    label: "Workspace settings",
    description: "Company profile, workspace details, and preferences",
    access: {
      Owner: true,
      Admin: true,
      "Project Manager": false,
      Member: false,
      Guest: false,
    },
  },
  {
    label: "Member management",
    description: "Invite, edit, and remove team members",
    access: {
      Owner: true,
      Admin: true,
      "Project Manager": false,
      Member: false,
      Guest: false,
    },
  },
  {
    label: "Project creation",
    description: "Start new projects in the workspace",
    access: {
      Owner: true,
      Admin: true,
      "Project Manager": true,
      Member: true,
      Guest: false,
    },
  },
  {
    label: "Project editing",
    description: "Edit project details, status, and team access",
    access: {
      Owner: true,
      Admin: true,
      "Project Manager": true,
      Member: false,
      Guest: false,
    },
  },
  {
    label: "Task management",
    description: "Create, assign, and update tasks",
    access: {
      Owner: true,
      Admin: true,
      "Project Manager": true,
      Member: true,
      Guest: false,
    },
  },
  {
    label: "Reports",
    description: "View workspace analytics and project reports",
    access: {
      Owner: true,
      Admin: true,
      "Project Manager": true,
      Member: false,
      Guest: false,
    },
  },
  {
    label: "Documents",
    description: "View and collaborate on shared project documents",
    access: {
      Owner: true,
      Admin: true,
      "Project Manager": true,
      Member: true,
      Guest: true,
    },
  },
] satisfies {
  label: string;
  description: string;
  access: Record<MemberRole, boolean>;
}[];

export function RolesPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<MemberRole>("Owner");

  return (
    <div className="space-y-6">
      <header>
        <Badge className="mb-3" variant="secondary">
          <LockKeyhole aria-hidden="true" size={13} />
          Access overview
        </Badge>
        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.8rem]">
          Roles & permissions
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
          Understand how each role is intended to collaborate across a
          professional workspace.
        </p>
      </header>

      <Card className="flex items-start gap-3 border-primary/15 bg-primary/[0.035] p-4">
        <Info
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-primary"
          size={17}
        />
        <p className="text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-foreground">Demonstration only.</span>{" "}
          These permission descriptions are informational and do not provide
          access control or security enforcement. Real role enforcement requires
          a future authenticated backend.
        </p>
      </Card>

      <section aria-labelledby="role-guide-heading">
        <div className="mb-4">
          <h2
            className="text-base font-semibold text-foreground"
            id="role-guide-heading"
          >
            Role guide
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A quick overview of how each role fits into your team.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {memberRoles.map((role, index) => (
            <button
              aria-pressed={selectedRole === role}
              className={`rounded-card border bg-surface p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-popover ${
                selectedRole === role
                  ? "border-primary/40 ring-2 ring-primary/10"
                  : "border-border"
              }`}
              key={role}
              onClick={() => setSelectedRole(role)}
              type="button"
            >
              <span className="flex items-center justify-between gap-2">
                <Badge variant={index <= 1 ? "primary" : "secondary"}>
                  {role}
                </Badge>
                {selectedRole === role && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </span>
              <span className="mt-3 block text-xs leading-5 text-muted-foreground">
                {roleDescriptions[role]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="permissions-heading">
        <div className="mb-4">
          <h2
            className="text-base font-semibold text-foreground"
            id="permissions-heading"
          >
            Permissions matrix
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Reference capabilities by role. Select a role above to highlight its
            column.
          </p>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[49rem] border-collapse text-center">
              <thead>
                <tr className="border-b border-border bg-surface-muted/45">
                  <th className="min-w-[15rem] px-4 py-3 text-left text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground sm:px-5">
                    Capability
                  </th>
                  {memberRoles.map((role) => (
                    <th
                      className={`min-w-[6.25rem] px-2 py-3 text-[0.675rem] font-semibold text-foreground ${
                        selectedRole === role ? "bg-primary/[0.045]" : ""
                      }`}
                      key={role}
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionRows.map((row) => (
                  <tr
                    className="border-b border-border/70 last:border-0"
                    key={row.label}
                  >
                    <td className="px-4 py-3.5 text-left sm:px-5">
                      <p className="text-xs font-semibold text-foreground">
                        {row.label}
                      </p>
                      <p className="mt-1 text-[0.65rem] leading-4 text-muted-foreground">
                        {row.description}
                      </p>
                    </td>
                    {memberRoles.map((role) => (
                      <td
                        className={`px-2 py-3.5 ${
                          selectedRole === role ? "bg-primary/[0.045]" : ""
                        }`}
                        key={role}
                      >
                        {row.access[role] ? (
                          <span className="mx-auto inline-flex size-6 items-center justify-center rounded-full bg-success-muted text-success">
                            <Check
                              aria-label={`${role} has access to ${row.label}`}
                              size={14}
                            />
                          </span>
                        ) : (
                          <span className="mx-auto inline-flex size-6 items-center justify-center rounded-full bg-surface-muted text-muted-foreground/60">
                            <X
                              aria-label={`${role} does not have access to ${row.label}`}
                              size={13}
                            />
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-surface-muted/30 px-4 py-3 text-[0.675rem] text-muted-foreground sm:px-5">
            <span className="inline-flex items-center gap-1.5">
              <Check aria-hidden="true" className="text-success" size={14} />
              Intended access
            </span>
            <span className="inline-flex items-center gap-1.5">
              <X aria-hidden="true" size={13} />
              Not included
            </span>
            <span className="ml-auto">Selected role: {selectedRole}</span>
          </div>
        </Card>
      </section>
    </div>
  );
}
