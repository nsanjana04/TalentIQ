import { z } from "zod";

/** Zod schema for OpenAI Structured Outputs — assessment question batches. */
export const generatedAssessmentQuestionSchema = z.object({
  question: z.string(),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "CODE", "ESSAY"]),
  options: z.array(z.string()).max(6).optional(),
  correctAnswer: z.string(),
  codeTemplate: z.string().optional(),
  points: z.number().min(1).max(5).optional(),
});

export const generatedAssessmentBatchSchema = z.object({
  questions: z.array(generatedAssessmentQuestionSchema),
});

export type GeneratedAssessmentQuestion = z.infer<typeof generatedAssessmentQuestionSchema>;
