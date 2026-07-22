import type { PrismaClient } from "@prisma/client";

export async function seedSkillMappings(prisma: PrismaClient) {
  console.log("\n── Skill Admin Mappings ──");

  const skills = await prisma.skill.findMany({ where: { deletedAt: null } });
  const courses = await prisma.course.findMany({ where: { deletedAt: null }, take: 4 });
  const assessments = await prisma.assessment.findMany({ where: { deletedAt: null }, take: 4 });
  const template = await prisma.certificateTemplate.findFirst({ where: { deletedAt: null } });

  if (skills.length < 2 || courses.length === 0) {
    console.log("  ⊘ Skipped (needs skills and courses)");
    return;
  }

  let count = 0;

  // Skill relations
  await prisma.skillRelation.upsert({
    where: { skillId_relatedSkillId: { skillId: skills[1].id, relatedSkillId: skills[0].id } },
    update: {},
    create: {
      skillId: skills[1].id,
      relatedSkillId: skills[0].id,
      relationType: "PREREQUISITE",
    },
  });
  count++;

  // Course mappings
  for (let i = 0; i < Math.min(skills.length, courses.length); i++) {
    await prisma.skillCourseMapping.upsert({
      where: { skillId_courseId: { skillId: skills[i].id, courseId: courses[i].id } },
      update: {},
      create: { skillId: skills[i].id, courseId: courses[i].id, coveragePercent: 80 + i * 5 },
    });
    count++;
  }

  // Assessment mappings
  for (let i = 0; i < Math.min(skills.length, assessments.length); i++) {
    await prisma.skillAssessmentMapping.upsert({
      where: { skillId_assessmentId: { skillId: skills[i].id, assessmentId: assessments[i].id } },
      update: {},
      create: { skillId: skills[i].id, assessmentId: assessments[i].id },
    });
    count++;
  }

  // Certificate mappings
  if (template) {
    for (let i = 0; i < Math.min(3, skills.length); i++) {
      await prisma.skillCertificateMapping.upsert({
        where: {
          skillId_certificateTemplateId: {
            skillId: skills[i].id,
            certificateTemplateId: template.id,
          },
        },
        update: {},
        create: { skillId: skills[i].id, certificateTemplateId: template.id },
      });
      count++;
    }
  }

  // Validity rules
  for (let i = 0; i < Math.min(4, skills.length); i++) {
    await prisma.skillValidityRule.upsert({
      where: { skillId: skills[i].id },
      update: {},
      create: {
        skillId: skills[i].id,
        validityDays: 365,
        gracePeriodDays: 30,
        requiresRecertification: true,
        reassessmentDaysBeforeExpiry: 60,
      },
    });
    count++;
  }

  // Weightage rules
  const jobRoles = await prisma.jobRole.findMany({ where: { deletedAt: null }, take: 2 });
  for (let i = 0; i < Math.min(3, skills.length); i++) {
    await prisma.skillWeightageRule.create({
      data: {
        skillId: skills[i].id,
        jobRoleId: jobRoles[i % jobRoles.length]?.id,
        weight: 15 + i * 5,
        isMandatory: i === 0,
      },
    });
    count++;
  }

  console.log(`  ✓ Skill admin mappings: ${count}`);
}
