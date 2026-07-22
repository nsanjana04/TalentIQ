import { prisma } from "@/lib/db/prisma";

const active = { deletedAt: null };

export const adminOverviewService = {
  async getOverview() {
    const [
      totalUsers,
      activeUsers,
      totalDepartments,
      totalTeams,
      totalSkills,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completedEnrollments,
      inProgressEnrollments,
      totalAssessments,
      publishedAssessments,
      totalCertificates,
      activeCertificates,
      auditLogsLast7Days,
      totalRoles,
    ] = await Promise.all([
      prisma.user.count({ where: active }),
      prisma.user.count({ where: { ...active, isActive: true } }),
      prisma.department.count({ where: active }),
      prisma.team.count({ where: active }),
      prisma.skill.count({ where: active }),
      prisma.course.count({ where: active }),
      prisma.course.count({ where: { ...active, isPublished: true } }),
      prisma.courseEnrollment.count({ where: active }),
      prisma.courseEnrollment.count({ where: { ...active, status: "COMPLETED" } }),
      prisma.courseEnrollment.count({ where: { ...active, status: "IN_PROGRESS" } }),
      prisma.assessment.count({ where: active }),
      prisma.assessment.count({ where: { ...active, isPublished: true } }),
      prisma.certificate.count({ where: active }),
      prisma.certificate.count({ where: { ...active, status: "ACTIVE" } }),
      prisma.auditLog.count({
        where: {
          ...active,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.role.count({ where: active }),
    ]);

    const learningCompletionRate = totalEnrollments
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    return {
      users: { total: totalUsers, active: activeUsers },
      organization: { departments: totalDepartments, teams: totalTeams },
      skills: { total: totalSkills },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        enrollments: totalEnrollments,
        completed: completedEnrollments,
        inProgress: inProgressEnrollments,
        completionRate: learningCompletionRate,
      },
      assessments: { total: totalAssessments, published: publishedAssessments },
      certificates: { total: totalCertificates, active: activeCertificates },
      audit: { last7Days: auditLogsLast7Days },
      roles: { total: totalRoles },
    };
  },
};
