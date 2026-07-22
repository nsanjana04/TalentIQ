import { sendEmail } from "@/lib/email/mailer";
import {
  emailVerificationEmail,
  passwordChangedEmail,
  passwordResetEmail,
} from "@/lib/email/templates";

export const emailService = {
  async sendPasswordReset(email: string, token: string) {
    const template = passwordResetEmail(email, token);
    await sendEmail({ to: email, ...template });
  },

  async sendEmailVerification(email: string, token: string) {
    const template = emailVerificationEmail(email, token);
    await sendEmail({ to: email, ...template });
  },

  async sendPasswordChanged(email: string) {
    const template = passwordChangedEmail();
    await sendEmail({ to: email, ...template });
  },
};
