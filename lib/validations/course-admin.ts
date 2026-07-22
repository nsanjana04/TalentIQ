import { z } from "zod";

const lessonType = z.enum(["VIDEO", "PDF", "QUIZ", "ASSIGNMENT"]);

export const courseListQuerySchema = z.object({
  search: z.string().optional(),
  published: z.enum(["true", "false", "all"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createCourseSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  instructorId: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(0).optional(),
  isPublished: z.boolean().optional().default(false),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createModuleSchema = z.object({
  title: z.string().min(2).max(200),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export const createLessonSchema = z.object({
  title: z.string().min(2).max(200),
  type: lessonType.default("VIDEO"),
  content: z.string().max(10000).optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  pdfUrl: z.string().url().optional().or(z.literal("")),
  assessmentId: z.string().optional(),
  assignmentBrief: z.string().max(5000).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  durationMinutes: z.coerce.number().int().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export type CourseListQuery = z.infer<typeof courseListQuerySchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

export const generateCourseAssessmentQuestionsSchema = z.object({
  assessmentId: z.string().optional(),
  force: z.boolean().optional().default(false),
  questionCount: z.coerce.number().int().min(3).max(15).optional().default(8),
});

export type GenerateCourseAssessmentQuestionsInput = z.infer<
  typeof generateCourseAssessmentQuestionsSchema
>;

export const generateModuleAssessmentQuestionsSchema = z.object({
  force: z.boolean().optional().default(false),
  questionCount: z.coerce.number().int().min(3).max(15).optional().default(6),
});

export const generateAllModuleAssessmentsSchema = z.object({
  force: z.boolean().optional().default(false),
  questionCount: z.coerce.number().int().min(3).max(15).optional().default(6),
  setupMissing: z.boolean().optional().default(true),
});

export type GenerateModuleAssessmentQuestionsInput = z.infer<
  typeof generateModuleAssessmentQuestionsSchema
>;
export type GenerateAllModuleAssessmentsInput = z.infer<
  typeof generateAllModuleAssessmentsSchema
>;
