"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Check, LoaderCircle, Mail } from "lucide-react";
import { Brand } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkspaceDemo } from "@/hooks/use-workspace-demo";
import {
  acceptWorkspaceInvitation,
  listMyPendingWorkspaceInvitations,
  type PendingWorkspaceInvitation,
} from "@/lib/workspace-demo-store";

type InvitationSnapshot = {
  userId: string;
  invitations: PendingWorkspaceInvitation[];
  error: string;
};

export function WorkspaceInvitationsPage() {
  const router = useRouter();
  const { currentUser, isHydrated } = useWorkspaceDemo();
  const [snapshot, setSnapshot] = useState<InvitationSnapshot | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const userId = currentUser?.id ?? "";
  const currentSnapshot = snapshot?.userId === userId ? snapshot : null;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void listMyPendingWorkspaceInvitations()
      .then((invitations) => {
        if (active) setSnapshot({ userId, invitations, error: "" });
      })
      .catch((error: unknown) => {
        if (active) {
          setSnapshot({
            userId,
            invitations: [],
            error:
              error instanceof Error
                ? error.message
                : "Pending invitations could not be loaded.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);

  async function acceptInvitation(invitationId: string) {
    setAcceptingId(invitationId);
    setActionError("");
    try {
      const invitation = snapshot?.invitations.find(
        (item) => item.id === invitationId,
      );
      if (!invitation) {
        throw new Error("This invitation is no longer available.");
      }
      await acceptWorkspaceInvitation(invitationId, invitation.workspace_id);
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "The invitation could not be accepted.",
      );
    } finally {
      setAcceptingId(null);
    }
  }

  if (!isHydrated || !currentUser || !currentSnapshot) {
    return (
      <main
        className="min-h-screen bg-background p-4 text-foreground sm:p-8"
        role="status"
      >
        <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
          Loading workspace invitations…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-14 pt-6 text-foreground sm:px-6 sm:pt-9">
      <div className="mx-auto max-w-3xl">
        <header className="mb-9 flex items-center justify-between gap-4">
          <Brand />
          <Link
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            href="/dashboard"
          >
            <ArrowLeft aria-hidden="true" size={14} />
            Back to dashboard
          </Link>
        </header>

        <div className="mb-6">
          <Badge className="mb-3" variant="primary">
            <Mail aria-hidden="true" size={13} />
            Team access
          </Badge>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            Workspace invitations
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Review invitations addressed to {currentUser.email || "your account"}.
          </p>
        </div>

        {actionError && (
          <p
            className="mb-4 rounded-control border border-danger/25 bg-danger-muted px-3.5 py-3 text-xs leading-5 text-foreground"
            role="alert"
          >
            {actionError}
          </p>
        )}

        {currentSnapshot.error ? (
          <Card className="p-5 text-sm text-danger" role="alert">
            {currentSnapshot.error}
          </Card>
        ) : currentSnapshot.invitations.length ? (
          <div className="space-y-3">
            {currentSnapshot.invitations.map((invitation) => (
              <Card
                className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                key={invitation.id}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 aria-hidden="true" size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {invitation.workspace_name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {invitation.company_name} · Invited as{" "}
                      {invitation.role.replaceAll("_", " ")}
                    </p>
                    <time
                      className="mt-2 block text-[0.675rem] text-muted-foreground"
                      dateTime={invitation.created_at}
                    >
                      Sent {new Date(invitation.created_at).toLocaleDateString()}
                    </time>
                  </div>
                </div>
                <Button
                  className="shrink-0"
                  disabled={acceptingId !== null}
                  onClick={() => void acceptInvitation(invitation.id)}
                  size="sm"
                >
                  {acceptingId === invitation.id ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" size={14} />
                  ) : (
                    <Check aria-hidden="true" size={14} />
                  )}
                  Accept invitation
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="px-5 py-14 text-center">
            <Mail
              aria-hidden="true"
              className="mx-auto text-muted-foreground"
              size={24}
            />
            <h2 className="mt-3 text-sm font-semibold">No pending invitations</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Invitations sent to this email address will appear here.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
