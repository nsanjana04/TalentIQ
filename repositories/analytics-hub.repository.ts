import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DashboardScope } from "@/lib/dashboard/scope";
import { buildUserWhere } from "@/lib/dashboard/scope";
import { dashboardRepository } from "@/repositories/dashboard.repository";
import type {
  AnalyticsFilters,
  CertificateComplianceAnalytics,
  DepartmentAnalytics,
  EmployeeAnalytics,
  EmployeeAnalyticsItem,
  LearningProgressAnalytics,
  OrganizationAnalytics,
  TeamAnalytics,
} from "@/types/analytics-hub";

const CHART_COLORS = [
  "oklch(45% 0.2 264)",
  "oklch(55% 0.15 145)",
  "oklch(70% 0.15 75)",
  "oklch(55% 0.22 25)",
  "oklch(55% 0.18 300)",
  "oklch(65% 0.12 200)",
];

function monthsBack(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("en-US", { month: "short" }));
  }
  return months;
}

type UserWithMetrics = Prisma.UserGetPayload<{
  include: {
    department: { select: { name: true } };
    team: { select: { name: true } };
    jobRole: {
      include: {
        skillRequirements: {
          where: { isMandatory: true; deletedAt: null };
          include: { requiredSkillLevel: true };
        };
      };
    };
    employeeSkills: { include: { skillLevel: true } };
    enrollments: { where: { deletedAt: null } };
    assessmentAttempts: { where: { deletedAt: null } };
    certificates: { where: { deletedAt: null } };
  };
}>;

function computeUserMetrics(user: UserWithMetrics, maxSkillRank: number) {
  const skills = user.employeeSkills;
  const skillReadiness =
    skills.length > 0
      ? Math.round(
          skills.reduce((s, es) => s + (es.skillLevel.rank / maxSkillRank) * 100, 0) /
            skills.length
        )
      : 0;

  const enrollments = user.enrollments;
  const learningProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
      : 0;

  const attempts = user.assessmentAttempts;
  const passed = attempts.filter((a) => a.status === "PASSED").length;
  const assessmentPassRate =
    attempts.length > 0 ? Math.round((passed / attempts.length) * 100) : 0;

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const certs = user.certificates;
  const activeCerts = certs.filter(
    (c) => c.status === "ACTIVE" && (!c.expiresAt || c.expiresAt > now)
  ).length;
  const certCompliance =
    certs.length > 0 ? Math.round((activeCerts / certs.length) * 100) : 100;

  const requirements = user.jobRole?.skillRequirements ?? [];
  let promotionScore = 0;
  let promotionStatus: EmployeeAnalyticsItem["promotionStatus"] = "developing";

  if (requirements.length > 0) {
    const skillMap = new Map(
      skills.map((es) => [es.skillId, es.skillLevel.rank])
    );
    let met = 0;
    for (const req of requirements) {
      const actual = skillMap.get(req.skillId) ?? 0;
      if (actual >= req.requiredSkillLevel.rank) met += 1;
    }
    promotionScore = Math.round((met / requirements.length) * 100);
    if (promotionScore >= 80) promotionStatus = "ready";
    else if (promotionScore < 50) promotionStatus = "not_ready";
  }

  return {
    skillReadiness,
    learningProgress,
    assessmentPassRate,
    certCompliance,
    promotionScore,
    promotionStatus,
    activeCerts,
    expiringSoon: certs.filter(
      (c) => c.expiresAt && c.expiresAt > now && c.expiresAt <= in30Days
    ).length,
  };
}

async function loadUsersWithMetrics(
  scope: DashboardScope,
  filters: AnalyticsFilters
): Promise<{ users: UserWithMetrics[]; maxSkillRank: number }> {
  const where = buildUserWhere(scope) as Prisma.UserWhereInput;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.teamId) where.teamId = filters.teamId;

  const [users, skillLevels] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        department: { select: { name: true } },
        team: { select: { name: true } },
        jobRole: {
          include: {
            skillRequirements: {
              where: { isMandatory: true, deletedAt: null },
              include: { requiredSkillLevel: true },
            },
          },
        },
        employeeSkills: { include: { skillLevel: true } },
        enrollments: { where: { deletedAt: null } },
        assessmentAttempts: { where: { deletedAt: null } },
        certificates: { where: { deletedAt: null } },
      },
      orderBy: { firstName: "asc" },
    }),
    prisma.skillLevel.findMany({ orderBy: { rank: "asc" } }),
  ]);

  const maxSkillRank = Math.max(...skillLevels.map((l) => l.rank), 4);
  return { users, maxSkillRank };
}

function scopeMeta(scope: DashboardScope) {
  return { type: scope.type, label: scope.label };
}

export const analyticsHubRepository = {
  async getEmployeeAnalytics(
    scope: DashboardScope,
    filters: AnalyticsFilters
  ): Promise<EmployeeAnalytics> {
    const { users, maxSkillRank } = await loadUsersWithMetrics(scope, filters);

    const items: EmployeeAnalyticsItem[] = users.map((u) => {
      const m = computeUserMetrics(u, maxSkillRank);
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        department: u.department?.name ?? null,
        team: u.team?.name ?? null,
        jobRole: u.jobRole?.title ?? null,
        ...m,
      };
    });

    const avg = (arr: number[]) =>
      arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

    const readinessBuckets = [
      { range: "0-25%", min: 0, max: 25, fill: CHART_COLORS[3] },
      { range: "26-50%", min: 26, max: 50, fill: CHART_COLORS[2] },
      { range: "51-75%", min: 51, max: 75, fill: CHART_COLORS[4] },
      { range: "76-100%", min: 76, max: 100, fill: CHART_COLORS[1] },
    ];

    const readinessDistribution = readinessBuckets.map((b) => ({
      range: b.range,
      count: items.filter((i) => i.skillReadiness >= b.min && i.skillReadiness <= b.max).length,
      fill: b.fill,
    }));

    const deptMap = new Map<string, { total: number; sum: number; count: number }>();
    for (const item of items) {
      const dept = item.department ?? "Unassigned";
      const existing = deptMap.get(dept) ?? { total: 0, sum: 0, count: 0 };
      existing.sum += item.skillReadiness;
      existing.count += 1;
      existing.total += 1;
      deptMap.set(dept, existing);
    }

    const byDepartment = [...deptMap.entries()]
      .map(([name, data]) => ({
        name,
        avgReadiness: Math.round(data.sum / data.count),
        employees: data.total,
      }))
      .sort((a, b) => b.avgReadiness - a.avgReadiness);

    const topPerformers = [...items]
      .sort((a, b) => b.skillReadiness - a.skillReadiness)
      .slice(0, 8)
      .map((i) => ({ name: i.name, score: i.skillReadiness }));

    return {
      scope: scopeMeta(scope),
      summary: [
        { label: "Employees", value: items.length },
        { label: "Avg Readiness", value: avg(items.map((i) => i.skillReadiness)), unit: "%" },
        { label: "Avg Compliance", value: avg(items.map((i) => i.certCompliance)), unit: "%" },
        { label: "Avg Learning", value: avg(items.map((i) => i.learningProgress)), unit: "%" },
      ],
      items,
      readinessDistribution,
      topPerformers,
      byDepartment,
    };
  },

  async getTeamAnalytics(
    scope: DashboardScope,
    filters: AnalyticsFilters
  ): Promise<TeamAnalytics> {
    const teamWhere: Prisma.TeamWhereInput = { deletedAt: null };
    if (scope.userFilter?.departmentId) teamWhere.departmentId = scope.userFilter.departmentId;
    if (filters.departmentId) teamWhere.departmentId = filters.departmentId;
    if (filters.teamId) teamWhere.id = filters.teamId;

    const teams = await prisma.team.findMany({
      where: teamWhere,
      include: {
        department: { select: { name: true } },
        members: {
          where: { isActive: true, deletedAt: null },
          include: {
            jobRole: {
              include: {
                skillRequirements: {
                  where: { isMandatory: true, deletedAt: null },
                  include: { requiredSkillLevel: true },
                },
              },
            },
            employeeSkills: { include: { skillLevel: true } },
            enrollments: { where: { deletedAt: null } },
            assessmentAttempts: { where: { deletedAt: null } },
            certificates: { where: { deletedAt: null } },
          },
        },
      },
    });

    const skillLevels = await prisma.skillLevel.findMany({ orderBy: { rank: "asc" } });
    const maxSkillRank = Math.max(...skillLevels.map((l) => l.rank), 4);

    const items = teams.map((team) => {
      const metrics = team.members.map((m) => computeUserMetrics(m as UserWithMetrics, maxSkillRank));
      const avg = (arr: number[]) =>
        arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

      return {
        id: team.id,
        name: team.name,
        department: team.department.name,
        members: team.members.length,
        skillReadiness: avg(metrics.map((m) => m.skillReadiness)),
        learningProgress: avg(metrics.map((m) => m.learningProgress)),
        assessmentPassRate: avg(metrics.map((m) => m.assessmentPassRate)),
        certCompliance: avg(metrics.map((m) => m.certCompliance)),
        promotionReady: metrics.filter((m) => m.promotionStatus === "ready").length,
      };
    });

    const comparison = items.slice(0, 8).map((t) => ({
      name: t.name.length > 12 ? `${t.name.slice(0, 12)}…` : t.name,
      readiness: t.skillReadiness,
      learning: t.learningProgress,
      assessments: t.assessmentPassRate,
      compliance: t.certCompliance,
    }));

    const avgMetrics = (key: keyof (typeof items)[0]) => {
      const vals = items.map((i) => i[key] as number);
      return vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
    };

    return {
      scope: scopeMeta(scope),
      summary: [
        { label: "Teams", value: items.length },
        { label: "Avg Readiness", value: avgMetrics("skillReadiness"), unit: "%" },
        { label: "Avg Learning", value: avgMetrics("learningProgress"), unit: "%" },
        { label: "Promotion Ready", value: items.reduce((s, t) => s + t.promotionReady, 0) },
      ],
      items,
      comparison,
      radarMetrics: [
        { metric: "Skills", value: avgMetrics("skillReadiness") },
        { metric: "Learning", value: avgMetrics("learningProgress") },
        { metric: "Assessments", value: avgMetrics("assessmentPassRate") },
        { metric: "Compliance", value: avgMetrics("certCompliance") },
        { metric: "Promotion", value: items.length > 0 ? Math.round((items.reduce((s, t) => s + t.promotionReady, 0) / items.reduce((s, t) => s + t.members, 0)) * 100) : 0 },
      ],
    };
  },

  async getDepartmentAnalytics(
    scope: DashboardScope,
    filters: AnalyticsFilters
  ): Promise<DepartmentAnalytics> {
    const deptWhere: Prisma.DepartmentWhereInput = { deletedAt: null };
    if (scope.userFilter?.departmentId) deptWhere.id = scope.userFilter.departmentId;
    if (filters.departmentId) deptWhere.id = filters.departmentId;

    const departments = await prisma.department.findMany({
      where: deptWhere,
      include: {
        teams: { where: { deletedAt: null }, select: { id: true } },
        users: {
          where: { isActive: true, deletedAt: null },
          include: {
            jobRole: {
              include: {
                skillRequirements: {
                  where: { isMandatory: true, deletedAt: null },
                  include: { requiredSkillLevel: true },
                },
              },
            },
            employeeSkills: { include: { skillLevel: true } },
            enrollments: { where: { deletedAt: null } },
            assessmentAttempts: { where: { deletedAt: null } },
            certificates: { where: { deletedAt: null } },
          },
        },
      },
    });

    const skillLevels = await prisma.skillLevel.findMany({ orderBy: { rank: "asc" } });
    const maxSkillRank = Math.max(...skillLevels.map((l) => l.rank), 4);

    const items = departments.map((dept) => {
      const metrics = dept.users.map((u) => computeUserMetrics(u as UserWithMetrics, maxSkillRank));
      const avg = (arr: number[]) =>
        arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        employees: dept.users.length,
        teams: dept.teams.length,
        skillReadiness: avg(metrics.map((m) => m.skillReadiness)),
        learningProgress: avg(metrics.map((m) => m.learningProgress)),
        assessmentPassRate: avg(metrics.map((m) => m.assessmentPassRate)),
        certCompliance: avg(metrics.map((m) => m.certCompliance)),
        promotionReady: metrics.filter((m) => m.promotionStatus === "ready").length,
      };
    });

    const monthLabels = monthsBack(6);
    const allUsers = await prisma.user.findMany({
      where: buildUserWhere(scope),
      select: { createdAt: true },
    });
    const headcountTrend = monthLabels.map((month, idx) => {
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() - (5 - idx));
      monthEnd.setDate(28);
      monthEnd.setHours(23, 59, 59, 999);
      const countAtMonth = allUsers.filter((u) => u.createdAt <= monthEnd).length;
      return {
        month,
        employees: countAtMonth || items.reduce((s, d) => s + d.employees, 0),
      };
    });

    return {
      scope: scopeMeta(scope),
      summary: [
        { label: "Departments", value: items.length },
        { label: "Total Employees", value: items.reduce((s, d) => s + d.employees, 0) },
        { label: "Avg Readiness", value: items.length > 0 ? Math.round(items.reduce((s, d) => s + d.skillReadiness, 0) / items.length) : 0, unit: "%" },
        { label: "Promotion Ready", value: items.reduce((s, d) => s + d.promotionReady, 0) },
      ],
      items,
      performanceMatrix: items.map((d) => ({
        name: d.name,
        skillReadiness: d.skillReadiness,
        learningProgress: d.learningProgress,
        assessmentPassRate: d.assessmentPassRate,
        certCompliance: d.certCompliance,
      })),
      headcountTrend,
    };
  },

  async getOrganizationAnalytics(scope: DashboardScope): Promise<OrganizationAnalytics> {
    const [deptAnalytics, learning, certs, employees] = await Promise.all([
      this.getDepartmentAnalytics(scope, {}),
      dashboardRepository.getLearningProgress(scope),
      dashboardRepository.getCertificates(scope),
      dashboardRepository.countEmployees(scope),
    ]);

    const headcountByDepartment = deptAnalytics.items.map((d, i) => ({
      name: d.name,
      count: d.employees,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    const avgReadiness =
      deptAnalytics.items.length > 0
        ? Math.round(
            deptAnalytics.items.reduce((s, d) => s + d.skillReadiness, 0) /
              deptAnalytics.items.length
          )
        : 0;

    const monthLabels = monthsBack(6);
    const allUsers = await prisma.user.findMany({
      where: buildUserWhere(scope),
      select: { createdAt: true },
    });
    const growthTrend = monthLabels.map((month, idx) => {
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() - (5 - idx));
      monthEnd.setDate(28);
      const countAtMonth = allUsers.filter((u) => u.createdAt <= monthEnd).length;
      return {
        month,
        employees: countAtMonth || employees.total,
        completions: learning.trend.find((t) => t.month === month)?.completed ?? 0,
        certifications: certs.trend.find((t) => t.month === month)?.issued ?? 0,
      };
    });

    return {
      scope: scopeMeta(scope),
      summary: [
        { label: "Total Employees", value: employees.total },
        { label: "Active (30d)", value: employees.active },
        { label: "Departments", value: deptAnalytics.items.length },
        { label: "Org Readiness", value: avgReadiness, unit: "%" },
      ],
      headcountByDepartment,
      workforceHealth: [
        { dimension: "Skills", score: avgReadiness, target: 80 },
        { dimension: "Learning", score: learning.avgProgress, target: 75 },
        { dimension: "Assessments", score: (await dashboardRepository.getAssessments(scope)).passRate, target: 80 },
        { dimension: "Certificates", score: certs.total > 0 ? Math.round((certs.active / certs.total) * 100) : 100, target: 95 },
      ],
      crossFunctional: deptAnalytics.performanceMatrix.map((d) => ({
        department: d.name,
        skillReadiness: d.skillReadiness,
        learningProgress: d.learningProgress,
        assessmentPassRate: d.assessmentPassRate,
      })),
      growthTrend,
    };
  },

  async getLearningProgressAnalytics(
    scope: DashboardScope,
    filters: AnalyticsFilters
  ): Promise<LearningProgressAnalytics> {
    const { users } = await loadUsersWithMetrics(scope, filters);
    const enrollments = users.flatMap((u) =>
      u.enrollments.map((e) => ({
        ...e,
        department: u.department?.name ?? "Unassigned",
      }))
    );

    const enrolled = enrollments.length;
    const inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS").length;
    const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
    const dropped = enrollments.filter((e) => e.status === "DROPPED").length;
    const avgProgress =
      enrolled > 0
        ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrolled)
        : 0;

    const courseMap = new Map<string, { enrollments: number; completions: number; totalProgress: number }>();
    for (const e of enrollments) {
      const key = e.courseId;
      const existing = courseMap.get(key) ?? { enrollments: 0, completions: 0, totalProgress: 0 };
      existing.enrollments += 1;
      existing.totalProgress += e.progress;
      if (e.status === "COMPLETED") existing.completions += 1;
      courseMap.set(key, existing);
    }

    const courses = await prisma.course.findMany({
      where: { id: { in: [...courseMap.keys()] } },
      select: { id: true, title: true },
    });
    const courseTitle = new Map(courses.map((c) => [c.id, c.title]));

    const byCourse = [...courseMap.entries()]
      .map(([id, data]) => ({
        name: courseTitle.get(id) ?? "Unknown",
        enrollments: data.enrollments,
        completions: data.completions,
        avgProgress: Math.round(data.totalProgress / data.enrollments),
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 8);

    const deptMap = new Map<string, { enrolled: number; completed: number; totalProgress: number }>();
    for (const e of enrollments) {
      const existing = deptMap.get(e.department) ?? { enrolled: 0, completed: 0, totalProgress: 0 };
      existing.enrolled += 1;
      existing.totalProgress += e.progress;
      if (e.status === "COMPLETED") existing.completed += 1;
      deptMap.set(e.department, existing);
    }

    const byDepartment = [...deptMap.entries()]
      .map(([name, data]) => ({
        name,
        enrolled: data.enrolled,
        completed: data.completed,
        avgProgress: Math.round(data.totalProgress / data.enrolled),
      }))
      .sort((a, b) => b.enrolled - a.enrolled);

    const monthLabels = monthsBack(6);
    const trend = monthLabels.map((month) => {
      const monthEnrollments = enrollments.filter(
        (e) => e.enrolledAt.toLocaleString("en-US", { month: "short" }) === month
      );
      const monthCompleted = enrollments.filter(
        (e) => e.completedAt?.toLocaleString("en-US", { month: "short" }) === month
      );
      const progress =
        monthEnrollments.length > 0
          ? Math.round(monthEnrollments.reduce((s, e) => s + e.progress, 0) / monthEnrollments.length)
          : avgProgress;
      return {
        month,
        enrolled: monthEnrollments.length,
        completed: monthCompleted.length,
        avgProgress: progress,
      };
    });

    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        deletedAt: null,
        userId: { in: users.map((u) => u.id) },
      },
      select: { timeSpentMinutes: true, updatedAt: true },
    });

    const timeSpent = monthLabels.map((month) => ({
      month,
      hours: Math.round(
        lessonProgress
          .filter((lp) => lp.updatedAt.toLocaleString("en-US", { month: "short" }) === month)
          .reduce((s, lp) => s + (lp.timeSpentMinutes ?? 0), 0) / 60
      ),
    }));

    return {
      scope: scopeMeta(scope),
      summary: [
        { label: "Enrolled", value: enrolled },
        { label: "In Progress", value: inProgress },
        { label: "Completed", value: completed },
        { label: "Avg Progress", value: avgProgress, unit: "%" },
      ],
      funnel: [
        { stage: "Enrolled", count: enrolled, fill: CHART_COLORS[0] },
        { stage: "In Progress", count: inProgress, fill: CHART_COLORS[4] },
        { stage: "Completed", count: completed, fill: CHART_COLORS[1] },
        { stage: "Dropped", count: dropped, fill: CHART_COLORS[3] },
      ],
      byDepartment,
      byCourse,
      trend,
      timeSpent,
    };
  },

  async getCertificateCompliance(
    scope: DashboardScope,
    filters: AnalyticsFilters
  ): Promise<CertificateComplianceAnalytics> {
    const { users } = await loadUsersWithMetrics(scope, filters);
    const certs = users.flatMap((u) =>
      u.certificates.map((c) => ({
        ...c,
        userName: `${u.firstName} ${u.lastName}`,
        department: u.department?.name ?? "Unassigned",
        templateName: "",
      }))
    );

    const templates = await prisma.certificateTemplate.findMany({
      where: { id: { in: [...new Set(certs.map((c) => c.templateId))] } },
      select: { id: true, name: true },
    });
    const templateName = new Map(templates.map((t) => [t.id, t.name]));

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const enriched = certs.map((c) => ({
      ...c,
      templateName: templateName.get(c.templateId) ?? "Unknown",
    }));

    const active = enriched.filter((c) => c.status === "ACTIVE" && (!c.expiresAt || c.expiresAt > now)).length;
    const complianceRate = enriched.length > 0 ? Math.round((active / enriched.length) * 100) : 100;

    const statusCounts = ["ACTIVE", "EXPIRED", "REVOKED", "RENEWED"] as const;
    const byStatus = statusCounts.map((status, i) => ({
      status,
      count: enriched.filter((c) => c.status === status).length,
      fill: CHART_COLORS[i],
    }));

    const deptMap = new Map<string, { compliant: number; total: number }>();
    for (const c of enriched) {
      const existing = deptMap.get(c.department) ?? { compliant: 0, total: 0 };
      existing.total += 1;
      if (c.status === "ACTIVE" && (!c.expiresAt || c.expiresAt > now)) existing.compliant += 1;
      deptMap.set(c.department, existing);
    }

    const byDepartment = [...deptMap.entries()]
      .map(([name, data]) => ({
        name,
        compliant: data.compliant,
        total: data.total,
        rate: Math.round((data.compliant / data.total) * 100),
      }))
      .sort((a, b) => a.rate - b.rate);

    const templateMap = new Map<string, { active: number; expired: number; expiringSoon: number }>();
    for (const c of enriched) {
      const existing = templateMap.get(c.templateName) ?? { active: 0, expired: 0, expiringSoon: 0 };
      if (c.status === "ACTIVE" && (!c.expiresAt || c.expiresAt > now)) {
        if (c.expiresAt && c.expiresAt <= in30Days) existing.expiringSoon += 1;
        else existing.active += 1;
      } else if (c.status === "EXPIRED") {
        existing.expired += 1;
      }
      templateMap.set(c.templateName, existing);
    }

    const byTemplate = [...templateMap.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.active - a.active);

    const nonCompliant = enriched
      .filter((c) => c.status !== "ACTIVE" || (c.expiresAt && c.expiresAt <= now))
      .slice(0, 20)
      .map((c) => ({
        userName: c.userName,
        department: c.department,
        templateName: c.templateName,
        status: c.status,
        expiresAt: c.expiresAt?.toISOString() ?? null,
      }));

    const monthLabels = monthsBack(6);
    const trend = monthLabels.map((month) => ({
      month,
      issued: enriched.filter((c) => c.issuedAt.toLocaleString("en-US", { month: "short" }) === month).length,
      renewed: enriched.filter((c) => c.renewedAt?.toLocaleString("en-US", { month: "short" }) === month).length,
      expired: enriched.filter((c) => c.status === "EXPIRED" && c.expiresAt?.toLocaleString("en-US", { month: "short" }) === month).length,
    }));

    return {
      scope: scopeMeta(scope),
      summary: [
        { label: "Total Certificates", value: enriched.length },
        { label: "Compliance Rate", value: complianceRate, unit: "%" },
        { label: "Active", value: active },
        { label: "Non-Compliant", value: nonCompliant.length },
      ],
      complianceRate,
      byStatus,
      byDepartment,
      byTemplate,
      nonCompliant,
      trend,
    };
  },

  async getSkillGapTrend(scope: DashboardScope, openGaps: number) {
    const monthLabels = monthsBack(6);
    const users = await prisma.user.findMany({
      where: buildUserWhere(scope),
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    const acquiredSkills = await prisma.employeeSkill.findMany({
      where: { userId: { in: userIds }, deletedAt: null },
      select: { createdAt: true },
    });

    return monthLabels.map((month, idx) => {
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() - (5 - idx));
      monthEnd.setDate(28);
      monthEnd.setHours(23, 59, 59, 999);

      const closedInMonth = acquiredSkills.filter(
        (s) => s.createdAt.toLocaleString("en-US", { month: "short" }) === month
      ).length;
      const acquiredAfterMonth = acquiredSkills.filter((s) => s.createdAt > monthEnd).length;

      return {
        month,
        gaps: openGaps + acquiredAfterMonth,
        closed: closedInMonth,
      };
    });
  },
};
