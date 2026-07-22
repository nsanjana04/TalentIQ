import { z } from "zod";

const resourceType = z.enum([
  "LINK",
  "YOUTUBE",
  "PDF",
  "DOCUMENT",
  "VIDEO",
  "MICROSOFT_LEARN",
  "UDEMY",
  "COURSERA",
  "OTHER",
]);

const openCourseCategory = z.enum(["PRODUCT", "HR_POLICIES", "SECURITY", "GENERAL"]);

function emptyQueryValue(value: unknown) {
  if (value === "" || value === "undefined" || value === null) return undefined;
  return value;
}

export const learningResourceListQuerySchema = z.object({
  search: z.preprocess(emptyQueryValue, z.string().optional()),
  type: z.preprocess(emptyQueryValue, resourceType.optional()),
  published: z.preprocess(
    emptyQueryValue,
    z.enum(["true", "false", "all"]).optional().default("all")
  ),
});

export const createLearningResourceSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  type: resourceType.default("LINK"),
  url: z.string().min(5).max(2000),
  isPublished: z.boolean().optional().default(true),
  tags: z.array(z.string().max(50)).optional().default([]),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

export const updateLearningResourceSchema = createLearningResourceSchema.partial();

export const openCourseListQuerySchema = z.object({
  search: z.preprocess(emptyQueryValue, z.string().optional()),
  category: z.preprocess(emptyQueryValue, openCourseCategory.optional()),
  mandatory: z.preprocess(
    emptyQueryValue,
    z.enum(["true", "false", "all"]).optional().default("all")
  ),
  published: z.preprocess(
    emptyQueryValue,
    z.enum(["true", "false", "all"]).optional().default("all")
  ),
});

export const createOpenCourseSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  category: openCourseCategory.default("GENERAL"),
  type: resourceType.default("YOUTUBE"),
  url: z.string().min(5).max(2000),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(0).optional(),
  isMandatory: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

export const updateOpenCourseSchema = createOpenCourseSchema.partial();

export const assignOpenCourseSchema = z
  .object({
    userIds: z.array(z.string().min(1)).optional(),
    assignAll: z.boolean().optional().default(false),
  })
  .refine((data) => data.assignAll || (data.userIds?.length ?? 0) > 0, {
    message: "Select employees or choose assign all in your scope",
  });

export const assignLearningResourceSchema = assignOpenCourseSchema;

export type LearningResourceListQuery = z.infer<typeof learningResourceListQuerySchema>;
export type CreateLearningResourceInput = z.infer<typeof createLearningResourceSchema>;
export type UpdateLearningResourceInput = z.infer<typeof updateLearningResourceSchema>;
export type OpenCourseListQuery = z.infer<typeof openCourseListQuerySchema>;
export type CreateOpenCourseInput = z.infer<typeof createOpenCourseSchema>;
export type UpdateOpenCourseInput = z.infer<typeof updateOpenCourseSchema>;
export type AssignOpenCourseInput = z.infer<typeof assignOpenCourseSchema>;
export type AssignLearningResourceInput = z.infer<typeof assignLearningResourceSchema>;
