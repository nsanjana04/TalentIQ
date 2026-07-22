import type { RoleSlug } from "@/constants/role-slugs";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { dashboardRepository } from "@/repositories/dashboard.repository";
import type { AiRecommendation, DashboardOverview } from "@/types/dashboard";

function buildAiRecommendations(data: {
  skillReadiness: Awaited<ReturnType<typeof dashboardRepository.getSkillReadiness>>;
  learningProgress: Awaited<ReturnType<typeof dashboardRepository.getLearningProgress>>;
  assessments: Awaited<ReturnType<typeof dashboardRepository.getAssessments>>;
  certificates: Awaited<ReturnType<typeof dashboardRepository.getCertificates>>;
  departmentPerformance: Awaited<ReturnType<typeof dashboardRepository.getDepartmentPerformance>>;
}): AiRecommendation[] {
  const recs: AiRecommendation[] = [];
  let id = 1;

  const lowCategories = data.skillReadiness.byCategory.filter((c) => c.readiness < 60);
  if (lowCategories.length > 0) {
    recs.push({
      id: String(id++),
      priority: "high",
      title: `Close skill gaps in ${lowCategories[0].name}`,
      description: `${lowCategories[0].name} readiness is at ${lowCategories[0].readiness}%. Assign targeted learning paths to improve team capability.`,
      action: "View Skills",
      metric: `${lowCategories[0].readiness}% readiness`,
    });
  }

  if (data.learningProgress.inProgress > data.learningProgress.completed) {
    recs.push({
      id: String(id++),
      priority: "medium",
      title: "Accelerate course completions",
      description: `${data.learningProgress.inProgress} enrollments are in progress vs ${data.learningProgress.completed} completed. Send reminders to boost completion rates.`,
      action: "View Learning",
      metric: `${data.learningProgress.avgProgress}% avg progress`,
    });
  }

  if (data.assessments.passRate < 75 && data.assessments.totalAttempts > 0) {
    recs.push({
      id: String(id++),
      priority: "high",
      title: "Improve assessment pass rates",
      description: `Current pass rate is ${data.assessments.passRate}%. Review failed attempts and provide supplemental training before re-assessment.`,
      action: "View Assessments",
      metric: `${data.assessments.passRate}% pass rate`,
    });
  }

  if (data.certificates.expiringSoon > 0) {
    recs.push({
      id: String(id++),
      priority: "medium",
      title: "Renew expiring certificates",
      description: `${data.certificates.expiringSoon} certificate(s) expire within 30 days. Schedule renewal assessments to maintain compliance.`,
      action: "View Certifications",
      metric: `${data.certificates.expiringSoon} expiring`,
    });
  }

  const weakestDept = [...data.departmentPerformance].sort(
    (a, b) => a.skillReadiness - b.skillReadiness
  )[0];
  if (weakestDept && weakestDept.skillReadiness < 70) {
    recs.push({
      id: String(id++),
      priority: "low",
      title: `Boost ${weakestDept.name} department performance`,
      description: `${weakestDept.name} has the lowest skill readiness at ${weakestDept.skillReadiness}%. Consider cross-team mentoring and skill workshops.`,
      metric: `${weakestDept.employees} employees`,
    });
  }

  if (data.skillReadiness.verifiedCount < data.skillReadiness.totalSkills * 0.5) {
    recs.push({
      id: String(id++),
      priority: "low",
      title: "Increase skill verification",
      description: `Only ${data.skillReadiness.verifiedCount} of ${data.skillReadiness.totalSkills} skills are verified. Schedule manager-led skill assessments.`,
      metric: `${Math.round((data.skillReadiness.verifiedCount / Math.max(data.skillReadiness.totalSkills, 1)) * 100)}% verified`,
    });
  }

  return recs.slice(0, 5);
}

export const dashboardService = {
  async getOverview(userId: string, role: RoleSlug): Promise<DashboardOverview> {
    const scope = await resolveDashboardScope(userId, role);
    const scopedUserIds = scope.userFilter
      ? await dashboardRepository.resolveScopedUserIds(scope)
      : undefined;

    const [
      employees,
      skillReadiness,
      learningProgress,
      assessments,
      certificates,
      departmentPerformance,
      recentActivity,
    ] = await Promise.all([
      dashboardRepository.countEmployees(scope),
      dashboardRepository.getSkillReadiness(scope, scopedUserIds),
      dashboardRepository.getLearningProgress(scope, scopedUserIds),
      dashboardRepository.getAssessments(scope, scopedUserIds),
      dashboardRepository.getCertificates(scope, scopedUserIds),
      dashboardRepository.getDepartmentPerformance(scope),
      dashboardRepository.getRecentActivity(scope, 12, scopedUserIds),
    ]);

    const aiRecommendations = buildAiRecommendations({
      skillReadiness,
      learningProgress,
      assessments,
      certificates,
      departmentPerformance,
    });

    return {
      scope: scope.type,
      scopeLabel: scope.label,
      totalEmployees: {
        value: employees.total,
        change: employees.createdThisMonth,
        changeLabel: "new this month",
      },
      activeEmployees: {
        value: employees.active,
        change:
          employees.total > 0
            ? Math.round((employees.active / employees.total) * 100)
            : 0,
        changeLabel: "active rate",
      },
      skillReadiness,
      learningProgress,
      assessments,
      certificates,
      departmentPerformance,
      recentActivity,
      aiRecommendations,
    };
  },
};
