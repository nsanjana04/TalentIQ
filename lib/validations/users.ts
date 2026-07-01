import { z } from "zod";

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  roleId: z.string().optional(),
  departmentId: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
}).transform((data) => ({
  ...data,
  pageSize: data.limit ?? data.pageSize,
}));

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  roleId: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  roleId: z.string().min(1),
  departmentId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
