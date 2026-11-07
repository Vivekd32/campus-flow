"use client";

import {
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/supabase/redirect";

type AuthMode = "login" | "register" | "forgot-password";
type FieldName =
  | "fullName"
  | "email"
  | "company"
  | "workspace"
  | "password"
  | "confirmPassword"
  | "terms";
type FormErrors = Partial<Record<FieldName, string>>;

const content: Record<
  AuthMode,
  { title: string; description: string; button: string }
> = {
  login: {
    title: "Welcome back",
    description: "Sign in to pick up where your team left off.",
    button: "Sign in",
  },
  register: {
    title: "Create your workspace",
    description: "Bring your team and projects together with CampusFlow.",
    button: "Create account",
  },
  "forgot-password": {
    title: "Reset your password",
    description:
      "Enter your work email and we'll help you get back into your workspace.",
    button: "Send reset instructions",
  },
};

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const authErrorCode = useSyncExternalStore(
    subscribeToLocation,
    getAuthErrorCode,
    () => "",
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [requestError, setRequestError] = useState("");
  const [dismissAuthError, setDismissAuthError] = useState(false);
  const copy = content[mode];
  const authRouteError =
    mode === "login" && !dismissAuthError
      ? authErrorCode === "backend-unconfigured"
        ? "CampusFlow authentication is not configured. Add the Supabase URL and publishable key to .env.local."
        : authErrorCode === "auth-callback"
          ? "That verification or password reset link is invalid or expired. Request a new email and try again."
          : ""
      : "";
  const visibleRequestError = requestError || authRouteError;

  function clearFieldError(field: FieldName) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice("");
    setRequestError("");
    setDismissAuthError(true);
  }

  function validate(form: HTMLFormElement): FormErrors {
    const formData = new FormData(form);
    const nextErrors: FormErrors = {};
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      nextErrors.email = "Enter your work email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (mode === "register") {
      if (!String(formData.get("fullName") ?? "").trim()) {
        nextErrors.fullName = "Enter your full name.";
      }
      if (!String(formData.get("company") ?? "").trim()) {
        nextErrors.company = "Enter your company name.";
      }
      if (!String(formData.get("workspace") ?? "").trim()) {
        nextErrors.workspace = "Enter a workspace name.";
      }
    }

    if (mode !== "forgot-password") {
      const password = String(formData.get("password") ?? "");
      if (!password) {
        nextErrors.password = "Enter your password.";
      } else if (mode === "register" && password.length < 8) {
        nextErrors.password = "Use at least 8 characters.";
      }

      if (
        mode === "register" &&
        password !== String(formData.get("confirmPassword") ?? "")
      ) {
        nextErrors.confirmPassword = "Your passwords don't match.";
      }
    }

    if (mode === "register" && !formData.has("terms")) {
      nextErrors.terms = "Agree to the terms to create an account.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setRequestError("");
    setDismissAuthError(true);
    const form = event.currentTarget;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: String(formData.get("password") ?? ""),
        });
        if (error) throw error;
        const nextPath = new URLSearchParams(window.location.search).get("next");
        router.replace(getSafeRedirectPath(nextPath, window.location.origin));
        router.refresh();
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: String(formData.get("password") ?? ""),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: String(formData.get("fullName") ?? "").trim(),
              company_name: String(formData.get("company") ?? "").trim(),
              workspace_name: String(formData.get("workspace") ?? "").trim(),
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
        } else {
          setNotice(
            "If an account can be created with this address, check your email to confirm it. If you already have an account, sign in or reset your password.",
          );
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        setNotice(
          "If an account exists for this email, password reset instructions will arrive shortly.",
        );
      }
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="auth-card w-full p-6 sm:p-8">
      <div className="mb-7">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {copy.description}
        </p>
      </div>

      <form
        aria-busy={isSubmitting}
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit}
      >
        {mode === "register" && (
          <>
            <FormField error={errors.fullName} htmlFor="full-name" label="Full name">
              <Input
                aria-describedby={errors.fullName ? "full-name-error" : undefined}
                aria-invalid={Boolean(errors.fullName)}
                autoComplete="name"
                id="full-name"
                name="fullName"
                onChange={() => clearFieldError("fullName")}
                placeholder="Jordan Lee"
                required
              />
            </FormField>
            <FormField error={errors.company} htmlFor="company" label="Company name">
              <Input
                aria-describedby={errors.company ? "company-error" : undefined}
                aria-invalid={Boolean(errors.company)}
                autoComplete="organization"
                id="company"
                name="company"
                onChange={() => clearFieldError("company")}
                placeholder="Acme Studio"
                required
              />
            </FormField>
            <FormField
              error={errors.workspace}
              htmlFor="workspace"
              label="Workspace name"
            >
              <Input
                aria-describedby={errors.workspace ? "workspace-error" : undefined}
                aria-invalid={Boolean(errors.workspace)}
                autoComplete="off"
                id="workspace"
                name="workspace"
                onChange={() => clearFieldError("workspace")}
                placeholder="Acme team"
                required
              />
            </FormField>
          </>
        )}

        <FormField error={errors.email} htmlFor="work-email" label="Work email">
          <Input
            aria-describedby={errors.email ? "work-email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            id="work-email"
            name="email"
            onChange={() => clearFieldError("email")}
            placeholder="you@company.com"
            required
            type="email"
          />
        </FormField>

        {mode !== "forgot-password" && (
          <>
            <FormField
              error={errors.password}
              htmlFor="password"
              label="Password"
              trailing={
                mode === "login" ? (
                  <Link
                    className="text-xs font-semibold text-primary transition hover:text-primary-hover"
                    href="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                ) : undefined
              }
            >
              <PasswordInput
                error={errors.password}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                id="password"
                name="password"
                onChange={() => clearFieldError("password")}
                placeholder="Enter your password"
                required
              />
            </FormField>

            {mode === "register" && (
              <FormField
                error={errors.confirmPassword}
                htmlFor="confirm-password"
                label="Confirm password"
              >
                <PasswordInput
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                  id="confirm-password"
                  name="confirmPassword"
                  onChange={() => clearFieldError("confirmPassword")}
                  placeholder="Re-enter your password"
                  required
                />
              </FormField>
            )}
          </>
        )}

        {mode === "login" && (
          <label className="flex w-fit cursor-pointer items-center gap-2.5 pt-0.5 text-sm text-muted-foreground">
            <input
              className="size-4 rounded border-border accent-primary focus-visible:ring-2 focus-visible:ring-primary"
              name="remember"
              type="checkbox"
            />
            Remember me
          </label>
        )}

        {mode === "register" && (
          <div className="pt-1">
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-muted-foreground">
              <input
                aria-describedby={errors.terms ? "terms-error" : undefined}
                aria-invalid={Boolean(errors.terms)}
                className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary focus-visible:ring-2 focus-visible:ring-primary"
                name="terms"
                onChange={() => clearFieldError("terms")}
                type="checkbox"
              />
              <span>
                I agree to CampusFlow&apos;s Terms of Service and Privacy Policy.
              </span>
            </label>
            {errors.terms && (
              <p className="mt-1.5 text-xs text-danger" id="terms-error">
                {errors.terms}
              </p>
            )}
          </div>
        )}

        <div className="pt-1">
          <Button
            className="w-full"
            disabled={isSubmitting}
            size="lg"
            type="submit"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  className="motion-safe:animate-spin"
                  size={17}
                />
                {mode === "forgot-password" ? "Preparing..." : "Checking..."}
              </>
            ) : (
              copy.button
            )}
          </Button>
        </div>
      </form>

      {notice && (
        <p
          aria-live="polite"
          className="mt-4 rounded-control border border-warning/20 bg-warning-muted px-3.5 py-3 text-xs leading-5 text-foreground"
          role="status"
        >
          {notice}
        </p>
      )}
      {visibleRequestError && (
        <p
          aria-live="assertive"
          className="mt-4 rounded-control border border-danger/20 bg-danger-muted px-3.5 py-3 text-xs leading-5 text-danger"
          role="alert"
        >
          {visibleRequestError}
        </p>
      )}

      <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New to CampusFlow?{" "}
            <Link
              className="font-semibold text-primary transition hover:text-primary-hover"
              href="/register"
            >
              Create an account
            </Link>
          </>
        ) : mode === "register" ? (
          <>
            Already have an account?{" "}
            <Link
              className="font-semibold text-primary transition hover:text-primary-hover"
              href="/login"
            >
              Sign in
            </Link>
          </>
        ) : (
          <Link
            className="font-semibold text-primary transition hover:text-primary-hover"
            href="/login"
          >
            Back to sign in
          </Link>
        )}
      </div>
    </Card>
  );
}

function subscribeToLocation(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

function getAuthErrorCode() {
  return new URLSearchParams(window.location.search).get("error") ?? "";
}

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "We could not complete your request. Please try again.";
  }
  if (error.message.includes("Supabase is not configured")) {
    return "Authentication is not configured yet. Add the Supabase URL and publishable key to .env.local.";
  }
  if (error.message.toLowerCase().includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }
  if (error.message.toLowerCase().includes("email not confirmed")) {
    return "Confirm your email address before signing in.";
  }
  return error.message;
}

function FormField({
  children,
  error,
  htmlFor,
  label,
  trailing,
}: {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
  trailing?: ReactNode;
}) {
  const errorId = `${htmlFor}-error`;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label
          className="text-xs font-semibold text-foreground"
          htmlFor={htmlFor}
        >
          {label}
        </label>
        {trailing}
      </div>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-danger" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

type PasswordInputProps = {
  autoComplete: string;
  error?: string;
  id: string;
  name: string;
  onChange: () => void;
  placeholder: string;
  required: boolean;
};

function PasswordInput({
  autoComplete,
  error,
  id,
  name,
  onChange,
  placeholder,
  required,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="pr-11"
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={visible ? "text" : "password"}
      />
      <button
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-control text-muted-foreground transition hover:text-foreground focus-visible:text-foreground"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible ? (
          <EyeOff aria-hidden="true" size={17} />
        ) : (
          <Eye aria-hidden="true" size={17} />
        )}
      </button>
    </div>
  );
}
