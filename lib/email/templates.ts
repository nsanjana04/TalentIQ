const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "TalentIQ";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function passwordResetEmail(to: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
  return {
    subject: `${APP_NAME} — Reset your password`,
    text: `Reset your password: ${link}\n\nThis link expires in 1 hour.`,
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your ${APP_NAME} password:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  };
}

export function emailVerificationEmail(to: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;
  return {
    subject: `${APP_NAME} — Verify your email`,
    text: `Verify your email: ${link}\n\nThis link expires in 24 hours.`,
    html: `
      <h2>Verify your email</h2>
      <p>Welcome to ${APP_NAME}! Click below to verify your email address:</p>
      <p><a href="${link}">${link}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  };
}

export function passwordChangedEmail() {
  return {
    subject: `${APP_NAME} — Password changed`,
    text: `Your ${APP_NAME} password was changed. If this wasn't you, contact support immediately.`,
    html: `
      <h2>Password changed</h2>
      <p>Your ${APP_NAME} password was successfully changed.</p>
      <p>If you didn't make this change, contact your administrator immediately.</p>
    `,
  };
}
