import { prisma } from "@/lib/db/prisma";

export const learningRoadmapRepository = {
  async getUserContext(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jobRole: { select: { id: true, title: true, code: true } },
        experienceLevel: { select: { id: true, name: true, code: true, rank: true } },
        employeeSkills: {
          where: { deletedAt: null },
          select: {
            skillId: true,
            skillLevel: { select: { id: true, code: true, name: true, rank: true } },
          },
        },
      },
    });
  },

  async getSkillPaths(skillId?: string) {
    return prisma.skill.findMany({
      where: {
        deletedAt: null,
        ...(skillId ? { id: skillId } : {}),
        levelPaths: { some: { deletedAt: null } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: { select: { name: true } },
        levelPaths: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { skillLevel: { rank: "asc" } }],
          select: {
            id: true,
            title: true,
            description: true,
            estimatedDays: true,
            skillLevel: { select: { id: true, code: true, name: true, rank: true } },
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
                durationMinutes: true,
                isPublished: true,
                _count: { select: { modules: { where: { deletedAt: null } } } },
              },
            },
            assessment: {
              select: {
                id: true,
                title: true,
                passingScore: true,
                isPublished: true,
                _count: { select: { questions: { where: { deletedAt: null } } } },
              },
            },
            certificateTemplate: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async getUserProgress(userId: string, courseIds: string[], assessmentIds: string[]) {
    const [enrollments, attempts, certificates, courseProgressRecords] = await Promise.all([
      courseIds.length
        ? prisma.courseEnrollment.findMany({
            where: { userId, courseId: { in: courseIds }, deletedAt: null },
            select: {
              courseId: true,
              status: true,
              progress: true,
              enrolledAt: true,
              completedAt: true,
            },
          })
        : [],
      assessmentIds.length
        ? prisma.assessmentAttempt.findMany({
            where: {
              userId,
              assessmentId: { in: assessmentIds },
              deletedAt: null,
              status: { in: ["PASSED", "FAILED", "GRADED", "IN_PROGRESS"] },
            },
            orderBy: { submittedAt: "desc" },
            select: {
              assessmentId: true,
              status: true,
              score: true,
              submittedAt: true,
            },
          })
        : [],
      prisma.certificate.findMany({
        where: { userId, deletedAt: null },
        select: {
          courseId: true,
          assessmentId: true,
          certificateNumber: true,
          issuedAt: true,
          templateId: true,
        },
      }),
      courseIds.length
        ? prisma.courseProgressRecord.findMany({
            where: { userId, courseId: { in: courseIds }, deletedAt: null },
            select: {
              courseId: true,
              progressPercent: true,
              status: true,
              completedLessons: true,
              totalLessons: true,
            },
          })
        : [],
    ]);

    return { enrollments, attempts, certificates, courseProgressRecords };
  },

  async getRoleRequirements(jobRoleId: string, experienceLevelId: string) {
    return prisma.roleSkillRequirement.findMany({
      where: { jobRoleId, experienceLevelId, deletedAt: null },
      select: {
        skillId: true,
        isMandatory: true,
        requiredSkillLevel: { select: { code: true, name: true, rank: true } },
        skill: { select: { name: true, slug: true } },
      },
    });
  },

  async getNextJobRole(currentRoleCode: string) {
    const progression: Record<string, string> = {
      SWE: "SSE",
      SSE: "DEVOPS_ENG",
      DEVOPS_ENG: "DATA_ENG",
      QA_ENG: "SSE",
      DATA_ENG: "SSE",
    };
    const nextCode = progression[currentRoleCode];
    if (!nextCode) return null;
    return prisma.jobRole.findFirst({
      where: { code: nextCode, deletedAt: null },
      select: { id: true, title: true, code: true },
    });
  },

  async enrollUserInCourse(
    userId: string,
    courseId: string,
    options?: { initialProgress?: number }
  ) {
    const existing = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      if (existing.status === "COMPLETED") return existing;
      return prisma.courseEnrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: { status: "IN_PROGRESS" },
      });
    }

    const initialProgress = options?.initialProgress ?? 0;
    return prisma.courseEnrollment.create({
      data: {
        userId,
        courseId,
        status: initialProgress > 0 ? "IN_PROGRESS" : "ENROLLED",
        progress: initialProgress,
      },
    });
  },

  async completeExternalEnrollment(userId: string, courseId: string) {
    return prisma.courseEnrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: {
        status: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
      },
    });
  },

  async getEnrollment(userId: string, courseId: string) {
    return prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true, status: true, progress: true },
    });
  },

  async getCourseById(courseId: string) {
    return prisma.course.findFirst({
      where: { id: courseId, deletedAt: null, isPublished: true },
      select: { id: true, title: true, slug: true },
    });
  },
};
