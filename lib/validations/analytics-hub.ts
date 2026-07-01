import { z } from "zod";

export const analyticsFilterSchema = z.object({
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
});

export const skillGapsQuerySchema = analyticsFilterSchema.extend({
  view: z.enum(["employee", "department", "team", "role"]).optional().default("employee"),
});

export type AnalyticsFilterQuery = z.infer<typeof analyticsFilterSchema>;
export type SkillGapsQuery = z.infer<typeof skillGapsQuerySchema>;
