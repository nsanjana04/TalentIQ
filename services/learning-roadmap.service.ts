import { getExternalCourseConfig, getExternalCourseUrl } from "@/constants/external-courses";
import type { RoleSlug } from "@/constants/role-slugs";
import { AppError } from "@/lib/errors/app-error";
import type { LearningRoadmapQuery } from "@/lib/validations/learning-roadmap";
import { learningRoadmapRepository } from "@/repositories/learning-roadmap.repository";
import type {
  LearningRoadmapOverview,
  LevelStepStatus,
  RoadmapLevelStep,
  RoadmapStepProgress,
  SkillRoadmap,
} from "@/types/learning-roadmap";
import { auditService } from "@/services/audit.service";
import { lrsService } from "@/services/lrs.service";
import { courseQuizGeneratorService } from "@/services/course-quiz-generator.service";

const PRIORITY_SKILL_SLUGS = ["python"] as const;

function sortSkillsForDisplay<T extends { skillSlug: string; skillName: string }>(skills: T[]): T[] {
  return [...skills].sort((a, b) => {
    const aPriority = PRIORITY_SKILL_SLUGS.indexOf(a.skillSlug as (typeof PRIORITY_SKILL_SLUGS)[number]);
    const bPriority = PRIORITY_SKILL_SLUGS.indexOf(b.skillSlug as (typeof PRIORITY_SKILL_SLUGS)[number]);
    const aRank = aPriority === -1 ? PRIORITY_SKILL_SLUGS.length + 1 : aPriority;
    const bRank = bPriority === -1 ? PRIORITY_SKILL_SLUGS.length + 1 : bPriority;
    if (aRank !== bRank) return aRank - bRank;
    return a.skillName.localeCompare(b.skillName);
  });
}

function isStepComplete(
  progress: RoadmapStepProgress,
  hasCourse: boolean,
  hasAssessment: boolean,
  hasCert: boolean
): boolean {
  const courseOk = !hasCourse || progress.courseStatus === "COMPLETED";
  const assessmentOk = !hasAssessment || progress.assessmentPassed === true;
  const certOk = !hasCert || progress.certificateIssued;
  return courseOk && assessmentOk && certOk;
}

function isStepInProgress(
  progress: RoadmapStepProgress,
  hasCourse: boolean,
  hasAssessment: boolean
): boolean {
  if (hasCourse && progress.courseStatus && progress.courseStatus !== "COMPLETED") {
    if (progress.courseProgress && progress.courseProgress > 0) return true;
    if (progress.courseStatus === "IN_PROGRESS" || progress.courseStatus === "ENROLLED") return true;
  }
  if (hasAssessment && progress.assessmentPassed === false && progress.assessmentScore !== null) {
    return true;
  }
  if (hasAssessment && progress.assessmentPassed === null && progress.assessmentScore === null) {
    const courseDone = !hasCourse || progress.courseStatus === "COMPLETED";
    if (courseDone && hasCourse) return true;
  }
  return false;
}

function resolveStepStatus(
  levelRank: number,
  previousComplete: boolean,
  progress: RoadmapStepProgress,
  hasCourse: boolean,
  hasAssessment: boolean,
  hasCert: boolean
): LevelStepStatus {
  if (levelRank > 1 && !previousComplete) return "locked";
  if (isStepComplete(progress, hasCourse, hasAssessment, hasCert)) return "completed";
  if (isStepInProgress(progress, hasCourse, hasAssessment)) return "in_progress";
  return "available";
}

function buildStepProgress(
  courseId: string | null | undefined,
  assessmentId: string | null | undefined,
  templateId: string | null | undefined,
  enrollments: Map<string, { status: string; progress: number }>,
  courseProgressRecords: Map<
    string,
    { progressPercent: number; status: string; completedLessons: number; totalLessons: number }
  >,
  attempts: Map<string, { status: string; score: number | null }>,
  certificates: { courseId: string | null; assessmentId: string | null; templateId: string; certificateNumber: string }[]
): RoadmapStepProgress {
  const enrollment = courseId ? enrollments.get(courseId) : undefined;
  const lrsRecord = courseId ? courseProgressRecords.get(courseId) : undefined;
  const attempt = assessmentId ? attempts.get(assessmentId) : undefined;
  const cert = certificates.find(
    (c) =>
      (courseId && c.courseId === courseId) ||
      (assessmentId && c.assessmentId === assessmentId) ||
      (templateId && c.templateId === templateId)
  );

  const mergedProgress = Math.max(enrollment?.progress ?? 0, lrsRecord?.progressPercent ?? 0);
  const mergedStatus =
    enrollment?.status === "COMPLETED" || lrsRecord?.status === "COMPLETED"
      ? "COMPLETED"
      : mergedProgress > 0
        ? "IN_PROGRESS"
        : enrollment?.status ?? lrsRecord?.status ?? null;

  const assessmentPassed =
    attempt?.status === "PASSED" || attempt?.status === "GRADED"
      ? (attempt.score ?? 0) >= 70
      : attempt
        ? false
        : null;

  return {
    courseProgress: mergedProgress,
    courseStatus: mergedStatus,
    completedLessons: lrsRecord?.completedLessons ?? null,
    totalLessons: lrsRecord?.totalLessons ?? null,
    assessmentPassed,
    assessmentScore: attempt?.score ?? null,
    certificateIssued: !!cert,
    certificateNumber: cert?.certificateNumber ?? null,
  };
}

function computeStepProgressFraction(
  progress: RoadmapStepProgress,
  hasCourse: boolean,
  hasAssessment: boolean,
  hasCert: boolean,
  status: LevelStepStatus
): number {
  if (status === "completed") return 1;
  if (status === "locked") return 0;

  const components = [hasCourse, hasAssessment, hasCert].filter(Boolean).length;
  if (!components) return 0;

  const weight = 1 / components;
  let fraction = 0;

  if (hasCourse) {
    if (progress.courseStatus === "COMPLETED") fraction += weight;
    else fraction += ((progress.courseProgress ?? 0) / 100) * weight;
  }
  if (hasAssessment) {
    if (progress.assessmentPassed) fraction += weight;
    else if (progress.assessmentScore !== null) fraction += weight * 0.5;
  }
  if (hasCert && progress.certificateIssued) fraction += weight;

  return fraction;
}

function buildSkillRoadmap(
  skill: Awaited<ReturnType<typeof learningRoadmapRepository.getSkillPaths>>[number],
  employeeSkillMap: Map<string, { code: string; name: string; rank: number }>,
  enrollments: Map<string, { status: string; progress: number }>,
  courseProgressRecords: Map<
    string,
    { progressPercent: number; status: string; completedLessons: number; totalLessons: number }
  >,
  attempts: Map<string, { status: string; score: number | null }>,
  certificates: { courseId: string | null; assessmentId: string | null; templateId: string; certificateNumber: string }[]
): SkillRoadmap {
  const currentLevel = employeeSkillMap.get(skill.id) ?? null;
  const steps: RoadmapLevelStep[] = [];
  let previousComplete = true;
  let completedSteps = 0;
  let progressSum = 0;

  for (const path of skill.levelPaths) {
    const hasCourse = !!path.course;
    const hasAssessment = !!path.assessment;
    const hasCert = !!path.certificateTemplate;
    const progress = buildStepProgress(
      path.course?.id,
      path.assessment?.id,
      path.certificateTemplate?.id,
      enrollments,
      courseProgressRecords,
      attempts,
      certificates
    );
    const status = resolveStepStatus(
      path.skillLevel.rank,
      previousComplete,
      progress,
      hasCourse,
      hasAssessment,
      hasCert
    );

    if (status === "completed") {
      completedSteps++;
      previousComplete = true;
    } else {
      previousComplete = false;
    }

    progressSum += computeStepProgressFraction(progress, hasCourse, hasAssessment, hasCert, status);

    const questionCount = path.assessment?._count.questions ?? 0;

    steps.push({
      id: path.id,
      levelCode: path.skillLevel.code,
      levelName: path.skillLevel.name,
      levelRank: path.skillLevel.rank,
      title: path.title ?? `${skill.name} ${path.skillLevel.code}`,
      description: path.description,
      estimatedDays: path.estimatedDays,
      status,
      course: path.course
        ? {
            id: path.course.id,
            slug: path.course.slug,
            title: path.course.title,
            durationMinutes: path.course.durationMinutes,
            externalUrl: getExternalCourseUrl(path.course.slug),
            externalUnitCount: getExternalCourseConfig(path.course.slug)?.totalUnits ?? null,
            moduleCount: path.course._count?.modules ?? 0,
          }
        : null,
      assessment: path.assessment
        ? {
            id: path.assessment.id,
            title: path.assessment.title,
            passingScore: path.assessment.passingScore,
            questionCount,
            quizReady: questionCount > 0,
          }
        : null,
      certificate: path.certificateTemplate
        ? { id: path.certificateTemplate.id, name: path.certificateTemplate.name }
        : null,
      progress,
    });
  }

  const totalSteps = steps.length;
  const overallProgress = totalSteps ? Math.round((progressSum / totalSteps) * 100) : 0;
  const targetStep = steps.find((s) => s.status !== "completed") ?? steps[steps.length - 1];

  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSlug: skill.slug,
    categoryName: skill.category.name,
    currentLevel: currentLevel
      ? { code: currentLevel.code, name: currentLevel.name, rank: currentLevel.rank }
      : null,
    targetLevel: targetStep
      ? { code: targetStep.levelCode, name: targetStep.levelName, rank: targetStep.levelRank }
      : null,
    overallProgress,
    completedSteps,
    totalSteps,
    steps,
  };
}

export const learningRoadmapService = {
  async getRoadmap(
    sessionUserId: string,
    _role: RoleSlug,
    query: LearningRoadmapQuery
  ): Promise<LearningRoadmapOverview> {
    const targetUserId = query.userId ?? sessionUserId;
    const user = await learningRoadmapRepository.getUserContext(targetUserId);
    if (!user) throw new AppError("NOT_FOUND", "User not found");

    const skills = await learningRoadmapRepository.getSkillPaths(query.skillId);
    const courseIds = skills.flatMap((s) => s.levelPaths.map((p) => p.course?.id).filter(Boolean)) as string[];
    const assessmentIds = skills.flatMap((s) =>
      s.levelPaths.map((p) => p.assessment?.id).filter(Boolean)
    ) as string[];

    const { enrollments, attempts, certificates, courseProgressRecords } =
      await learningRoadmapRepository.getUserProgress(targetUserId, courseIds, assessmentIds);

    const enrollmentMap = new Map(
      enrollments.map((e) => [e.courseId, { status: e.status, progress: e.progress }])
    );
    const courseProgressMap = new Map(
      courseProgressRecords.map((p) => [
        p.courseId,
        {
          progressPercent: p.progressPercent,
          status: p.status,
          completedLessons: p.completedLessons,
          totalLessons: p.totalLessons,
        },
      ])
    );
    const attemptMap = new Map<string, { status: string; score: number | null }>();
    for (const a of attempts) {
      if (!attemptMap.has(a.assessmentId)) {
        attemptMap.set(a.assessmentId, { status: a.status, score: a.score });
      }
    }

    const employeeSkillMap = new Map(
      user.employeeSkills.map((es) => [es.skillId, es.skillLevel])
    );

    const skillRoadmaps = sortSkillsForDisplay(
      skills.map((skill) =>
        buildSkillRoadmap(skill, employeeSkillMap, enrollmentMap, courseProgressMap, attemptMap, certificates)
      )
    );

    const overallProgress = skillRoadmaps.length
      ? Math.round(
          skillRoadmaps.reduce((sum, s) => sum + s.overallProgress, 0) / skillRoadmaps.length
        )
      : 0;

    return {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      jobRole: user.jobRole?.title ?? null,
      experienceLevel: user.experienceLevel?.name ?? null,
      overallProgress,
      skills: skillRoadmaps,
    };
  },

  async enrollInCourse(userId: string, courseId: string) {
    const course = await learningRoadmapRepository.getCourseById(courseId);
    if (!course) throw new AppError("NOT_FOUND", "Course not found or not published");

    const externalConfig = getExternalCourseConfig(course.slug);
    const enrollment = await learningRoadmapRepository.enrollUserInCourse(userId, courseId, {
      initialProgress: externalConfig?.startedProgress,
    });

    await auditService.log({
      action: "CREATE",
      entityType: "CourseEnrollment",
      entityId: enrollment.id,
      actorId: userId,
      metadata: {
        courseId,
        courseTitle: course.title,
        external: !!externalConfig,
      },
    });

    await lrsService.recordEvent({
      userId,
      verb: "STARTED",
      objectId: `course:${courseId}`,
      objectName: course.title,
      courseId,
    }).catch(() => undefined);

    await lrsService.recalculateCourseProgress(userId, courseId).catch(() => undefined);

    return { enrollmentId: enrollment.id, courseId, status: enrollment.status };
  },

  async completeExternalCourse(userId: string, courseId: string) {
    const course = await learningRoadmapRepository.getCourseById(courseId);
    if (!course) throw new AppError("NOT_FOUND", "Course not found or not published");

    const externalConfig = getExternalCourseConfig(course.slug);
    if (!externalConfig) {
      throw new AppError("BAD_REQUEST", "This course is not hosted on an external platform");
    }

    const enrollment = await learningRoadmapRepository.getEnrollment(userId, courseId);
    if (!enrollment) {
      throw new AppError("NOT_FOUND", "Enrollment not found. Start the course first.");
    }
    if (enrollment.status === "COMPLETED") {
      return { enrollmentId: enrollment.id, courseId, status: enrollment.status, progress: 100 };
    }

    const updated = await learningRoadmapRepository.completeExternalEnrollment(userId, courseId);

    await lrsService.recalculateCourseProgress(userId, courseId).catch(() => undefined);

    await auditService.log({
      action: "UPDATE",
      entityType: "CourseEnrollment",
      entityId: updated.id,
      actorId: userId,
      metadata: {
        courseId,
        courseTitle: course.title,
        external: true,
        progress: 100,
      },
    });

    await lrsService.recordEvent({
      userId,
      verb: "COMPLETED",
      objectId: `course:${courseId}`,
      objectName: course.title,
      courseId,
      result: { completion: true, success: true },
    }).catch(() => undefined);

    await courseQuizGeneratorService.ensureQuizAfterCourseCompletion(userId, courseId);

    return { enrollmentId: updated.id, courseId, status: updated.status, progress: updated.progress };
  },

  async generateCourseQuiz(userId: string, courseId: string) {
    const enrollment = await learningRoadmapRepository.getEnrollment(userId, courseId);
    if (!enrollment || enrollment.status !== "COMPLETED") {
      throw new AppError("BAD_REQUEST", "Complete the course before generating the level quiz");
    }
    return courseQuizGeneratorService.generateForCourse(courseId, userId);
  },
};
