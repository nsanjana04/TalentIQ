import { prisma } from "@/lib/db/prisma";
import {
  ROADMAP_PATHWAY_COURSES,
  ROADMAP_PATHWAY_NAME,
  relatedDbSlugsForPathway,
  resolvePathwayExternalUrl,
  getPathwayDefinition,
} from "@/constants/roadmap-pathway";
import {
  PATHWAY_LEVEL_TIER_LABELS,
  PATHWAY_LEVEL_TIER_ORDER,
} from "@/constants/roadmap-pathway-levels";
import { AppError } from "@/lib/errors/app-error";
import {
  assertCertificateFile,
  verifyRoadmapCertificate,
} from "@/lib/learning/certificate-verifier";
import { learningRoadmapService } from "@/services/learning-roadmap.service";
import { pathwayCurriculumService } from "@/services/pathway-curriculum.service";
import type { PathwayFinalAssessmentStatus, RoadmapPathwayOverview } from "@/types/roadmap-pathway";

const ROADMAP_PATHWAY_DESCRIPTION =
  "Structured IT and software courses with in-app assessments and verified certificates.";

function resolveNextLevelName(levelsComplete: number): string | null {
  if (levelsComplete >= PATHWAY_LEVEL_TIER_ORDER.length) return null;
  return PATHWAY_LEVEL_TIER_LABELS[PATHWAY_LEVEL_TIER_ORDER[levelsComplete]!] ?? null;
}

async function getLastAssessmentScorePercent(
  userId: string,
  assessmentId: string | null
): Promise<number | null> {
  if (!assessmentId) return null;

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      userId,
      assessmentId,
      deletedAt: null,
      status: { in: ["SUBMITTED", "GRADED", "PASSED", "FAILED"] },
    },
    orderBy: { submittedAt: "desc" },
    select: { score: true, maxScore: true },
  });

  if (!attempt?.score || !attempt.maxScore) return null;
  return Math.round((attempt.score / attempt.maxScore) * 100);
}

export const roadmapPathwayService = {
  async getPathway(userId: string): Promise<RoadmapPathwayOverview> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, updatedAt: true },
    });
    if (!user) throw new AppError("NOT_FOUND", "User not found");

    const allSlugs = ROADMAP_PATHWAY_COURSES.flatMap((course) => [
      course.primaryCourseSlug,
      ...relatedDbSlugsForPathway(course.slug),
    ]);

    const dbCourses = await prisma.course.findMany({
      where: { slug: { in: allSlugs }, deletedAt: null, isPublished: true },
      select: { id: true, slug: true },
    });
    const courseIdBySlug = new Map(dbCourses.map((course) => [course.slug, course.id]));

    const courses = await Promise.all(
      ROADMAP_PATHWAY_COURSES.map(async (definition) => {
        const relatedSlugs = [
          definition.primaryCourseSlug,
          ...relatedDbSlugsForPathway(definition.slug),
        ];
        const courseId =
          courseIdBySlug.get(definition.primaryCourseSlug) ??
          relatedSlugs.map((slug) => courseIdBySlug.get(slug)).find(Boolean) ??
          null;

        const curriculum = await pathwayCurriculumService
          .getCourseCurriculum(userId, definition.slug)
          .catch(() => null);

        const levelsContentComplete = curriculum?.levelsContentComplete ?? 0;
        const finalAssessmentStatus: PathwayFinalAssessmentStatus =
          curriculum?.finalAssessment.status ?? "locked";
        const lastAssessmentScorePercent = await getLastAssessmentScorePercent(
          userId,
          curriculum?.finalAssessment.assessmentId ?? null
        );

        return {
          id: definition.slug,
          slug: definition.slug,
          title: definition.title,
          description: definition.description,
          logo: definition.logo,
          pathwayName: ROADMAP_PATHWAY_NAME,
          externalUrl: resolvePathwayExternalUrl(definition.primaryCourseSlug),
          courseId: curriculum?.primaryCourseId ?? courseId,
          progress: curriculum?.progress ?? 0,
          status: curriculum?.status ?? "not_started",
          provider: definition.provider,
          estimatedHours: definition.estimatedHours,
          nextLevelName: resolveNextLevelName(levelsContentComplete),
          finalAssessmentStatus,
          lastAssessmentScorePercent,
          totalAssessments: 1,
          passedAssessments: curriculum?.allAssessmentsPassed ? 1 : 0,
          allAssessmentsPassed: curriculum?.allAssessmentsPassed ?? false,
          certificateUnlocked: curriculum?.certificateUnlocked ?? false,
          certificateComplete: curriculum?.certificateComplete ?? false,
          levelsContentComplete,
          levelsContentTotal: curriculum?.levelsContentTotal ?? 4,
        };
      })
    );

    const coursesCompleted = courses.filter((c) => c.status === "completed").length;
    const certificatesEarned = courses.filter((c) => c.certificateComplete).length;
    const overallProgressPercent = courses.length
      ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)
      : 0;

    const activeCourse = courses.find(
      (course) => course.status === "in_progress" && !course.certificateComplete
    );
    const lastActivityLabel = activeCourse
      ? `Active on ${activeCourse.title}`
      : coursesCompleted > 0
        ? `${coursesCompleted} course${coursesCompleted === 1 ? "" : "s"} completed`
        : "Not started yet";

    return {
      pathwayName: ROADMAP_PATHWAY_NAME,
      pathwayDescription: ROADMAP_PATHWAY_DESCRIPTION,
      lastUpdated: user.updatedAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      lastActivityLabel,
      courses,
      coursesTotal: courses.length,
      coursesCompleted,
      coursesInProgress: courses.filter((c) => c.status === "in_progress").length,
      certificatesEarned,
      overallProgressPercent,
      totalEstimatedHours: ROADMAP_PATHWAY_COURSES.reduce(
        (sum, course) => sum + course.estimatedHours,
        0
      ),
    };
  },

  async getCourseCurriculum(userId: string, pathwaySlug: string) {
    return pathwayCurriculumService.getCourseCurriculum(userId, pathwaySlug);
  },

  async markLevelContentComplete(userId: string, pathwaySlug: string, tier: string) {
    return pathwayCurriculumService.markLevelContentComplete(userId, pathwaySlug, tier);
  },

  async prepareFinalAssessment(userId: string, pathwaySlug: string) {
    return pathwayCurriculumService.prepareFinalAssessment(userId, pathwaySlug);
  },

  async openExternalCourse(userId: string, pathwaySlug: string) {
    const definition = getPathwayDefinition(pathwaySlug);
    if (!definition) throw new AppError("NOT_FOUND", "Pathway course not found");

    const pathway = await this.getPathway(userId);
    const course = pathway.courses.find((item) => item.slug === pathwaySlug);
    if (!course) throw new AppError("NOT_FOUND", "Pathway course not found");

    if (course.courseId) {
      await learningRoadmapService.enrollInCourse(userId, course.courseId).catch(() => undefined);
    }

    return { externalUrl: course.externalUrl, courseId: course.courseId };
  },

  async verifyCertificate(
    userId: string,
    pathwaySlug: string,
    file: { name: string; type: string; buffer: Buffer }
  ) {
    const definition = getPathwayDefinition(pathwaySlug);
    if (!definition) throw new AppError("NOT_FOUND", "Pathway course not found");

    const curriculum = await pathwayCurriculumService.getCourseCurriculum(userId, pathwaySlug);
    if (!curriculum.allAssessmentsPassed) {
      return {
        verified: false,
        rejectionReason:
          "Pass the final evaluation assessment before uploading your provider certificate.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    if (!user) throw new AppError("NOT_FOUND", "User not found");

    try {
      assertCertificateFile(file.name, file.type, file.buffer.length);
    } catch (error) {
      return {
        verified: false,
        rejectionReason:
          error instanceof Error ? error.message : "Invalid certificate file.",
      };
    }

    return verifyRoadmapCertificate({
      fileName: file.name,
      mimeType: file.type,
      buffer: file.buffer,
      learnerName: `${user.firstName} ${user.lastName}`.trim(),
      pathwayCourse: definition,
    });
  },

  async completeWithCertificate(userId: string, pathwaySlug: string) {
    const curriculum = await pathwayCurriculumService.getCourseCurriculum(userId, pathwaySlug);
    if (!curriculum.allAssessmentsPassed) {
      throw new AppError(
        "BAD_REQUEST",
        "Pass the final evaluation assessment before marking this course complete."
      );
    }

    const courseId = curriculum.primaryCourseId;
    if (!courseId) {
      throw new AppError("BAD_REQUEST", "This pathway course is not linked to a learning record yet.");
    }

    await learningRoadmapService.enrollInCourse(userId, courseId).catch(() => undefined);
    return learningRoadmapService.completeExternalCourse(userId, courseId);
  },
};
