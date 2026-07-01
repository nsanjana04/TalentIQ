import type { Prisma, XapiVerb } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DashboardScope } from "@/lib/dashboard/scope";
import { buildUserWhere } from "@/lib/dashboard/scope";

export const lrsRepository = {
  async createLearningEvent(data: Prisma.LearningEventCreateInput) {
    return prisma.learningEvent.create({ data });
  },

  async findEvents(params: {
    userId?: string;
    courseId?: string;
    verb?: XapiVerb;
    since?: Date;
    limit?: number;
    scope?: DashboardScope;
  }) {
    const where: Prisma.LearningEventWhereInput = { deletedAt: null };
    if (params.userId) where.userId = params.userId;
    if (params.courseId) where.courseId = params.courseId;
    if (params.verb) where.verb = params.verb;
    if (params.since) where.timestamp = { gte: params.since };

    if (params.scope && !params.userId) {
      const userWhere = buildUserWhere(params.scope);
      where.user = userWhere;
    }

    return prisma.learningEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: params.limit ?? 50,
    });
  },

  async upsertCourseProgress(
    userId: string,
    courseId: string,
    data: {
      enrollmentId?: string;
      totalLessons?: number;
      completedLessons?: number;
      progressPercent?: number;
      timeSpentMinutes?: number;
      lastActivityAt?: Date;
      estimatedCompletionAt?: Date | null;
      status?: Prisma.CourseProgressRecordCreateInput["status"];
      startedAt?: Date;
      completedAt?: Date | null;
    }
  ) {
    const { enrollmentId, ...fields } = data;
    return prisma.courseProgressRecord.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        user: { connect: { id: userId } },
        course: { connect: { id: courseId } },
        ...(enrollmentId ? { enrollment: { connect: { id: enrollmentId } } } : {}),
        ...fields,
      },
      update: {
        ...fields,
        ...(enrollmentId ? { enrollment: { connect: { id: enrollmentId } } } : {}),
      },
    });
  },

  async getCourseProgress(userId: string, courseId?: string) {
    return prisma.courseProgressRecord.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(courseId ? { courseId } : {}),
      },
      include: { course: { select: { id: true, title: true, slug: true } } },
      orderBy: { lastActivityAt: "desc" },
    });
  },

  async upsertAssessmentProgress(
    userId: string,
    assessmentId: string,
    data: {
      totalQuestions?: number;
      completedQuestions?: number;
      progressPercent?: number;
      lastAttemptId?: string;
      status?: Prisma.AssessmentProgressRecordCreateInput["status"];
      bestScore?: number | null;
      passed?: boolean | null;
      lastActivityAt?: Date;
    }
  ) {
    return prisma.assessmentProgressRecord.upsert({
      where: { userId_assessmentId: { userId, assessmentId } },
      create: {
        user: { connect: { id: userId } },
        assessment: { connect: { id: assessmentId } },
        ...data,
      },
      update: data,
    });
  },

  async getAssessmentProgress(userId: string) {
    return prisma.assessmentProgressRecord.findMany({
      where: { userId, deletedAt: null },
      include: { assessment: { select: { id: true, title: true } } },
    });
  },

  async upsertCertificateProgress(
    userId: string,
    data: Prisma.CertificateProgressRecordCreateInput
  ) {
    const existing = await prisma.certificateProgressRecord.findFirst({
      where: {
        userId,
        templateId: data.template?.connect?.id ?? undefined,
        courseId: data.course?.connect?.id ?? undefined,
        assessmentId: data.assessment?.connect?.id ?? undefined,
        deletedAt: null,
      },
    });
    if (existing) {
      return prisma.certificateProgressRecord.update({
        where: { id: existing.id },
        data,
      });
    }
    return prisma.certificateProgressRecord.create({ data });
  },

  async getCertificateProgress(userId: string) {
    return prisma.certificateProgressRecord.findMany({
      where: { userId, deletedAt: null },
      include: { template: { select: { name: true } } },
    });
  },

  async upsertExternalRecord(
    userId: string,
    provider: Prisma.ExternalLearningRecordCreateInput["provider"],
    externalId: string,
    data: Omit<Prisma.ExternalLearningRecordCreateInput, "user" | "provider" | "externalId">
  ) {
    return prisma.externalLearningRecord.upsert({
      where: { userId_provider_externalId: { userId, provider, externalId } },
      create: {
        user: { connect: { id: userId } },
        provider,
        externalId,
        ...data,
        title: data.title as string,
      },
      update: { ...data, syncedAt: new Date() },
    });
  },

  async getExternalRecords(userId: string) {
    return prisma.externalLearningRecord.findMany({
      where: { userId, deletedAt: null },
      orderBy: { syncedAt: "desc" },
    });
  },

  async getCourseLessonCounts(courseId: string) {
    const modules = await prisma.courseModule.findMany({
      where: { courseId, deletedAt: null },
      include: { lessons: { where: { deletedAt: null } } },
    });
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    return { totalLessons, modules };
  },

  async getCompletedLessonCount(userId: string, courseId: string) {
    const lessons = await prisma.lesson.findMany({
      where: {
        deletedAt: null,
        module: { courseId, deletedAt: null },
      },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);
    const completed = await prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: lessonIds },
        status: "COMPLETED",
        deletedAt: null,
      },
    });
    return { completed, total: lessonIds.length };
  },

  async getAssessmentQuestionCount(assessmentId: string) {
    return prisma.assessmentQuestion.count({
      where: { assessmentId, deletedAt: null },
    });
  },

  async getScopedCourseProgress(scope: DashboardScope) {
    const userWhere = buildUserWhere(scope);
    return prisma.courseProgressRecord.findMany({
      where: { deletedAt: null, user: userWhere },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            teamId: true,
            department: { select: { name: true } },
          },
        },
        course: { select: { title: true } },
      },
    });
  },

  async getScopedEvents(scope: DashboardScope, since?: Date) {
    const userWhere = buildUserWhere(scope);
    return prisma.learningEvent.findMany({
      where: {
        deletedAt: null,
        user: userWhere,
        ...(since ? { timestamp: { gte: since } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });
  },

  async getUserWithDepartment(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, departmentId: true, teamId: true, firstName: true, lastName: true, email: true },
    });
  },

  async getEnrollment(userId: string, courseId: string) {
    return prisma.courseEnrollment.findFirst({
      where: { userId, courseId, deletedAt: null },
    });
  },

  async syncEnrollmentProgress(
    userId: string,
    courseId: string,
    progressPercent: number,
    status: "ENROLLED" | "IN_PROGRESS" | "COMPLETED" | "DROPPED"
  ) {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { userId, courseId, deletedAt: null },
    });
    if (!enrollment) return null;

    const enrollmentStatus =
      status === "COMPLETED"
        ? "COMPLETED"
        : status === "IN_PROGRESS" || progressPercent > 0
          ? "IN_PROGRESS"
          : enrollment.status;

    return prisma.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: progressPercent,
        status: enrollmentStatus,
        ...(progressPercent >= 100 ? { completedAt: new Date() } : {}),
      },
    });
  },

  async countCertificatesEarned(userId: string) {
    return prisma.certificate.count({
      where: { userId, status: "ACTIVE", deletedAt: null },
    });
  },

  async getLearningPathProgress(userId: string) {
    const paths = await prisma.skillLevelPath.findMany({
      where: { deletedAt: null },
      select: { id: true, skillId: true },
    });
    const completedLevels = await prisma.employeeSkill.count({
      where: { userId, deletedAt: null, verifiedAt: { not: null } },
    });
    return { completedLevels, totalLevels: paths.length || 1 };
  },

  async getSkillRankHistory(userId: string) {
    const skills = await prisma.employeeSkill.findMany({
      where: { userId, deletedAt: null },
      include: { skillLevel: { select: { rank: true } } },
    });
    const avgRank =
      skills.length > 0
        ? skills.reduce((sum, s) => sum + s.skillLevel.rank, 0) / skills.length
        : 0;
    return avgRank;
  },
};
