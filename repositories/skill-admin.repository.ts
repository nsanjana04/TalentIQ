import type { SkillRelationType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toSlug } from "@/lib/utils/slug";

const notDeleted = { deletedAt: null };

export const skillAdminRepository = {
  async getOverview() {
    const [
      totalSkills,
      totalCategories,
      totalLevels,
      totalRoleMappings,
      totalCourseMappings,
      totalAssessmentMappings,
      totalCertificateMappings,
      skillsWithValidityRules,
      skillsWithWeightageRules,
    ] = await Promise.all([
      prisma.skill.count({ where: notDeleted }),
      prisma.skillCategory.count({ where: notDeleted }),
      prisma.skillLevel.count({ where: notDeleted }),
      prisma.roleSkillRequirement.count({ where: notDeleted }),
      prisma.skillCourseMapping.count({ where: notDeleted }),
      prisma.skillAssessmentMapping.count({ where: notDeleted }),
      prisma.skillCertificateMapping.count({ where: notDeleted }),
      prisma.skillValidityRule.count({ where: notDeleted }),
      prisma.skillWeightageRule.count({ where: notDeleted }),
    ]);

    return {
      totalSkills,
      totalCategories,
      totalLevels,
      totalRoleMappings,
      totalCourseMappings,
      totalAssessmentMappings,
      totalCertificateMappings,
      skillsWithValidityRules,
      skillsWithWeightageRules,
    };
  },

  async getMeta() {
    const [categories, skills, levels, jobRoles, experienceLevels, courses, assessments, templates] =
      await Promise.all([
        prisma.skillCategory.findMany({ where: notDeleted, select: { id: true, name: true }, orderBy: { name: "asc" } }),
        prisma.skill.findMany({ where: notDeleted, select: { id: true, name: true }, orderBy: { name: "asc" } }),
        prisma.skillLevel.findMany({ where: notDeleted, select: { id: true, name: true, rank: true }, orderBy: { rank: "asc" } }),
        prisma.jobRole.findMany({ where: notDeleted, select: { id: true, title: true }, orderBy: { title: "asc" } }),
        prisma.experienceLevel.findMany({ where: notDeleted, select: { id: true, name: true }, orderBy: { rank: "asc" } }),
        prisma.course.findMany({ where: notDeleted, select: { id: true, title: true }, orderBy: { title: "asc" } }),
        prisma.assessment.findMany({ where: notDeleted, select: { id: true, title: true }, orderBy: { title: "asc" } }),
        prisma.certificateTemplate.findMany({ where: notDeleted, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      ]);
    return { categories, skills, levels, jobRoles, experienceLevels, courses, assessments, certificateTemplates: templates };
  },

  // Categories
  async listCategories() {
    const items = await prisma.skillCategory.findMany({
      where: notDeleted,
      include: {
        parent: { select: { name: true } },
        _count: { select: { skills: { where: notDeleted } } },
      },
      orderBy: { name: "asc" },
    });
    return items.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      parentName: c.parent?.name ?? null,
      skillCount: c._count.skills,
    }));
  },

  async createCategory(data: { name: string; description?: string; parentId?: string | null }) {
    const slug = toSlug(data.name);
    return prisma.skillCategory.create({
      data: { name: data.name, slug, description: data.description, parentId: data.parentId },
    });
  },

  async updateCategory(id: string, data: { name?: string; description?: string; parentId?: string | null }) {
    return prisma.skillCategory.update({
      where: { id },
      data: { ...data, ...(data.name && { slug: toSlug(data.name) }) },
    });
  },

  async softDeleteCategory(id: string) {
    return prisma.skillCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // Skill library
  async listSkills(search?: string) {
    const items = await prisma.skill.findMany({
      where: {
        ...notDeleted,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        category: { select: { name: true } },
        _count: {
          select: {
            employeeSkills: { where: notDeleted },
            relationsFrom: { where: notDeleted },
            courseMappings: { where: notDeleted },
            assessmentMappings: { where: notDeleted },
            certificateMappings: { where: notDeleted },
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return items.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      categoryId: s.categoryId,
      categoryName: s.category.name,
      employeeCount: s._count.employeeSkills,
      mappingCount:
        s._count.relationsFrom +
        s._count.courseMappings +
        s._count.assessmentMappings +
        s._count.certificateMappings,
    }));
  },

  async createSkill(data: { name: string; description?: string; categoryId: string }) {
    const slug = toSlug(data.name);
    return prisma.skill.create({
      data: { name: data.name, slug, description: data.description, categoryId: data.categoryId },
    });
  },

  async updateSkill(id: string, data: { name?: string; description?: string; categoryId?: string }) {
    return prisma.skill.update({
      where: { id },
      data: { ...data, ...(data.name && { slug: toSlug(data.name) }) },
    });
  },

  async softDeleteSkill(id: string) {
    return prisma.skill.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // Levels
  async listLevels() {
    const items = await prisma.skillLevel.findMany({
      where: notDeleted,
      include: { _count: { select: { employeeSkills: { where: notDeleted } } } },
      orderBy: { rank: "asc" },
    });
    return items.map((l) => ({
      id: l.id,
      name: l.name,
      code: l.code,
      rank: l.rank,
      description: l.description,
      usageCount: l._count.employeeSkills,
    }));
  },

  async createLevel(data: { name: string; code: string; rank: number; description?: string }) {
    return prisma.skillLevel.create({ data });
  },

  async updateLevel(id: string, data: Partial<{ name: string; code: string; rank: number; description: string }>) {
    return prisma.skillLevel.update({ where: { id }, data });
  },

  async softDeleteLevel(id: string) {
    return prisma.skillLevel.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // Skill relations
  async listRelations() {
    const items = await prisma.skillRelation.findMany({
      where: notDeleted,
      include: {
        skill: { select: { name: true } },
        relatedSkill: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return items.map((r) => ({
      id: r.id,
      skillId: r.skillId,
      skillName: r.skill.name,
      relatedSkillId: r.relatedSkillId,
      relatedSkillName: r.relatedSkill.name,
      relationType: r.relationType,
    }));
  },

  async createRelation(data: { skillId: string; relatedSkillId: string; relationType: SkillRelationType }) {
    return prisma.skillRelation.create({ data });
  },

  async softDeleteRelation(id: string) {
    return prisma.skillRelation.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // Role mappings
  async listRoleMappings() {
    const items = await prisma.roleSkillRequirement.findMany({
      where: notDeleted,
      include: {
        jobRole: { select: { title: true } },
        experienceLevel: { select: { name: true } },
        skill: { select: { name: true } },
        requiredSkillLevel: { select: { name: true } },
      },
      orderBy: [{ jobRole: { title: "asc" } }, { skill: { name: "asc" } }],
    });
    return items.map((r) => ({
      id: r.id,
      jobRoleId: r.jobRoleId,
      jobRoleTitle: r.jobRole.title,
      experienceLevelId: r.experienceLevelId,
      experienceLevelName: r.experienceLevel.name,
      skillId: r.skillId,
      skillName: r.skill.name,
      requiredLevelId: r.requiredSkillLevelId,
      requiredLevelName: r.requiredSkillLevel.name,
      isMandatory: r.isMandatory,
    }));
  },

  async createRoleMapping(data: {
    jobRoleId: string;
    experienceLevelId: string;
    skillId: string;
    requiredSkillLevelId: string;
    isMandatory: boolean;
  }) {
    return prisma.roleSkillRequirement.create({ data });
  },

  async softDeleteRoleMapping(id: string) {
    return prisma.roleSkillRequirement.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // Course mappings
  async listCourseMappings() {
    const items = await prisma.skillCourseMapping.findMany({
      where: notDeleted,
      include: { skill: { select: { name: true } }, course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return items.map((m) => ({
      id: m.id,
      skillId: m.skillId,
      skillName: m.skill.name,
      courseId: m.courseId,
      courseTitle: m.course.title,
      coveragePercent: m.coveragePercent,
    }));
  },

  async createCourseMapping(data: { skillId: string; courseId: string; coveragePercent: number }) {
    return prisma.skillCourseMapping.create({ data });
  },

  async softDeleteCourseMapping(id: string) {
    return prisma.skillCourseMapping.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // Assessment mappings
  async listAssessmentMappings() {
    const items = await prisma.skillAssessmentMapping.findMany({
      where: notDeleted,
      include: { skill: { select: { name: true } }, assessment: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return items.map((m) => ({
      id: m.id,
      skillId: m.skillId,
      skillName: m.skill.name,
      assessmentId: m.assessmentId,
      assessmentTitle: m.assessment.title,
    }));
  },

  async createAssessmentMapping(data: { skillId: string; assessmentId: string }) {
    return prisma.skillAssessmentMapping.create({ data });
  },

  async softDeleteAssessmentMapping(id: string) {
    return prisma.skillAssessmentMapping.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // Certificate mappings
  async listCertificateMappings() {
    const items = await prisma.skillCertificateMapping.findMany({
      where: notDeleted,
      include: {
        skill: { select: { name: true } },
        certificateTemplate: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return items.map((m) => ({
      id: m.id,
      skillId: m.skillId,
      skillName: m.skill.name,
      templateId: m.certificateTemplateId,
      templateName: m.certificateTemplate.name,
    }));
  },

  async createCertificateMapping(data: { skillId: string; certificateTemplateId: string }) {
    return prisma.skillCertificateMapping.create({ data });
  },

  async softDeleteCertificateMapping(id: string) {
    return prisma.skillCertificateMapping.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  // Validity rules
  async listValidityRules() {
    const items = await prisma.skillValidityRule.findMany({
      where: notDeleted,
      include: { skill: { select: { name: true } } },
      orderBy: { skill: { name: "asc" } },
    });
    return items.map((r) => ({
      id: r.id,
      skillId: r.skillId,
      skillName: r.skill.name,
      validityDays: r.validityDays,
      gracePeriodDays: r.gracePeriodDays,
      requiresRecertification: r.requiresRecertification,
      reassessmentDaysBeforeExpiry: r.reassessmentDaysBeforeExpiry,
    }));
  },

  async upsertValidityRule(data: {
    skillId: string;
    validityDays: number;
    gracePeriodDays: number;
    requiresRecertification: boolean;
    reassessmentDaysBeforeExpiry: number;
  }) {
    return prisma.skillValidityRule.upsert({
      where: { skillId: data.skillId },
      update: data,
      create: data,
    });
  },

  async softDeleteValidityRule(skillId: string) {
    return prisma.skillValidityRule.updateMany({
      where: { skillId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },

  // Weightage rules
  async listWeightageRules() {
    const items = await prisma.skillWeightageRule.findMany({
      where: notDeleted,
      include: {
        skill: { select: { name: true } },
        jobRole: { select: { title: true } },
        experienceLevel: { select: { name: true } },
      },
      orderBy: [{ weight: "desc" }, { skill: { name: "asc" } }],
    });
    return items.map((r) => ({
      id: r.id,
      skillId: r.skillId,
      skillName: r.skill.name,
      jobRoleId: r.jobRoleId,
      jobRoleTitle: r.jobRole?.title ?? null,
      experienceLevelId: r.experienceLevelId,
      experienceLevelName: r.experienceLevel?.name ?? null,
      weight: r.weight,
      isMandatory: r.isMandatory,
    }));
  },

  async createWeightageRule(data: {
    skillId: string;
    jobRoleId?: string | null;
    experienceLevelId?: string | null;
    weight: number;
    isMandatory: boolean;
  }) {
    return prisma.skillWeightageRule.create({ data });
  },

  async updateWeightageRule(
    id: string,
    data: Partial<{ jobRoleId: string | null; experienceLevelId: string | null; weight: number; isMandatory: boolean }>
  ) {
    return prisma.skillWeightageRule.update({ where: { id }, data });
  },

  async softDeleteWeightageRule(id: string) {
    return prisma.skillWeightageRule.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
