import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DashboardScope } from "@/lib/dashboard/scope";
import { buildUserWhere } from "@/lib/dashboard/scope";
import type { ActivityItem } from "@/types/dashboard";

const CHART_COLORS = {
  primary: "oklch(45% 0.2 264)",
  success: "oklch(55% 0.15 145)",
  warning: "oklch(70% 0.15 75)",
  danger: "oklch(55% 0.22 25)",
  muted: "oklch(70% 0.05 264)",
  accent: "oklch(55% 0.18 300)",
};

function monthsBack(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("en-US", { month: "short" }));
  }
  return months;
}

async function getScopedUserIds(scope: DashboardScope): Promise<string[] | undefined> {
  const where = buildUserWhere(scope);
  if (!scope.userFilter) return undefined;
  const users = await prisma.user.findMany({ where, select: { id: true } });
  return users.map((u) => u.id);
}

function resolveUserIds(
  scope: DashboardScope,
  scopedUserIds?: string[]
): string[] | undefined | Promise<string[] | undefined> {
  if (scopedUserIds !== undefined) return scopedUserIds;
  return getScopedUserIds(scope);
}

export const dashboardRepository = {
  async resolveScopedUserIds(scope: DashboardScope) {
    return getScopedUserIds(scope);
  },

  async countEmployees(scope: DashboardScope) {
    const where = buildUserWhere(scope);
    const [total, active] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({
        where: {
          ...where,
          lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const prevMonthStart = new Date();
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    prevMonthStart.setDate(1);

    const createdThisMonth = await prisma.user.count({
      where: {
        ...where,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    });

    return { total, active, createdThisMonth };
  },

  async getSkillReadiness(scope: DashboardScope, scopedUserIds?: string[]) {
    const userIds = await resolveUserIds(scope, scopedUserIds);
    const employeeWhere: Prisma.EmployeeSkillWhereInput = {
      deletedAt: null,
      ...(userIds && { userId: { in: userIds } }),
    };

    const [skills, categories, skillLevels] = await Promise.all([
      prisma.employeeSkill.findMany({
        where: employeeWhere,
        include: {
          skill: { include: { category: true } },
          skillLevel: true,
        },
      }),
      prisma.skillCategory.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
      }),
      prisma.skillLevel.findMany({ orderBy: { rank: "asc" } }),
    ]);

    const maxRank = Math.max(...skillLevels.map((l) => l.rank), 4);
    const verifiedCount = skills.filter((s) => s.verifiedAt).length;

    const categoryMap = new Map<string, { total: number; score: number; count: number }>();
    for (const es of skills) {
      const catName = es.skill.category?.name ?? "Uncategorized";
      const readiness = (es.skillLevel.rank / maxRank) * 100;
      const existing = categoryMap.get(catName) ?? { total: 0, score: 0, count: 0 };
      existing.score += readiness;
      existing.count += 1;
      existing.total += 1;
      categoryMap.set(catName, existing);
    }

    const byCategory = categories
      .map((c) => {
        const data = categoryMap.get(c.name);
        return {
          name: c.name,
          readiness: data ? Math.round(data.score / data.count) : 0,
          count: data?.count ?? 0,
        };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.readiness - a.readiness);

    const overall =
      skills.length > 0
        ? Math.round(
            skills.reduce((sum, s) => sum + (s.skillLevel.rank / maxRank) * 100, 0) /
              skills.length
          )
        : 0;

    const monthLabels = monthsBack(6);
    const trend = monthLabels.map((month) => {
      const monthSkills = skills.filter((s) => {
        return s.createdAt.toLocaleString("en-US", { month: "short" }) === month;
      });
      const readiness =
        monthSkills.length > 0
          ? Math.round(
              monthSkills.reduce((sum, s) => sum + (s.skillLevel.rank / maxRank) * 100, 0) /
                monthSkills.length
            )
          : overall;
      return { month, readiness };
    });

    return {
      overall,
      verifiedCount,
      totalSkills: skills.length,
      byCategory,
      trend,
    };
  },

  async getLearningProgress(scope: DashboardScope, scopedUserIds?: string[]) {
    const userIds = await resolveUserIds(scope, scopedUserIds);
    const where: Prisma.CourseEnrollmentWhereInput = {
      deletedAt: null,
      ...(userIds && { userId: { in: userIds } }),
    };

    const enrollments = await prisma.courseEnrollment.findMany({
      where,
      include: { course: { select: { title: true } } },
    });

    const enrolled = enrollments.length;
    const inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS").length;
    const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
    const dropped = enrollments.filter((e) => e.status === "DROPPED").length;
    const avgProgress =
      enrolled > 0
        ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrolled)
        : 0;

    const courseMap = new Map<string, { enrollments: number; totalProgress: number }>();
    for (const e of enrollments) {
      const existing = courseMap.get(e.course.title) ?? { enrollments: 0, totalProgress: 0 };
      existing.enrollments += 1;
      existing.totalProgress += e.progress;
      courseMap.set(e.course.title, existing);
    }

    const topCourses = [...courseMap.entries()]
      .map(([name, data]) => ({
        name,
        enrollments: data.enrollments,
        avgProgress: Math.round(data.totalProgress / data.enrollments),
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);

    const monthLabels = monthsBack(6);
    const trend = monthLabels.map((month) => {
      const monthEnrolled = enrollments.filter((e) => {
        const d = e.enrolledAt;
        return d.toLocaleString("en-US", { month: "short" }) === month;
      }).length;
      const monthCompleted = enrollments.filter((e) => {
        if (!e.completedAt) return false;
        return e.completedAt.toLocaleString("en-US", { month: "short" }) === month;
      }).length;
      return { month, enrolled: monthEnrolled || Math.round(enrolled / 6), completed: monthCompleted };
    });

    return { enrolled, inProgress, completed, dropped, avgProgress, trend, topCourses };
  },

  async getAssessments(scope: DashboardScope, scopedUserIds?: string[]) {
    const userIds = await resolveUserIds(scope, scopedUserIds);
    const where: Prisma.AssessmentAttemptWhereInput = {
      deletedAt: null,
      ...(userIds && { userId: { in: userIds } }),
    };

    const attempts = await prisma.assessmentAttempt.findMany({ where });

    const totalAttempts = attempts.length;
    const passed = attempts.filter((a) => a.status === "PASSED").length;
    const passRate = totalAttempts > 0 ? Math.round((passed / totalAttempts) * 100) : 0;
    const scored = attempts.filter((a) => a.score != null);
    const avgScore =
      scored.length > 0
        ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length)
        : 0;

    const statusCounts = ["PASSED", "FAILED", "IN_PROGRESS", "SUBMITTED", "GRADED"] as const;
    const fills = [CHART_COLORS.success, CHART_COLORS.danger, CHART_COLORS.warning, CHART_COLORS.muted, CHART_COLORS.accent];
    const byStatus = statusCounts
      .map((status, i) => ({
        status: status.replace("_", " "),
        count: attempts.filter((a) => a.status === status).length,
        fill: fills[i],
      }))
      .filter((s) => s.count > 0);

    const monthLabels = monthsBack(6);
    const trend = monthLabels.map((month) => {
      const monthAttempts = attempts.filter((a) => {
        const d = a.startedAt;
        return d.toLocaleString("en-US", { month: "short" }) === month;
      });
      const monthPassed = monthAttempts.filter((a) => a.status === "PASSED").length;
      return {
        month,
        attempts: monthAttempts.length,
        passRate:
          monthAttempts.length > 0
            ? Math.round((monthPassed / monthAttempts.length) * 100)
            : 0,
      };
    });

    return { totalAttempts, passRate, avgScore, byStatus, trend };
  },

  async getCertificates(scope: DashboardScope, scopedUserIds?: string[]) {
    const userIds = await resolveUserIds(scope, scopedUserIds);
    const where: Prisma.CertificateWhereInput = {
      deletedAt: null,
      ...(userIds && { userId: { in: userIds } }),
    };

    const certs = await prisma.certificate.findMany({ where });
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const total = certs.length;
    const active = certs.filter((c) => !c.expiresAt || c.expiresAt > now).length;
    const expiringSoon = certs.filter(
      (c) => c.expiresAt && c.expiresAt > now && c.expiresAt <= in30Days
    ).length;

    const monthLabels = monthsBack(6);
    const trend = monthLabels.map((month) => ({
      month,
      issued: certs.filter(
        (c) => c.issuedAt.toLocaleString("en-US", { month: "short" }) === month
      ).length,
    }));

    return { total, active, expiringSoon, trend };
  },

  async getDepartmentPerformance(scope: DashboardScope) {
    if (scope.type === "personal") return [];

    const deptWhere: Prisma.DepartmentWhereInput = { deletedAt: null };
    if (scope.userFilter?.departmentId) {
      deptWhere.id = scope.userFilter.departmentId;
    }

    const departments = await prisma.department.findMany({
      where: deptWhere,
      include: {
        users: {
          where: { isActive: true, deletedAt: null },
          include: {
            employeeSkills: { include: { skillLevel: true } },
            enrollments: { where: { deletedAt: null } },
            assessmentAttempts: { where: { deletedAt: null } },
          },
        },
      },
    });

    return departments.map((dept) => {
      const employees = dept.users.length;
      const allSkills = dept.users.flatMap((u) => u.employeeSkills);
      const skillReadiness =
        allSkills.length > 0
          ? Math.round(
              allSkills.reduce((s, es) => s + es.skillLevel.rank * 25, 0) / allSkills.length
            )
          : 0;

      const enrollments = dept.users.flatMap((u) => u.enrollments);
      const learningProgress =
        enrollments.length > 0
          ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
          : 0;

      const attempts = dept.users.flatMap((u) => u.assessmentAttempts);
      const passed = attempts.filter((a) => a.status === "PASSED").length;
      const assessmentPassRate =
        attempts.length > 0 ? Math.round((passed / attempts.length) * 100) : 0;

      return {
        name: dept.name,
        code: dept.code,
        employees,
        skillReadiness,
        learningProgress,
        assessmentPassRate,
      };
    });
  },

  async getRecentActivity(scope: DashboardScope, limit = 12, scopedUserIds?: string[]) {
    const userIds = await resolveUserIds(scope, scopedUserIds);

    const [auditLogs, notifications] = await Promise.all([
      prisma.auditLog.findMany({
        where: userIds ? { actorId: { in: userIds } } : {},
        include: {
          actor: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      userIds
        ? prisma.notification.findMany({
            where: { userId: { in: userIds }, deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: limit,
          })
        : prisma.notification.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: limit,
          }),
    ]);

    const auditItems = auditLogs.map((log) => ({
      id: log.id,
      type: "audit" as const,
      title: formatAuditAction(log.action),
      description: `${log.entityType}${log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}`,
      actor: log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : undefined,
      timestamp: log.createdAt.toISOString(),
      icon: mapAuditIcon(log.action, log.entityType),
    }));

    const notifItems = notifications.map((n) => ({
      id: n.id,
      type: "notification" as const,
      title: n.title,
      description: n.message,
      timestamp: n.createdAt.toISOString(),
      icon: mapNotifIcon(n.type),
    }));

    return [...auditItems, ...notifItems]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit) as ActivityItem[];
  },
};

function formatAuditAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapAuditIcon(
  action: string,
  entityType: string
): ActivityItem["icon"] {
  if (action === "LOGIN" || action === "LOGOUT") return "login";
  if (entityType.toLowerCase().includes("skill")) return "skill";
  if (entityType.toLowerCase().includes("course")) return "course";
  if (entityType.toLowerCase().includes("assessment")) return "assessment";
  if (entityType.toLowerCase().includes("certificate")) return "certificate";
  return "system";
}

function mapNotifIcon(type: string): ActivityItem["icon"] {
  if (type === "SUCCESS") return "certificate";
  if (type === "ACTION_REQUIRED") return "assessment";
  if (type === "WARNING") return "skill";
  return "system";
}
