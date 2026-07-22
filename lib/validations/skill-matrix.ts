import { z } from "zod";

export const matrixQuerySchema = z.object({
  view: z.enum(["employee", "department", "team", "role", "heatmap"]).default("employee"),
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
  jobRoleId: z.string().optional(),
  categoryId: z.string().optional(),
  skillIds: z.string().optional(),
});

export const exportQuerySchema = matrixQuerySchema.extend({
  format: z.enum(["csv", "xlsx", "pdf"]),
});

export type MatrixQuery = z.infer<typeof matrixQuerySchema>;
