import { AppError } from "@/lib/errors/app-error";
import type {
  createAssessmentMappingSchema,
  createCategorySchema,
  createCertificateMappingSchema,
  createCourseMappingSchema,
  createLevelSchema,
  createRelationSchema,
  createRoleMappingSchema,
  createSkillSchema,
  createWeightageRuleSchema,
  updateCategorySchema,
  updateLevelSchema,
  updateSkillSchema,
  updateWeightageRuleSchema,
  upsertValidityRuleSchema,
} from "@/lib/validations/skills";
import { skillAdminRepository } from "@/repositories/skill-admin.repository";
import { auditService } from "@/services/audit.service";
import type { z } from "zod";

type CreateCategory = z.infer<typeof createCategorySchema>;
type UpdateCategory = z.infer<typeof updateCategorySchema>;
type CreateSkill = z.infer<typeof createSkillSchema>;
type UpdateSkill = z.infer<typeof updateSkillSchema>;
type CreateLevel = z.infer<typeof createLevelSchema>;
type UpdateLevel = z.infer<typeof updateLevelSchema>;
type CreateRelation = z.infer<typeof createRelationSchema>;
type CreateRoleMapping = z.infer<typeof createRoleMappingSchema>;
type CreateCourseMapping = z.infer<typeof createCourseMappingSchema>;
type CreateAssessmentMapping = z.infer<typeof createAssessmentMappingSchema>;
type CreateCertificateMapping = z.infer<typeof createCertificateMappingSchema>;
type UpsertValidity = z.infer<typeof upsertValidityRuleSchema>;
type CreateWeightage = z.infer<typeof createWeightageRuleSchema>;
type UpdateWeightage = z.infer<typeof updateWeightageRuleSchema>;

async function audit(actorId: string, action: "CREATE" | "UPDATE" | "DELETE", entityType: string, entityId?: string) {
  await auditService.log({ action, entityType, entityId, actorId });
}

export const skillAdminService = {
  getOverview: () => skillAdminRepository.getOverview(),
  getMeta: () => skillAdminRepository.getMeta(),

  listCategories: () => skillAdminRepository.listCategories(),
  createCategory: async (input: CreateCategory, actorId: string) => {
    const result = await skillAdminRepository.createCategory(input);
    await audit(actorId, "CREATE", "SkillCategory", result.id);
    return result;
  },
  updateCategory: async (id: string, input: UpdateCategory, actorId: string) => {
    const result = await skillAdminRepository.updateCategory(id, input);
    await audit(actorId, "UPDATE", "SkillCategory", id);
    return result;
  },
  deleteCategory: async (id: string, actorId: string) => {
    await skillAdminRepository.softDeleteCategory(id);
    await audit(actorId, "DELETE", "SkillCategory", id);
  },

  listSkills: (search?: string) => skillAdminRepository.listSkills(search),
  createSkill: async (input: CreateSkill, actorId: string) => {
    const result = await skillAdminRepository.createSkill(input);
    await audit(actorId, "CREATE", "Skill", result.id);
    return result;
  },
  updateSkill: async (id: string, input: UpdateSkill, actorId: string) => {
    const result = await skillAdminRepository.updateSkill(id, input);
    await audit(actorId, "UPDATE", "Skill", id);
    return result;
  },
  deleteSkill: async (id: string, actorId: string) => {
    await skillAdminRepository.softDeleteSkill(id);
    await audit(actorId, "DELETE", "Skill", id);
  },

  listLevels: () => skillAdminRepository.listLevels(),
  createLevel: async (input: CreateLevel, actorId: string) => {
    const result = await skillAdminRepository.createLevel(input);
    await audit(actorId, "CREATE", "SkillLevel", result.id);
    return result;
  },
  updateLevel: async (id: string, input: UpdateLevel, actorId: string) => {
    const result = await skillAdminRepository.updateLevel(id, input);
    await audit(actorId, "UPDATE", "SkillLevel", id);
    return result;
  },
  deleteLevel: async (id: string, actorId: string) => {
    await skillAdminRepository.softDeleteLevel(id);
    await audit(actorId, "DELETE", "SkillLevel", id);
  },

  listRelations: () => skillAdminRepository.listRelations(),
  createRelation: async (input: CreateRelation, actorId: string) => {
    if (input.skillId === input.relatedSkillId) {
      throw new AppError("VALIDATION_ERROR", "A skill cannot relate to itself");
    }
    const result = await skillAdminRepository.createRelation(input);
    await audit(actorId, "CREATE", "SkillRelation", result.id);
    return result;
  },
  deleteRelation: async (id: string, actorId: string) => {
    await skillAdminRepository.softDeleteRelation(id);
    await audit(actorId, "DELETE", "SkillRelation", id);
  },

  listRoleMappings: () => skillAdminRepository.listRoleMappings(),
  createRoleMapping: async (input: CreateRoleMapping, actorId: string) => {
    const result = await skillAdminRepository.createRoleMapping(input);
    await audit(actorId, "CREATE", "RoleSkillRequirement", result.id);
    return result;
  },
  deleteRoleMapping: async (id: string, actorId: string) => {
    await skillAdminRepository.softDeleteRoleMapping(id);
    await audit(actorId, "DELETE", "RoleSkillRequirement", id);
  },

  listCourseMappings: () => skillAdminRepository.listCourseMappings(),
  createCourseMapping: async (input: CreateCourseMapping, actorId: string) => {
    const result = await skillAdminRepository.createCourseMapping(input);
    await audit(actorId, "CREATE", "SkillCourseMapping", result.id);
    return result;
  },
  deleteCourseMapping: async (id: string, actorId: string) => {
    await skillAdminRepository.softDeleteCourseMapping(id);
    await audit(actorId, "DELETE", "SkillCourseMapping", id);
  },

  listAssessmentMappings: () => skillAdminRepository.listAssessmentMappings(),
  createAssessmentMapping: async (input: CreateAssessmentMapping, actorId: string) => {
    const result = await skillAdminRepository.createAssessmentMapping(input);
    await audit(actorId, "CREATE", "SkillAssessmentMapping", result.id);
    return result;
  },
  deleteAssessmentMapping: async (id: string, actorId: string) => {
    await skillAdminRepository.softDeleteAssessmentMapping(id);
    await audit(actorId, "DELETE", "SkillAssessmentMapping", id);
  },

  listCertificateMappings: () => skillAdminRepository.listCertificateMappings(),
  createCertificateMapping: async (input: CreateCertificateMapping, actorId: string) => {
    const result = await skillAdminRepository.createCertificateMapping(input);
    await audit(actorId, "CREATE", "SkillCertificateMapping", result.id);
    return result;
  },
  deleteCertificateMapping: async (id: string, actorId: string) => {
    await skillAdminRepository.softDeleteCertificateMapping(id);
    await audit(actorId, "DELETE", "SkillCertificateMapping", id);
  },

  listValidityRules: () => skillAdminRepository.listValidityRules(),
  upsertValidityRule: async (input: UpsertValidity, actorId: string) => {
    const result = await skillAdminRepository.upsertValidityRule(input);
    await audit(actorId, "UPDATE", "SkillValidityRule", result.id);
    return result;
  },
  deleteValidityRule: async (skillId: string, actorId: string) => {
    await skillAdminRepository.softDeleteValidityRule(skillId);
    await audit(actorId, "DELETE", "SkillValidityRule", skillId);
  },

  listWeightageRules: () => skillAdminRepository.listWeightageRules(),
  createWeightageRule: async (input: CreateWeightage, actorId: string) => {
    const result = await skillAdminRepository.createWeightageRule(input);
    await audit(actorId, "CREATE", "SkillWeightageRule", result.id);
    return result;
  },
  updateWeightageRule: async (id: string, input: UpdateWeightage, actorId: string) => {
    const result = await skillAdminRepository.updateWeightageRule(id, input);
    await audit(actorId, "UPDATE", "SkillWeightageRule", id);
    return result;
  },
  deleteWeightageRule: async (id: string, actorId: string) => {
    await skillAdminRepository.softDeleteWeightageRule(id);
    await audit(actorId, "DELETE", "SkillWeightageRule", id);
  },
};
