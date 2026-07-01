import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(40).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().nullable().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createTeamSchema = z.object({
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(40).optional(),
  description: z.string().max(500).optional(),
  departmentId: z.string().min(1),
  leaderId: z.string().nullable().optional(),
});

export const updateTeamSchema = createTeamSchema.partial().omit({ departmentId: true });

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
