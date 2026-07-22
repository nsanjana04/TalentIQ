import { z } from "zod";

export const settingsCategorySchema = z.enum([
  "general",
  "security",
  "email",
  "notifications",
  "integrations",
  "appearance",
  "system",
  "audit",
]);

export const updateSettingsSchema = z.object({
  settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});

export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  digestFrequency: z.enum(["daily", "weekly", "never"]).optional(),
  skills: z.boolean().optional(),
  courses: z.boolean().optional(),
  assessments: z.boolean().optional(),
  certificates: z.boolean().optional(),
});

export const auditLogsQuerySchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  actorId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type SettingsCategoryParam = z.infer<typeof settingsCategorySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;
