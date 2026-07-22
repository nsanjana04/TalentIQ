"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/constants/routes";

export default function ForgotPasswordPage() {
  const { forgotPassword, forgotPasswordState } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  }

  return (
    <AuthFormLayout
      title="Forgot password"
      description="We'll send you a link to reset your password"
    >
      {submitted ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            If an account exists for <strong>{email}</strong>, you will receive a reset link shortly.
            Check your console logs in development.
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link href={ROUTES.LOGIN}>Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={forgotPasswordState.isPending}>
            {forgotPasswordState.isPending ? "Sending..." : "Send reset link"}
          </Button>
          <p className="text-center text-sm">
            <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthFormLayout>
  );
}
