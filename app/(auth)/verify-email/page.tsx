"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/constants/routes";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") ?? "";
  const { verifyEmail, resendVerification, resendVerificationState } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token && emailParam) {
      setStatus("verifying");
      verifyEmail({ email: emailParam, token })
        .then((res) => {
          setStatus("success");
          setMessage(res.message);
        })
        .catch((err) => {
          setStatus("error");
          setMessage(err instanceof Error ? err.message : "Verification failed");
        });
    }
  }, [token, emailParam, verifyEmail]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await resendVerification(email);
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to resend");
    }
  }

  if (status === "verifying") {
    return (
      <AuthFormLayout title="Verifying email" description="Please wait...">
        <p className="text-center text-muted-foreground">Verifying your email address...</p>
      </AuthFormLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthFormLayout title="Email verified" description="Your email has been confirmed">
        <div className="space-y-4 text-center">
          <p className="text-sm text-green-700">{message}</p>
          <Button asChild className="w-full">
            <Link href={ROUTES.LOGIN}>Sign in</Link>
          </Button>
        </div>
      </AuthFormLayout>
    );
  }

  return (
    <AuthFormLayout
      title="Verify email"
      description={token ? "Verification failed" : "Resend verification email"}
    >
      {status === "error" && message && (
        <p className="mb-4 text-sm text-destructive">{message}</p>
      )}
      <form onSubmit={handleResend} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {message && status !== "error" && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
        <Button type="submit" className="w-full" disabled={resendVerificationState.isPending}>
          {resendVerificationState.isPending ? "Sending..." : "Resend verification email"}
        </Button>
        <p className="text-center text-sm">
          <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthFormLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground">Loading...</p>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
