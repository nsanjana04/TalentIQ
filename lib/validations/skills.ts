import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().min(1),
});

export const updateSkillSchema = createSkillSchema.partial();

export const createLevelSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  rank: z.number().int().min(1).max(10),
  description: z.string().max(500).optional(),
});

export const updateLevelSchema = createLevelSchema.partial();

export const createRelationSchema = z.object({
  skillId: z.string().min(1),
  relatedSkillId: z.string().min(1),
  relationType: z.enum(["PREREQUISITE", "RELATED", "COMPLEMENTARY"]).default("RELATED"),
});

export const createRoleMappingSchema = z.object({
  jobRoleId: z.string().min(1),
  experienceLevelId: z.string().min(1),
  skillId: z.string().min(1),
  requiredSkillLevelId: z.string().min(1),
  isMandatory: z.boolean().default(true),
});

export const createCourseMappingSchema = z.object({
  skillId: z.string().min(1),
  courseId: z.string().min(1),
  coveragePercent: z.number().int().min(1).max(100).default(100),
});

export const createAssessmentMappingSchema = z.object({
  skillId: z.string().min(1),
  assessmentId: z.string().min(1),
});

export const createCertificateMappingSchema = z.object({
  skillId: z.string().min(1),
  certificateTemplateId: z.string().min(1),
});

export const upsertValidityRuleSchema = z.object({
  skillId: z.string().min(1),
  validityDays: z.number().int().min(30).max(3650).default(365),
  gracePeriodDays: z.number().int().min(0).max(365).default(30),
  requiresRecertification: z.boolean().default(true),
  reassessmentDaysBeforeExpiry: z.number().int().min(7).max(365).default(60),
});

export const createWeightageRuleSchema = z.object({
  skillId: z.string().min(1),
  jobRoleId: z.string().nullable().optional(),
  experienceLevelId: z.string().nullable().optional(),
  weight: z.number().int().min(1).max(100).default(10),
  isMandatory: z.boolean().default(false),
});

export const updateWeightageRuleSchema = createWeightageRuleSchema.partial().omit({ skillId: true });
