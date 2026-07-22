import { AppError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/db/prisma";
import { normalizeStoredScorePercent } from "@/lib/assessments/attempt-scoring";
import { getExternalCourseConfig, getExternalCourseUrl } from "@/constants/external-courses";
import { learningRoadmapRepository } from "@/repositories/learning-roadmap.repository";
import { lrsService } from "@/services/lrs.service";
import { courseQuizGeneratorService } from "@/services/course-quiz-generator.service";
import type {
  CompleteLessonResult,
  CompleteModuleResult,
  CoursePlayerCodingRound,
  CoursePlayerData,
  CoursePlayerLesson,
  CoursePlayerModule,
  PrepareModuleAssessmentResult,
} from "@/types/course-learning";
import type { LessonProgressStatus } from "@prisma/client";

type ModuleRow = {
  id: string;
  title: string;
  sortOrder: number;
  requireQuizPass: boolean;
  assessmentId: string | null;
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    maxRetakes: number;
    isPublished: boolean;
    _count: { questions: number };
  } | null;
  lessons: {
    id: string;
    title: string;
    type: string;
    content: string | null;
    videoUrl: string | null;
    pdfUrl: string | null;
    assignmentBrief: string | null;
    durationMinutes: number | null;
    sortOrder: number;
  }[];
};

async function getPassedAssessmentIds(userId: string, assessmentIds: string[]) {
  if (!assessmentIds.length) return new Set<string>();

  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      userId,
      assessmentId: { in: assessmentIds },
      status: "PASSED",
      deletedAt: null,
    },
    select: { assessmentId: true },
  });

  return new Set(attempts.map((a) => a.assessmentId));
}

async function getAssessmentAttemptStats(userId: string, assessmentIds: string[]) {
  const stats = new Map<
    string,
    { bestScore: number | null; attemptsUsed: number; isPassed: boolean }
  >();

  if (!assessmentIds.length) return stats;

  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      userId,
      assessmentId: { in: assessmentIds },
      deletedAt: null,
      status: { in: ["PASSED", "FAILED", "GRADED", "SUBMITTED"] },
    },
    select: { assessmentId: true, score: true, maxScore: true, status: true },
    orderBy: { submittedAt: "desc" },
  });

  for (const id of assessmentIds) {
    const moduleAttempts = attempts.filter((a) => a.assessmentId === id);
    const passed = moduleAttempts.some((a) => a.status === "PASSED");
    const bestScore = moduleAttempts.reduce<number | null>((best, a) => {
      const normalized = normalizeStoredScorePercent(a.score, a.maxScore);
      if (normalized == null) return best;
      return best == null ? normalized : Math.max(best, normalized);
    }, null);
    stats.set(id, {
      bestScore,
      attemptsUsed: moduleAttempts.length,
      isPassed: passed,
    });
  }

  return stats;
}

function isLessonComplete(
  progressMap: Map<string, { status: LessonProgressStatus }>,
  lessonId: string
) {
  return progressMap.get(lessonId)?.status === "COMPLETED";
}

function allModuleLessonsComplete(
  module: ModuleRow,
  progressMap: Map<string, { status: LessonProgressStatus }>
) {
  if (!module.lessons.length) return true;
  return module.lessons.every((lesson) => isLessonComplete(progressMap, lesson.id));
}

function isPreviousModuleUnlocked(
  modules: ModuleRow[],
  moduleIndex: number,
  progressMap: Map<string, { status: LessonProgressStatus }>,
  passedAssessments: Set<string>
) {
  if (moduleIndex <= 0) return true;

  const prev = modules[moduleIndex - 1];
  if (prev.requireQuizPass) {
    return prev.assessmentId ? passedAssessments.has(prev.assessmentId) : false;
  }

  return allModuleLessonsComplete(prev, progressMap);
}

function buildPlayerModules(
  modules: ModuleRow[],
  progressMap: Map<
    string,
    { status: LessonProgressStatus; progressPercent: number; timeSpentMinutes: number | null }
  >,
  passedAssessments: Set<string>,
  attemptStats: Map<string, { bestScore: number | null; attemptsUsed: number; isPassed: boolean }>
): CoursePlayerModule[] {
  return modules.map((module, index) => {
    const isUnlocked = isPreviousModuleUnlocked(modules, index, progressMap, passedAssessments);
    const lessonsComplete = module.lessons.filter((l) =>
      isLessonComplete(progressMap, l.id)
    ).length;

    const lessons: CoursePlayerLesson[] = module.lessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type as CoursePlayerLesson["type"],
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        pdfUrl: lesson.pdfUrl,
        assignmentBrief: lesson.assignmentBrief,
        durationMinutes: lesson.durationMinutes,
        sortOrder: lesson.sortOrder,
        isAccessible: isUnlocked,
        progress: {
          status: progress?.status ?? "NOT_STARTED",
          progressPercent: progress?.progressPercent ?? 0,
          timeSpentMinutes: progress?.timeSpentMinutes ?? null,
        },
      };
    });

    const assessment = module.assessment;
    const stats = assessment ? attemptStats.get(assessment.id) : undefined;
    const quizPassed = assessment ? passedAssessments.has(assessment.id) : true;
    const allLessonsDone = allModuleLessonsComplete(module, progressMap);
    const attemptsUsed = stats?.attemptsUsed ?? 0;
    const canRetake = assessment
      ? !quizPassed && attemptsUsed < assessment.maxRetakes
      : false;
    const moduleQuiz =
      assessment
        ? {
            assessmentId: assessment.id,
            title: assessment.title,
            questionCount: assessment._count.questions,
            passingScore: assessment.passingScore,
            isAvailable: isUnlocked && allLessonsDone && !quizPassed && canRetake,
            isPassed: quizPassed,
            canRetake,
            bestScore: stats?.bestScore ?? null,
            attemptsUsed,
            maxRetakes: assessment.maxRetakes,
            attemptsRemaining: Math.max(0, assessment.maxRetakes - attemptsUsed),
          }
        : null;

    const quizRequired = module.requireQuizPass && !!module.assessmentId && !!moduleQuiz;
    const isComplete =
      allLessonsDone && (!quizRequired || quizPassed);

    return {
      id: module.id,
      title: module.title,
      sortOrder: module.sortOrder,
      isUnlocked,
      isComplete,
      isContentComplete: allLessonsDone,
      lessonsComplete,
      totalLessons: module.lessons.length,
      lessons,
      moduleQuiz,
    };
  });
}

async function fetchLevelCodingAssessment(courseId: string) {
  const path = await prisma.skillLevelPath.findFirst({
    where: { courseId, deletedAt: null, assessmentId: { not: null } },
    select: {
      assessment: {
        select: {
          id: true,
          title: true,
          passingScore: true,
          maxRetakes: true,
          isPublished: true,
          _count: { select: { questions: { where: { deletedAt: null } } } },
        },
      },
    },
  });
  return path?.assessment ?? null;
}

function buildCodingRound(
  assessment: NonNullable<Awaited<ReturnType<typeof fetchLevelCodingAssessment>>>,
  modules: CoursePlayerModule[],
  passedAssessments: Set<string>,
  attemptStats: Map<string, { bestScore: number | null; attemptsUsed: number; isPassed: boolean }>
): CoursePlayerCodingRound {
  const allModulesComplete = modules.length > 0 && modules.every((m) => m.isComplete);
  const stats = attemptStats.get(assessment.id);
  const isPassed = passedAssessments.has(assessment.id);
  const attemptsUsed = stats?.attemptsUsed ?? 0;
  const canRetake = !isPassed && attemptsUsed < assessment.maxRetakes;

  return {
    assessmentId: assessment.id,
    title: assessment.title,
    questionCount: assessment._count.questions,
    passingScore: assessment.passingScore,
    isAvailable: allModulesComplete && !isPassed && canRetake,
    isPassed,
    canRetake,
    bestScore: stats?.bestScore ?? null,
    attemptsUsed,
    maxRetakes: assessment.maxRetakes,
    attemptsRemaining: Math.max(0, assessment.maxRetakes - attemptsUsed),
  };
}

async function syncEnrollmentCompletion(
  userId: string,
  courseId: string,
  modules: CoursePlayerModule[],
  codingRound: CoursePlayerCodingRound | null
) {
  if (!modules.length) return;

  const allModulesComplete = modules.every((m) => m.isComplete);
  const codingDone = !codingRound || codingRound.isPassed;
  if (!allModulesComplete || !codingDone) return;

  const enrollment = await learningRoadmapRepository.getEnrollment(userId, courseId);
  if (!enrollment || enrollment.status === "COMPLETED") return;

  await prisma.courseEnrollment.update({
    where: { id: enrollment.id },
    data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
  });

  await lrsService.recordEvent({
    userId,
    verb: "COMPLETED",
    objectId: `course:${courseId}`,
    objectName: courseId,
    courseId,
    result: { completion: true, success: true },
  }).catch(() => undefined);

  await lrsService.recalculateCourseProgress(userId, courseId).catch(() => undefined);
}

async function maybeGenerateModuleQuiz(moduleId: string, userId: string, module: CoursePlayerModule) {
  if (!module.moduleQuiz || module.moduleQuiz.questionCount > 0) return;
  if (module.lessonsComplete < module.totalLessons) return;

  await courseQuizGeneratorService.ensureModuleQuiz(moduleId, userId).catch(() => undefined);
}

async function maybeGenerateCodingRound(
  courseId: string,
  userId: string,
  modules: CoursePlayerModule[],
  codingAssessment: NonNullable<Awaited<ReturnType<typeof fetchLevelCodingAssessment>>>
) {
  const allModulesComplete = modules.length > 0 && modules.every((m) => m.isComplete);
  if (!allModulesComplete || codingAssessment._count.questions > 0) return;
  await courseQuizGeneratorService.ensureCodingRound(courseId, userId).catch(() => undefined);
}

async function fetchCourseStructure(courseId: string, allowUnpublished = false) {
  return prisma.course.findFirst({
    where: {
      id: courseId,
      deletedAt: null,
      ...(allowUnpublished ? {} : { isPublished: true }),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      durationMinutes: true,
      modules: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          sortOrder: true,
          requireQuizPass: true,
          assessmentId: true,
          assessment: {
            select: {
              id: true,
              title: true,
              passingScore: true,
              maxRetakes: true,
              isPublished: true,
              _count: { select: { questions: { where: { deletedAt: null } } } },
            },
          },
          lessons: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              content: true,
              videoUrl: true,
              pdfUrl: true,
              assignmentBrief: true,
              durationMinutes: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });
}

async function buildPlayerData(
  userId: string,
  courseId: string,
  selectedLessonId?: string | null,
  options?: { allowUnpublished?: boolean }
): Promise<CoursePlayerData> {
  const course = await fetchCourseStructure(courseId, options?.allowUnpublished);
  if (!course) throw new AppError("NOT_FOUND", "Course not found or not published");

  let enrollment = await learningRoadmapRepository.getEnrollment(userId, courseId);
  if (!enrollment) {
    enrollment = await learningRoadmapRepository.enrollUserInCourse(userId, courseId);
    await lrsService.recordEvent({
      userId,
      verb: "STARTED",
      objectId: `course:${courseId}`,
      objectName: course.title,
      courseId,
    }).catch(() => undefined);
  }

  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const progressRows = lessonIds.length
    ? await prisma.lessonProgress.findMany({
        where: { userId, lessonId: { in: lessonIds }, deletedAt: null },
        select: {
          lessonId: true,
          status: true,
          progressPercent: true,
          timeSpentMinutes: true,
        },
      })
    : [];

  const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));

  const assessmentIds = course.modules
    .map((m) => m.assessmentId)
    .filter((id): id is string => !!id);

  const codingAssessment = await fetchLevelCodingAssessment(courseId);
  if (codingAssessment) assessmentIds.push(codingAssessment.id);

  const passedAssessments = await getPassedAssessmentIds(userId, assessmentIds);
  const attemptStats = await getAssessmentAttemptStats(userId, assessmentIds);

  const modules = buildPlayerModules(
    course.modules,
    progressMap,
    passedAssessments,
    attemptStats
  );

  let codingRound = codingAssessment
    ? buildCodingRound(codingAssessment, modules, passedAssessments, attemptStats)
    : null;

  if (codingAssessment) {
    await maybeGenerateCodingRound(courseId, userId, modules, codingAssessment);
    const refreshedCoding = await fetchLevelCodingAssessment(courseId);
    if (refreshedCoding) {
      codingRound = buildCodingRound(refreshedCoding, modules, passedAssessments, attemptStats);
    }
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.totalLessons, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.lessonsComplete, 0);
  const passedQuizzes = modules.filter(
    (m) => m.moduleQuiz?.isPassed || !m.moduleQuiz
  ).length;
  const totalQuizzes = modules.filter((m) => m.moduleQuiz).length;
  const codingWeight = codingRound ? 1 : 0;
  const codingDone = codingRound?.isPassed ? 1 : 0;
  const overallProgress =
    totalLessons + totalQuizzes + codingWeight > 0
      ? Math.round(
          ((completedLessons +
            modules.filter((m) => m.moduleQuiz?.isPassed).length +
            codingDone) /
            (totalLessons + totalQuizzes + codingWeight)) *
            100
        )
      : 0;

  await syncEnrollmentCompletion(userId, courseId, modules, codingRound);

  const externalConfig = getExternalCourseConfig(course.slug);

  const defaultLessonId =
    modules.flatMap((m) => m.lessons).find((l) => l.isAccessible && l.progress.status !== "COMPLETED")
      ?.id ??
    modules.flatMap((m) => m.lessons).find((l) => l.isAccessible)?.id ??
    null;

  return {
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      durationMinutes: course.durationMinutes,
      externalUrl: getExternalCourseUrl(course.slug),
      externalProvider: externalConfig?.provider ?? null,
    },
    enrollment: {
      id: enrollment.id,
      status: enrollment.status,
      progress: Math.max(enrollment.progress, overallProgress),
    },
    modules,
    overallProgress,
    selectedLessonId: selectedLessonId ?? defaultLessonId,
    codingRound,
  };
}

export const courseLearningService = {
  async getPlayer(
    userId: string,
    courseId: string,
    lessonId?: string | null,
    options?: { allowUnpublished?: boolean }
  ) {
    return buildPlayerData(userId, courseId, lessonId, options);
  },

  async completeLesson(
    userId: string,
    lessonId: string,
    timeSpentMinutes?: number
  ): Promise<CompleteLessonResult> {
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      select: {
        id: true,
        title: true,
        moduleId: true,
        module: {
          select: {
            id: true,
            courseId: true,
            course: { select: { id: true, title: true, isPublished: true } },
          },
        },
      },
    });

    if (!lesson?.module?.course) {
      throw new AppError("NOT_FOUND", "Lesson not found");
    }
    if (!lesson.module.course.isPublished) {
      throw new AppError("NOT_FOUND", "Course not found or not published");
    }

    const courseId = lesson.module.courseId;
    const playerBefore = await buildPlayerData(userId, courseId, lessonId);
    const targetLesson = playerBefore.modules
      .flatMap((m) => m.lessons)
      .find((l) => l.id === lessonId);

    if (!targetLesson?.isAccessible) {
      throw new AppError(
        "FORBIDDEN",
        "This lesson is locked. Complete the previous module and pass its quiz to continue."
      );
    }

    const enrollment = await learningRoadmapRepository.getEnrollment(userId, courseId);
    if (!enrollment) {
      throw new AppError("NOT_FOUND", "Enrollment not found");
    }

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        enrollmentId: enrollment.id,
        status: "COMPLETED",
        progressPercent: 100,
        completedAt: new Date(),
        timeSpentMinutes: timeSpentMinutes ?? null,
      },
      update: {
        status: "COMPLETED",
        progressPercent: 100,
        completedAt: new Date(),
        ...(timeSpentMinutes != null ? { timeSpentMinutes } : {}),
      },
    });

    await lrsService.recordEvent({
      userId,
      verb: "COMPLETED",
      objectId: `lesson:${lessonId}`,
      objectName: lesson.title,
      courseId,
      moduleId: lesson.moduleId,
      lessonId,
      durationMs: timeSpentMinutes ? timeSpentMinutes * 60_000 : undefined,
    }).catch(() => undefined);

    const player = await buildPlayerData(userId, courseId, lessonId);

    const completedModule = player.modules.find((m) => m.id === lesson.moduleId);
    if (completedModule?.isContentComplete) {
      await courseQuizGeneratorService.ensureModuleAssessmentLink(lesson.moduleId, userId);
      await maybeGenerateModuleQuiz(lesson.moduleId, userId, completedModule);
    }

    const refreshedPlayer = await buildPlayerData(userId, courseId, lessonId);

    return {
      lessonId,
      moduleId: lesson.moduleId,
      courseId,
      player: refreshedPlayer,
    };
  },

  async completeModule(userId: string, moduleId: string): Promise<CompleteModuleResult> {
    const module = await prisma.courseModule.findFirst({
      where: { id: moduleId, deletedAt: null },
      select: {
        id: true,
        title: true,
        courseId: true,
        course: { select: { id: true, title: true, isPublished: true } },
        lessons: { where: { deletedAt: null }, select: { id: true, title: true } },
      },
    });

    if (!module?.course) throw new AppError("NOT_FOUND", "Module not found");
    if (!module.course.isPublished) {
      throw new AppError("NOT_FOUND", "Course not found or not published");
    }

    const courseId = module.courseId;
    const playerBefore = await buildPlayerData(userId, courseId);
    const targetModule = playerBefore.modules.find((m) => m.id === moduleId);

    if (!targetModule?.isUnlocked) {
      throw new AppError(
        "FORBIDDEN",
        "This module is locked. Pass the previous module assessment to continue."
      );
    }

    const enrollment = await learningRoadmapRepository.getEnrollment(userId, courseId);
    if (!enrollment) throw new AppError("NOT_FOUND", "Enrollment not found");

    for (const lesson of module.lessons) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: lesson.id } },
        create: {
          userId,
          lessonId: lesson.id,
          enrollmentId: enrollment.id,
          status: "COMPLETED",
          progressPercent: 100,
          completedAt: new Date(),
        },
        update: {
          status: "COMPLETED",
          progressPercent: 100,
          completedAt: new Date(),
        },
      });

      await lrsService.recordEvent({
        userId,
        verb: "COMPLETED",
        objectId: `lesson:${lesson.id}`,
        objectName: lesson.title,
        courseId,
        moduleId,
        lessonId: lesson.id,
      }).catch(() => undefined);
    }

    const targetAfter = (await buildPlayerData(userId, courseId)).modules.find(
      (m) => m.id === moduleId
    );
    if (targetAfter?.isContentComplete) {
      await courseQuizGeneratorService.ensureModuleAssessmentLink(moduleId, userId);
    }

    const player = await buildPlayerData(userId, courseId);
    return { moduleId, courseId, player };
  },

  async assertModuleAssessmentEligible(userId: string, assessmentId: string) {
    const module = await prisma.courseModule.findFirst({
      where: { assessmentId, deletedAt: null },
      select: { id: true, courseId: true },
    });
    if (!module) return;

    const player = await buildPlayerData(userId, module.courseId);
    const targetModule = player.modules.find((m) => m.id === module.id);

    if (!targetModule?.isUnlocked) {
      throw new AppError(
        "FORBIDDEN",
        "This assessment is locked. Pass the previous module assessment to continue."
      );
    }
    if (!targetModule.isContentComplete) {
      throw new AppError("BAD_REQUEST", "Complete the module content before taking the assessment");
    }
    if (!targetModule.moduleQuiz) {
      throw new AppError("BAD_REQUEST", "No assessment configured for this module");
    }
    if (targetModule.moduleQuiz.isPassed) {
      throw new AppError("CONFLICT", "You already passed this module assessment");
    }
    if (!targetModule.moduleQuiz.isAvailable && !targetModule.moduleQuiz.canRetake) {
      throw new AppError("FORBIDDEN", "Assessment is not available for this module");
    }
  },

  async prepareModuleAssessment(
    userId: string,
    moduleId: string
  ): Promise<PrepareModuleAssessmentResult> {
    const module = await prisma.courseModule.findFirst({
      where: { id: moduleId, deletedAt: null },
      select: { id: true, courseId: true, assessmentId: true },
    });
    if (!module) throw new AppError("NOT_FOUND", "Module not found");

    const player = await buildPlayerData(userId, module.courseId);
    const targetModule = player.modules.find((m) => m.id === moduleId);

    if (!targetModule?.isContentComplete) {
      throw new AppError("BAD_REQUEST", "Mark the module complete before taking the assessment");
    }

    if (!targetModule.moduleQuiz) {
      throw new AppError("BAD_REQUEST", "No assessment configured for this module");
    }

    if (targetModule.moduleQuiz.isPassed) {
      throw new AppError("BAD_REQUEST", "You already passed this module assessment");
    }

    if (!targetModule.moduleQuiz.isAvailable) {
      throw new AppError("FORBIDDEN", "Assessment is not available for this module");
    }

    const generated = await courseQuizGeneratorService.ensureModuleQuiz(moduleId, userId);

    return {
      moduleId,
      assessmentId: generated.assessmentId,
      assessmentTitle: generated.assessmentTitle,
      questionCount: generated.questionCount,
      generated: generated.generated,
    };
  },

  async prepareCodingRound(userId: string, courseId: string) {
    const player = await buildPlayerData(userId, courseId);
    if (!player.codingRound) {
      throw new AppError("NOT_FOUND", "No coding round for this course");
    }
    if (!player.codingRound.isAvailable && !player.codingRound.canRetake) {
      throw new AppError("FORBIDDEN", "Coding round is not available yet");
    }

    const generated = await courseQuizGeneratorService.ensureCodingRound(courseId, userId);
    return {
      assessmentId: generated.assessmentId,
      assessmentTitle: generated.assessmentTitle,
      questionCount: generated.questionCount,
      generated: generated.generated,
    };
  },

  async canAccessLesson(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      select: { module: { select: { courseId: true } } },
    });
    if (!lesson?.module) return false;

    const player = await buildPlayerData(userId, lesson.module.courseId, lessonId);
    return player.modules.flatMap((m) => m.lessons).some((l) => l.id === lessonId && l.isAccessible);
  },
};
