import { z } from "zod";

const questionType = z.enum([
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "CODE",
  "ESSAY",
]);

export const assessmentListQuerySchema = z.object({
  search: z.string().optional(),
  published: z.enum(["true", "false", "all"]).optional().default("all"),
});

export const createAssessmentSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  courseId: z.string().optional(),
  type: z
    .enum(["QUIZ", "PRACTICAL", "CERTIFICATION", "SKILL_CHECK"])
    .optional()
    .default("QUIZ"),
  passingScore: z.coerce.number().int().min(0).max(100).optional().default(70),
  timeLimitMinutes: z.coerce.number().int().min(1).optional(),
  maxRetakes: z.coerce.number().int().min(0).max(20).optional().default(3),
  allowRetakes: z.boolean().optional().default(true),
  shuffleQuestions: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

export const createBankQuestionSchema = z.object({
  title: z.string().max(200).optional(),
  question: z.string().min(2).max(5000),
  type: questionType,
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  codeTemplate: z.string().optional(),
  points: z.coerce.number().int().min(1).max(100).optional().default(1),
  tags: z.array(z.string()).optional(),
});

export const updateBankQuestionSchema = createBankQuestionSchema.partial();

export const createAssessmentQuestionSchema = createBankQuestionSchema.extend({
  bankItemId: z.string().optional(),
});

export const updateAssessmentQuestionSchema = createAssessmentQuestionSchema.partial();

export const importBankSchema = z.object({
  bankItemIds: z.array(z.string()).min(1),
});

export const saveAnswersSchema = z.object({
  answers: z.record(z.string()),
});

export const gradeAttemptSchema = z.object({
  score: z.coerce.number().int().min(0),
  feedback: z.string().max(2000).optional(),
  questionScores: z.record(z.coerce.number().int().min(0)).optional(),
});

export type AssessmentListQuery = z.infer<typeof assessmentListQuerySchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type CreateBankQuestionInput = z.infer<typeof createBankQuestionSchema>;
export type CreateAssessmentQuestionInput = z.infer<typeof createAssessmentQuestionSchema>;
