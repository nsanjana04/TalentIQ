import { z } from "zod";

export const learningRoadmapQuerySchema = z.object({
  skillId: z.string().optional(),
  userId: z.string().optional(),
});

export const enrollCourseSchema = z.object({
  courseId: z.string().min(1),
});

export const completeExternalCourseSchema = z.object({
  courseId: z.string().min(1),
});

export const generateCourseQuizSchema = z.object({
  courseId: z.string().min(1),
});

export type LearningRoadmapQuery = z.infer<typeof learningRoadmapQuerySchema>;
