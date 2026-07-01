"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useSessions } from "@/hooks/use-sessions";

export function SecurityPanel() {
  const { user, changePassword, changePasswordState, resendVerification } = useAuth();
  const { sessions, isLoading, revokeSession, revokeAllSessions, isRevoking, isRevokingAll } =
    useSessions();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const res = await changePassword({ currentPassword, newPassword, confirmPassword });
      setMessage(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    }
  }

  return (
    <div className="space-y-6">
      {!user?.emailVerified && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-base">Email not verified</CardTitle>
            <CardDescription>Verify your email to unlock all platform features.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => user && resendVerification(user.email)}>
              Resend verification email
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current password</label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm new password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {message && <p className="text-sm text-emerald-600">{message}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={changePasswordState.isPending}>
              {changePasswordState.isPending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Devices currently signed in to your account</CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled={isRevokingAll || sessions.length <= 1} onClick={() => revokeAllSessions()}>
            {isRevokingAll ? "Revoking…" : "Sign out all others"}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {session.userAgent?.slice(0, 60) ?? "Unknown device"}
                      {session.isCurrent && <span className="ml-2 text-xs text-primary">(current)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.ipAddress ?? "Unknown IP"} · Expires {new Date(session.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!session.isCurrent && (
                    <Button variant="ghost" size="sm" disabled={isRevoking} onClick={() => revokeSession(session.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
