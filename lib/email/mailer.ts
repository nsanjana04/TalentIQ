export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.SMTP_HOST) {
    // Production: integrate with SES, SendGrid, Resend, etc.
    console.info("[Email] Production send queued:", payload.to, payload.subject);
    return;
  }

  console.info("\n────────── EMAIL ──────────");
  console.info(`To:      ${payload.to}`);
  console.info(`Subject: ${payload.subject}`);
  console.info(payload.text ?? payload.html.replace(/<[^>]+>/g, ""));
  console.info("──────────────────────────\n");
}
