import type { RoleSlug } from "@/constants/role-slugs";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import type { AnalyticsFilterQuery, SkillGapsQuery } from "@/lib/validations/analytics-hub";
import { analyticsHubRepository } from "@/repositories/analytics-hub.repository";
import { skillMatrixRepository } from "@/repositories/skill-matrix.repository";
import { dashboardService } from "@/services/dashboard.service";
import type {
  CertificateComplianceAnalytics,
  DepartmentAnalytics,
  EmployeeAnalytics,
  ExecutiveAnalytics,
  LearningProgressAnalytics,
  OrganizationAnalytics,
  SkillGapsAnalytics,
  TeamAnalytics,
} from "@/types/analytics-hub";

function parseFilters(query: AnalyticsFilterQuery) {
  return {
    departmentId: query.departmentId,
    teamId: query.teamId,
  };
}

export const analyticsHubService = {
  async getExecutive(userId: string, role: RoleSlug): Promise<ExecutiveAnalytics> {
    const overview = await dashboardService.getOverview(userId, role);
    const scope = await resolveDashboardScope(userId, role);
    const compliance = await analyticsHubRepository.getCertificateCompliance(scope, {});
    const learning = overview.learningProgress;

    const workforceHealthScore = Math.round(
      (overview.skillReadiness.overall +
        learning.avgProgress +
        overview.assessments.passRate +
        compliance.complianceRate) /
        4
    );

    const completedThisMonth = learning.trend.at(-1)?.completed ?? 0;
    const enrolledThisMonth = learning.trend.at(-1)?.enrolled ?? 1;
    const learningVelocity = Math.round((completedThisMonth / Math.max(enrolledThisMonth, 1)) * 100);

    return {
      ...overview,
      workforceHealthScore,
      complianceScore: compliance.complianceRate,
      learningVelocity,
    };
  },

  getEmployees(userId: string, role: RoleSlug, query: AnalyticsFilterQuery): Promise<EmployeeAnalytics> {
    return resolveDashboardScope(userId, role).then((scope) =>
      analyticsHubRepository.getEmployeeAnalytics(scope, parseFilters(query))
    );
  },

  getTeams(userId: string, role: RoleSlug, query: AnalyticsFilterQuery): Promise<TeamAnalytics> {
    return resolveDashboardScope(userId, role).then((scope) =>
      analyticsHubRepository.getTeamAnalytics(scope, parseFilters(query))
    );
  },

  getDepartments(userId: string, role: RoleSlug, query: AnalyticsFilterQuery): Promise<DepartmentAnalytics> {
    return resolveDashboardScope(userId, role).then((scope) =>
      analyticsHubRepository.getDepartmentAnalytics(scope, parseFilters(query))
    );
  },

  getOrganization(userId: string, role: RoleSlug): Promise<OrganizationAnalytics> {
    return resolveDashboardScope(userId, role).then((scope) =>
      analyticsHubRepository.getOrganizationAnalytics(scope)
    );
  },

  getLearningProgress(
    userId: string,
    role: RoleSlug,
    query: AnalyticsFilterQuery
  ): Promise<LearningProgressAnalytics> {
    return resolveDashboardScope(userId, role).then((scope) =>
      analyticsHubRepository.getLearningProgressAnalytics(scope, parseFilters(query))
    );
  },

  getCertificateCompliance(
    userId: string,
    role: RoleSlug,
    query: AnalyticsFilterQuery
  ): Promise<CertificateComplianceAnalytics> {
    return resolveDashboardScope(userId, role).then((scope) =>
      analyticsHubRepository.getCertificateCompliance(scope, parseFilters(query))
    );
  },

  async getSkillGaps(userId: string, role: RoleSlug, query: SkillGapsQuery): Promise<SkillGapsAnalytics> {
    const scope = await resolveDashboardScope(userId, role);
    const filters = parseFilters(query);
    const gapAnalysis = await skillMatrixRepository.getGapAnalysis(scope, filters, query.view);

    const severityBySkill = new Map<
      string,
      { critical: number; moderate: number; minor: number }
    >();
    for (const item of gapAnalysis.items) {
      const entry = severityBySkill.get(item.skillName) ?? {
        critical: 0,
        moderate: 0,
        minor: 0,
      };
      entry[item.severity] += 1;
      severityBySkill.set(item.skillName, entry);
    }
    const heatmapPreview = [...severityBySkill.entries()]
      .map(([skill, counts]) => ({ skill, ...counts }))
      .sort(
        (a, b) =>
          b.critical + b.moderate + b.minor - (a.critical + a.moderate + a.minor)
      )
      .slice(0, 10);

    const openGaps =
      gapAnalysis.bySeverity.critical +
      gapAnalysis.bySeverity.moderate +
      gapAnalysis.bySeverity.minor;
    const trend = await analyticsHubRepository.getSkillGapTrend(scope, openGaps);

    return {
      scope: { type: scope.type, label: scope.label },
      gapAnalysis,
      heatmapPreview,
      trend,
    };
  },
};
