import { z } from "zod";

const xapiVerbSchema = z.enum([
  "STARTED",
  "PAUSED",
  "RESUMED",
  "COMPLETED",
  "PASSED",
  "FAILED",
  "VIEWED",
  "DOWNLOADED",
  "CERTIFIED",
]);

export const recordLearningEventSchema = z.object({
  verb: xapiVerbSchema,
  objectId: z.string().min(1),
  objectName: z.string().min(1),
  objectType: z.string().optional(),
  courseId: z.string().optional(),
  moduleId: z.string().optional(),
  lessonId: z.string().optional(),
  assessmentId: z.string().optional(),
  certificateId: z.string().optional(),
  durationMs: z.number().int().min(0).optional(),
  result: z
    .object({
      score: z
        .object({
          scaled: z.number().optional(),
          raw: z.number().optional(),
          min: z.number().optional(),
          max: z.number().optional(),
        })
        .optional(),
      success: z.boolean().optional(),
      completion: z.boolean().optional(),
    })
    .optional(),
});

export const externalSyncSchema = z.object({
  provider: z.enum([
    "LINKEDIN_LEARNING",
    "COURSERA",
    "UDEMY_BUSINESS",
    "PLURALSIGHT",
    "SKILLSOFT",
  ]),
  accessToken: z.string().optional(),
});

export const xapiImportSchema = z.object({
  statement: z.object({
    actor: z.record(z.unknown()),
    verb: z.object({ id: z.string(), display: z.record(z.string()).optional() }),
    object: z.object({
      id: z.string(),
      definition: z.record(z.unknown()).optional(),
    }),
    result: z.record(z.unknown()).optional(),
    context: z.record(z.unknown()).optional(),
    timestamp: z.string().optional(),
  }),
});

export type RecordLearningEventBody = z.infer<typeof recordLearningEventSchema>;
