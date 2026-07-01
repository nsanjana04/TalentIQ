import type { PrismaClient } from "@prisma/client";
import {
  MODULE_EXAM_PASSING_COUNT,
  MODULE_PASSING_SCORE,
  MODULE_QUIZ_QUESTION_COUNT,
} from "@/constants/assessment-prompts";
import { getExternalCourseConfig } from "@/constants/external-courses";
import { getBundledUdemyCurriculum } from "@/constants/udemy-curricula";
import type { UdemyCurriculum, UdemyCurriculumImportResult } from "@/types/udemy-curriculum";

function lessonContentForExternal(
  sectionTitle: string,
  lectureTitle: string,
  provider: string
): string {
  return `Watch "${lectureTitle}" in the Udemy section "${sectionTitle}" on ${provider}. When finished, return here and mark this lesson complete.`;
}

async function softDeleteExistingModules(prisma: PrismaClient, courseId: string) {
  const modules = await prisma.courseModule.findMany({
    where: { courseId, deletedAt: null },
    select: { id: true, assessmentId: true },
  });

  const moduleIds = modules.map((m) => m.id);
  const assessmentIds = modules.map((m) => m.assessmentId).filter((id): id is string => !!id);

  if (moduleIds.length) {
    await prisma.lesson.updateMany({
      where: { moduleId: { in: moduleIds }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await prisma.courseModule.updateMany({
      where: { id: { in: moduleIds } },
      data: { deletedAt: new Date(), assessmentId: null },
    });
  }

  if (assessmentIds.length) {
    await prisma.assessmentQuestion.updateMany({
      where: { assessmentId: { in: assessmentIds }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await prisma.assessment.updateMany({
      where: { id: { in: assessmentIds }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}

export async function importUdemyCurriculumForCourse(
  prisma: PrismaClient,
  courseId: string,
  courseSlug: string,
  courseTitle: string,
  options: { replace?: boolean } = {}
): Promise<UdemyCurriculumImportResult> {
  const curriculum = getBundledUdemyCurriculum(courseSlug);
  if (!curriculum) {
    return {
      slug: courseSlug,
      courseId,
      modulesCreated: 0,
      lessonsCreated: 0,
      assessmentsCreated: 0,
      skipped: true,
      reason: "no_bundled_curriculum",
    };
  }

  const existingModules = await prisma.courseModule.count({
    where: { courseId, deletedAt: null },
  });

  if (existingModules > 0 && !options.replace) {
    return {
      slug: courseSlug,
      courseId,
      modulesCreated: 0,
      lessonsCreated: 0,
      assessmentsCreated: 0,
      skipped: true,
      reason: "modules_already_exist",
    };
  }

  if (existingModules > 0 && options.replace) {
    await softDeleteExistingModules(prisma, courseId);
  }

  return applyCurriculum(prisma, courseId, courseSlug, courseTitle, curriculum);
}

export async function applyCurriculum(
  prisma: PrismaClient,
  courseId: string,
  courseSlug: string,
  courseTitle: string,
  curriculum: UdemyCurriculum
): Promise<UdemyCurriculumImportResult> {
  const external = getExternalCourseConfig(courseSlug);
  const provider = external?.provider ?? "Udemy";

  let modulesCreated = 0;
  let lessonsCreated = 0;
  let assessmentsCreated = 0;

  for (const [sectionIndex, section] of curriculum.sections.entries()) {
    const module = await prisma.courseModule.create({
      data: {
        courseId,
        title: section.title,
        sortOrder: sectionIndex,
        requireQuizPass: true,
      },
    });
    modulesCreated++;

    for (const [lectureIndex, lecture] of section.lectures.entries()) {
      const content = external
        ? lessonContentForExternal(section.title, lecture.title, provider)
        : `Study "${lecture.title}" as part of "${section.title}". Mark complete when finished.`;

      await prisma.lesson.create({
        data: {
          moduleId: module.id,
          title: lecture.title,
          type: "VIDEO",
          sortOrder: lectureIndex,
          content,
          durationMinutes: lecture.durationMinutes ?? 10,
        },
      });
      lessonsCreated++;
    }

    const assessment = await prisma.assessment.create({
      data: {
        title: `${courseTitle} — ${section.title} Quiz`,
        description: `Module checkpoint for Udemy section "${section.title}". Pass ${MODULE_EXAM_PASSING_COUNT} of ${MODULE_QUIZ_QUESTION_COUNT} to unlock the next module.`,
        courseId,
        type: "QUIZ",
        passingScore: MODULE_PASSING_SCORE,
        maxRetakes: 3,
        allowRetakes: true,
        isPublished: true,
      },
    });
    assessmentsCreated++;

    await prisma.courseModule.update({
      where: { id: module.id },
      data: { assessmentId: assessment.id },
    });
  }

  return {
    slug: courseSlug,
    courseId,
    modulesCreated,
    lessonsCreated,
    assessmentsCreated,
  };
}

export async function importAllBundledUdemyCurricula(
  prisma: PrismaClient,
  options: { replace?: boolean } = {}
): Promise<UdemyCurriculumImportResult[]> {
  const courses = await prisma.course.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, title: true },
  });

  const results: UdemyCurriculumImportResult[] = [];

  for (const course of courses) {
    if (!getBundledUdemyCurriculum(course.slug)) continue;
    results.push(
      await importUdemyCurriculumForCourse(prisma, course.id, course.slug, course.title, options)
    );
  }

  return results;
}
