import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import {
  PATHWAY_FINAL_TIER_QUESTION_PLAN,
  totalPathwayFinalQuestions,
} from "@/constants/pathway-final-assessment";
import {
  getPathwayLevelDefinitions,
  MODULES_PER_PATHWAY_LEVEL,
  PATHWAY_LEVEL_TIER_LABELS,
  PATHWAY_LEVEL_TIER_ORDER,
  type PathwayLevelDefinition,
} from "@/constants/roadmap-pathway-levels";
import { getPathwayDefinition, resolvePathwayExternalUrl } from "@/constants/roadmap-pathway";
import { learningRoadmapService } from "@/services/learning-roadmap.service";
import { pathwayFinalAssessmentService } from "@/services/pathway-final-assessment.service";
import type {
  PathwayContentTopic,
  PathwayCourseCurriculum,
  PathwayCourseStatus,
  PathwayFinalAssessmentInfo,
  PathwayLevelContentStatus,
  PathwayLevelCurriculum,
} from "@/types/roadmap-pathway";

async function isPathwayCertificateComplete(userId: string, courseId: string | null) {
  if (!courseId) return false;

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { userId, courseId, deletedAt: null, status: "COMPLETED" },
    select: { id: true },
  });

  return Boolean(enrollment);
}

function computeProgress(
  levelsComplete: number,
  levelsTotal: number,
  assessmentPassed: boolean,
  certificateComplete: boolean
): number {
  if (certificateComplete) return 100;
  if (assessmentPassed) return 90;
  if (!levelsTotal) return 0;
  return Math.min(Math.round((levelsComplete / levelsTotal) * 80), 80);
}

function resolveCourseStatus(
  progress: number,
  assessmentPassed: boolean,
  certificateComplete: boolean
): PathwayCourseStatus {
  if (certificateComplete && assessmentPassed) return "completed";
  if (progress > 0 || assessmentPassed) return "in_progress";
  return "not_started";
}

async function loadLevelTopics(
  level: PathwayLevelDefinition,
  courseId: string | null
): Promise<PathwayContentTopic[]> {
  if (courseId) {
    const dbModules = await prisma.courseModule.findMany({
      where: { courseId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      take: MODULES_PER_PATHWAY_LEVEL,
      select: { id: true, title: true, sortOrder: true },
    });

    if (dbModules.length) {
      return dbModules.map((module) => ({
        id: module.id,
        title: module.title,
        sortOrder: module.sortOrder,
      }));
    }
  }

  return level.conceptTitles.map((title, index) => ({
    id: `${level.courseSlug}-topic-${index}`,
    title,
    sortOrder: index,
  }));
}

function buildLevels(
  levelDefs: PathwayLevelDefinition[],
  topicsByLevel: PathwayContentTopic[][],
  completedTiers: Set<string>,
  externalUrlBySlug: Map<string, string>
): PathwayLevelCurriculum[] {
  return levelDefs.map((level, index) => {
    const previousComplete =
      index === 0 || completedTiers.has(levelDefs[index - 1]!.tier);
    const isComplete = completedTiers.has(level.tier);
    const isLocked = !previousComplete;

    let contentStatus: PathwayLevelContentStatus = "locked";
    if (isComplete) contentStatus = "completed";
    else if (!isLocked) contentStatus = "available";

    return {
      tier: level.tier,
      name: level.name,
      courseSlug: level.courseSlug,
      externalUrl: externalUrlBySlug.get(level.courseSlug) ?? null,
      topics: topicsByLevel[index] ?? [],
      contentStatus,
      isLocked,
    };
  });
}

function buildFinalAssessmentInfo(
  assessment: Awaited<ReturnType<typeof pathwayFinalAssessmentService.getFinalAssessmentMeta>>,
  allContentComplete: boolean,
  passed: boolean,
  hasFailedAttempt: boolean
): PathwayFinalAssessmentInfo {
  const sections = PATHWAY_LEVEL_TIER_ORDER.map((tier) => ({
    tier,
    name: PATHWAY_LEVEL_TIER_LABELS[tier],
    mcqCount: PATHWAY_FINAL_TIER_QUESTION_PLAN[tier].mcq,
    codeCount: PATHWAY_FINAL_TIER_QUESTION_PLAN[tier].code,
  }));

  let status: PathwayFinalAssessmentInfo["status"] = "locked";
  if (passed) status = "passed";
  else if (allContentComplete) status = hasFailedAttempt ? "failed" : "available";

  return {
    assessmentId: assessment?.id ?? null,
    title: assessment?.title ?? "Final Evaluation",
    questionCount: assessment?._count.questions ?? totalPathwayFinalQuestions(),
    passingScore: assessment?.passingScore ?? 70,
    status,
    unlocked: allContentComplete && !passed,
    sections,
  };
}

export const pathwayCurriculumService = {
  async getCourseCurriculum(userId: string, pathwaySlug: string): Promise<PathwayCourseCurriculum> {
    const definition = getPathwayDefinition(pathwaySlug);
    if (!definition) throw new AppError("NOT_FOUND", "Pathway course not found");

    const levelDefs = getPathwayLevelDefinitions(pathwaySlug);
    if (!levelDefs.length) {
      throw new AppError("NOT_FOUND", "No curriculum configured for this pathway course");
    }

    const courseSlugs = levelDefs.map((level) => level.courseSlug);
    const dbCourses = await prisma.course.findMany({
      where: { slug: { in: courseSlugs }, deletedAt: null, isPublished: true },
      select: { id: true, slug: true },
    });
    const courseIdBySlug = new Map(dbCourses.map((course) => [course.slug, course.id]));
    const externalUrlBySlug = new Map(
      levelDefs.map((level) => [level.courseSlug, resolvePathwayExternalUrl(level.courseSlug)])
    );

    const primaryCourseId = courseIdBySlug.get(definition.primaryCourseSlug) ?? dbCourses[0]?.id ?? null;

    const topicsByLevel = await Promise.all(
      levelDefs.map((level) => loadLevelTopics(level, courseIdBySlug.get(level.courseSlug) ?? null))
    );

    const completedTiers = await pathwayFinalAssessmentService.getCompletedContentTiers(
      userId,
      pathwaySlug
    );
    const levels = buildLevels(levelDefs, topicsByLevel, completedTiers, externalUrlBySlug);

    const levelsContentComplete = levels.filter((level) => level.contentStatus === "completed").length;
    const levelsContentTotal = levels.length;
    const allContentComplete = levelsContentComplete === levelsContentTotal;

    const assessmentMeta = await pathwayFinalAssessmentService.getFinalAssessmentMeta(
      pathwaySlug,
      primaryCourseId
    );
    const assessmentPassed = await pathwayFinalAssessmentService.hasPassedFinalAssessment(
      userId,
      assessmentMeta?.id ?? null
    );

    const hasFailedAttempt = assessmentMeta
      ? Boolean(
          await prisma.assessmentAttempt.findFirst({
            where: {
              userId,
              assessmentId: assessmentMeta.id,
              status: "FAILED",
              deletedAt: null,
            },
            select: { id: true },
          })
        )
      : false;

    const finalAssessment = buildFinalAssessmentInfo(
      assessmentMeta,
      allContentComplete,
      assessmentPassed,
      hasFailedAttempt
    );

    const certificateComplete = await isPathwayCertificateComplete(userId, primaryCourseId);
    const progress = computeProgress(
      levelsContentComplete,
      levelsContentTotal,
      assessmentPassed,
      certificateComplete
    );
    const status = resolveCourseStatus(progress, assessmentPassed, certificateComplete);

    return {
      pathwaySlug,
      title: definition.title,
      description: definition.description,
      primaryCourseId,
      levels,
      finalAssessment,
      levelsContentComplete,
      levelsContentTotal,
      allContentComplete,
      allAssessmentsPassed: assessmentPassed,
      certificateUnlocked: assessmentPassed,
      certificateComplete,
      progress,
      status,
    };
  },

  async markLevelContentComplete(userId: string, pathwaySlug: string, tier: string) {
    return pathwayFinalAssessmentService.markLevelContentComplete(
      userId,
      pathwaySlug,
      tier as (typeof PATHWAY_LEVEL_TIER_ORDER)[number]
    );
  },

  async prepareFinalAssessment(userId: string, pathwaySlug: string) {
    const curriculum = await this.getCourseCurriculum(userId, pathwaySlug);

    if (!curriculum.allContentComplete) {
      throw new AppError(
        "FORBIDDEN",
        "Complete all level content (Basic through Expert) before taking the final assessment."
      );
    }

    if (curriculum.allAssessmentsPassed) {
      throw new AppError("CONFLICT", "You already passed the final assessment.");
    }

    if (!curriculum.primaryCourseId) {
      throw new AppError("BAD_REQUEST", "This pathway course is not linked to a learning record yet.");
    }

    await learningRoadmapService
      .enrollInCourse(userId, curriculum.primaryCourseId)
      .catch(() => undefined);

    return pathwayFinalAssessmentService.ensureFinalAssessment(
      userId,
      pathwaySlug,
      curriculum.primaryCourseId
    );
  },
};
