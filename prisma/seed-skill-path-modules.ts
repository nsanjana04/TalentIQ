import type { PrismaClient } from "@prisma/client";
import { MODULE_EXAM_PASSING_COUNT, MODULE_PASSING_SCORE, MODULE_QUIZ_QUESTION_COUNT } from "../constants/assessment-prompts";
import { getExternalCourseConfig } from "../constants/external-courses";
import { getBundledUdemyCurriculum } from "../constants/udemy-curricula";
import { getModuleTopicsForCourse, MODULES_PER_LEVEL } from "../constants/skill-path-modules";

export async function seedSkillPathModules(prisma: PrismaClient) {
  console.log("\n── Skill Path Modules ──");

  const paths = await prisma.skillLevelPath.findMany({
    where: { deletedAt: null, courseId: { not: null } },
    select: {
      courseId: true,
      course: { select: { id: true, slug: true, title: true } },
    },
  });

  let moduleCount = 0;
  let lessonCount = 0;
  let assessmentCount = 0;

  const seenCourseIds = new Set<string>();

  for (const path of paths) {
    if (!path.courseId || !path.course || seenCourseIds.has(path.courseId)) continue;
    seenCourseIds.add(path.courseId);

    const existingModules = await prisma.courseModule.count({
      where: { courseId: path.courseId, deletedAt: null },
    });
    if (existingModules > 0) continue;
    if (getBundledUdemyCurriculum(path.course.slug)) continue;

    const topics = getModuleTopicsForCourse(path.course.slug);
    const external = getExternalCourseConfig(path.course.slug);
    const provider = external?.provider ?? "the learning platform";

    for (let i = 0; i < MODULES_PER_LEVEL; i++) {
      const topic = topics[i] ?? `Module ${i + 1}`;
      const module = await prisma.courseModule.create({
        data: {
          courseId: path.courseId,
          title: topic,
          sortOrder: i,
          requireQuizPass: true,
        },
      });
      moduleCount++;

      const lessonContent = external
        ? `Complete "${topic}" on ${provider}. Watch the related lectures and exercises, then return here and mark this module complete to unlock the module assessment.`
        : `Study the concepts for "${topic}". Review the materials and complete the exercises, then mark this module complete to take the module assessment.`;

      await prisma.lesson.create({
        data: {
          moduleId: module.id,
          title: topic,
          type: "VIDEO",
          sortOrder: 0,
          content: lessonContent,
          durationMinutes: Math.round((path.course ? 60 : 45)),
        },
      });
      lessonCount++;

      const assessment = await prisma.assessment.create({
        data: {
          title: `${path.course.title} — ${topic} Quiz`,
          description: `Module checkpoint for "${topic}". Pass ${MODULE_EXAM_PASSING_COUNT} of ${MODULE_QUIZ_QUESTION_COUNT} to unlock the next module.`,
          courseId: path.courseId,
          type: "QUIZ",
          passingScore: MODULE_PASSING_SCORE,
          maxRetakes: 3,
          allowRetakes: true,
          isPublished: true,
        },
      });
      assessmentCount++;

      await prisma.courseModule.update({
        where: { id: module.id },
        data: { assessmentId: assessment.id },
      });
    }
  }

  console.log(
    `  ✓ Skill path modules: ${moduleCount} modules, ${lessonCount} lessons, ${assessmentCount} assessments`
  );
}
