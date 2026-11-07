import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Reset password | CampusFlow",
  description: "Get help accessing your CampusFlow workspace.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthForm mode="forgot-password" />
    </AuthLayout>
  );
}
