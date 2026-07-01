import { z } from "zod";

export const assignmentTargetTypeSchema = z.enum([
  "USER",
  "DEPARTMENT",
  "TEAM",
  "ROLE",
  "ORGANIZATION",
]);

const assignmentTargetRefine = (
  data: { targetType: z.infer<typeof assignmentTargetTypeSchema>; targetId?: string | null },
  ctx: z.RefinementCtx
) => {
  if (data.targetType !== "ORGANIZATION" && !data.targetId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Audience selection is required",
      path: ["targetId"],
    });
  }
};

const assignmentPreviewBaseSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  courseLevelId: z.string().min(1, "Course level is required"),
  targetType: assignmentTargetTypeSchema,
  targetId: z.string().optional().nullable(),
});

export const assignmentPreviewSchema = assignmentPreviewBaseSchema.superRefine(
  assignmentTargetRefine
);

export const createAssignmentSchema = assignmentPreviewBaseSchema
  .extend({
    dueDate: z
      .string()
      .datetime({ offset: true })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    priority: z.string().max(50).optional(),
    notes: z.string().max(2000).optional(),
    reminderSchedule: z.string().max(200).optional(),
  })
  .superRefine(assignmentTargetRefine);

export const assignmentListQuerySchema = z.object({
  courseId: z.string().optional(),
  courseLevelId: z.string().optional(),
  departmentId: z.string().optional(),
  userId: z.string().optional(),
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"])
    .optional(),
  targetType: assignmentTargetTypeSchema.optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateAssignmentSchema = z.object({
  dueDate: z.string().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"]).optional(),
  notes: z.string().max(2000).optional(),
  priority: z.string().max(50).optional(),
});

export const adminCourseListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type AssignmentPreviewInput = z.infer<typeof assignmentPreviewSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type AssignmentListQuery = z.infer<typeof assignmentListQuerySchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type AdminCourseListQuery = z.infer<typeof adminCourseListQuerySchema>;
