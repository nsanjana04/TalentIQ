import type { RoleSlug } from "@/constants/role-slugs";
import { analyticsHubService } from "./analytics-hub.service";
import { dashboardService } from "./dashboard.service";
import type { AnalyticsFilterQuery } from "@/lib/validations/analytics-hub";

/**
 * Unified analytics facade for workforce intelligence KPIs and dashboards.
 * Delegates to analyticsHubService and dashboardService — single import for consumers.
 */
export const analyticsService = {
  getExecutive: analyticsHubService.getExecutive.bind(analyticsHubService),
  getOrganization: analyticsHubService.getOrganization.bind(analyticsHubService),
  getDepartments: analyticsHubService.getDepartments.bind(analyticsHubService),
  getTeams: analyticsHubService.getTeams.bind(analyticsHubService),
  getEmployees: analyticsHubService.getEmployees.bind(analyticsHubService),
  getSkillGaps: analyticsHubService.getSkillGaps.bind(analyticsHubService),
  getLearningProgress: analyticsHubService.getLearningProgress.bind(analyticsHubService),
  getCertificateCompliance: analyticsHubService.getCertificateCompliance.bind(analyticsHubService),

  async getWorkforceKpis(userId: string, role: RoleSlug) {
    const [executive, overview] = await Promise.all([
      analyticsHubService.getExecutive(userId, role),
      dashboardService.getOverview(userId, role),
    ]);

    return {
      workforceHealthScore: executive.workforceHealthScore,
      skillReadiness: overview.skillReadiness.overall,
      learningVelocity: executive.learningVelocity,
      assessmentPassRate: overview.assessments.passRate,
      certificateCompliance: executive.complianceScore,
      skillGapEmployees: overview.skillReadiness.totalSkills - overview.skillReadiness.verifiedCount,
      criticalRiskEmployees: overview.assessments.totalAttempts > 0 && overview.assessments.passRate < 60 ? 1 : 0,
      departmentReadiness: overview.departmentPerformance,
      scopeLabel: overview.scopeLabel,
    };
  },

  async getDepartmentReadiness(userId: string, role: RoleSlug, query: AnalyticsFilterQuery = {}) {
    return analyticsHubService.getDepartments(userId, role, query);
  },

  async getTeamReadiness(userId: string, role: RoleSlug, query: AnalyticsFilterQuery = {}) {
    return analyticsHubService.getTeams(userId, role, query);
  },

  async getRiskEmployees(userId: string, role: RoleSlug, query: AnalyticsFilterQuery = {}) {
    const gaps = await analyticsHubService.getSkillGaps(userId, role, { ...query, view: "employee" });
    return gaps.gapAnalysis.items
      .filter((item) => item.severity === "critical" || item.severity === "moderate")
      .slice(0, 25)
      .map((item) => ({
        id: item.entityId,
        name: item.entityName,
        department: "Unassigned",
        score: Math.max(0, 100 - item.gapPoints * 10),
        skillsMet: 0,
        skillsRequired: item.gapPoints,
        status: item.severity === "critical" ? ("not_ready" as const) : ("developing" as const),
      }));
  },

  async getSkillGapIndex(userId: string, role: RoleSlug) {
    const gaps = await analyticsHubService.getSkillGaps(userId, role, { view: "employee" });
    const total =
      gaps.gapAnalysis.bySeverity.critical +
      gaps.gapAnalysis.bySeverity.moderate +
      gaps.gapAnalysis.bySeverity.minor;
    return {
      index: total,
      bySeverity: gaps.gapAnalysis.bySeverity,
      trend: gaps.trend,
    };
  },
};
