"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: sessionError,
      } = await supabase.auth.getUser();
      if (sessionError) throw sessionError;
      if (!user) {
        throw new Error(
          "This reset link is invalid or expired. Request a new password reset email.",
        );
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setNotice("Your password has been updated. You can now sign in.");
      window.setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1200);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We could not update your password. Request a new reset email.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="auth-card w-full p-6 sm:p-8">
      <div className="mb-7">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Choose a new password
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use at least 8 characters to secure your account.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1.5 text-xs font-semibold text-foreground">
          New password
          <Input
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <label className="block space-y-1.5 text-xs font-semibold text-foreground">
          Confirm new password
          <Input
            autoComplete="new-password"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>
        {error && (
          <p className="rounded-control bg-danger-muted px-3 py-2.5 text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-control bg-success-muted px-3 py-2.5 text-xs text-foreground" role="status">
            {notice}
          </p>
        )}
        <Button className="w-full" disabled={saving} size="lg" type="submit">
          {saving ? (
            <>
              <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" size={17} />
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
      <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        <Link className="font-semibold text-primary" href="/login">
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}
