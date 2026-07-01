import type { RoleSlug } from "@/constants/role-slugs";
import { ROUTES } from "@/constants/routes";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { dashboardRepository } from "@/repositories/dashboard.repository";
import { skillMatrixRepository } from "@/repositories/skill-matrix.repository";
import { analyticsHubRepository } from "@/repositories/analytics-hub.repository";
import type { AiInsightsResponse, WorkforceInsight } from "@/types/ai-insights";
import type { CopilotQueryResponse } from "@/types/employee-intelligence";
import { employeeIntelligenceService } from "@/services/employee-intelligence.service";

/**
 * Rule-based workforce insights derived from live database metrics.
 * Structured for future LLM API integration — swap generateInsights implementation.
 */
export const aiInsightsService = {
  async generateInsights(userId: string, role: RoleSlug): Promise<AiInsightsResponse> {
    const scope = await resolveDashboardScope(userId, role);
    const [skillReadiness, learning, assessments, certificates, gaps, compliance] =
      await Promise.all([
        dashboardRepository.getSkillReadiness(scope),
        dashboardRepository.getLearningProgress(scope),
        dashboardRepository.getAssessments(scope),
        dashboardRepository.getCertificates(scope),
        skillMatrixRepository.getGapAnalysis(scope, {}, "employee"),
        analyticsHubRepository.getCertificateCompliance(scope, {}),
      ]);

    const insights: WorkforceInsight[] = [];
    let id = 1;

    const lowCategories = skillReadiness.byCategory.filter((c) => c.readiness < 60);
    if (lowCategories.length > 0) {
      insights.push({
        id: String(id++),
        type: "skill_gap",
        title: `Skill gap in ${lowCategories[0].name}`,
        severity: "high",
        summary: `${lowCategories[0].name} readiness is ${lowCategories[0].readiness}%. Targeted learning paths can close this gap within 60–90 days.`,
        affectedUsers: gaps.bySeverity.critical + gaps.bySeverity.moderate,
        recommendedAction: "Assign skill development programs to affected employees",
        actionHref: `${ROUTES.ANALYTICS}?tab=employee`,
        metadata: { readiness: lowCategories[0].readiness },
      });
    }

    if (certificates.expiringSoon > 0) {
      insights.push({
        id: String(id++),
        type: "certification_risk",
        title: "Certification renewal required",
        severity: certificates.expiringSoon > 5 ? "critical" : "high",
        summary: `${certificates.expiringSoon} certificate(s) expire within 30 days. Schedule renewals to maintain compliance.`,
        affectedUsers: certificates.expiringSoon,
        recommendedAction: "Review expiring certificates and schedule renewal assessments",
        actionHref: ROUTES.CERTIFICATIONS,
        metadata: { expiringSoon: certificates.expiringSoon },
      });
    }

    if (compliance.complianceRate < 85) {
      insights.push({
        id: String(id++),
        type: "compliance_warning",
        title: "Compliance rate below target",
        severity: compliance.complianceRate < 70 ? "critical" : "medium",
        summary: `Organization compliance is at ${compliance.complianceRate}%. Target is 90%+. Focus on departments with expired credentials.`,
        affectedUsers:
          (compliance.byStatus.find((s) => s.status === "EXPIRED")?.count ?? 0) +
          compliance.byTemplate.reduce((sum, t) => sum + t.expiringSoon, 0),
        recommendedAction: "Launch compliance remediation campaign",
        actionHref: `${ROUTES.ANALYTICS}?tab=compliance`,
        metadata: { complianceRate: compliance.complianceRate },
      });
    }

    if (learning.inProgress > learning.completed) {
      insights.push({
        id: String(id++),
        type: "learning_recommendation",
        title: "Accelerate learning completions",
        severity: "medium",
        summary: `${learning.inProgress} enrollments in progress vs ${learning.completed} completed. Average progress is ${learning.avgProgress}%.`,
        affectedUsers: learning.inProgress,
        recommendedAction: "Send learning reminders and manager nudges",
        actionHref: ROUTES.LEARNING,
        metadata: { avgProgress: learning.avgProgress },
      });
    }

    const workforceHealth = Math.round(
      (skillReadiness.overall +
        learning.avgProgress +
        assessments.passRate +
        compliance.complianceRate) /
        4
    );

    insights.push({
      id: String(id++),
      type: "workforce_health",
      title: "Workforce health overview",
      severity: workforceHealth >= 80 ? "info" : workforceHealth >= 60 ? "medium" : "high",
      summary: `Composite workforce health score is ${workforceHealth}/100 based on skills, learning, assessments, and compliance.`,
      affectedUsers: 0,
      recommendedAction: "Open Command Center for full executive briefing",
      actionHref: ROUTES.DASHBOARD,
      metadata: { score: workforceHealth },
    });

    if (assessments.passRate < 75 && assessments.totalAttempts > 0) {
      insights.push({
        id: String(id++),
        type: "skill_gap",
        title: "Assessment pass rate needs attention",
        severity: "high",
        summary: `Current pass rate is ${assessments.passRate}% across ${assessments.totalAttempts} attempts. Review weak topics and assign remedial learning.`,
        affectedUsers: assessments.byStatus.find((s) => s.status === "FAILED")?.count ?? 0,
        recommendedAction: "Analyze failed attempts and recommend courses",
        actionHref: ROUTES.ASSESSMENTS,
        metadata: { passRate: assessments.passRate },
      });
    }

    return {
      insights: insights.slice(0, 12),
      generatedAt: new Date().toISOString(),
      scopeLabel: scope.label,
    };
  },

  /** Employee-level copilot intelligence from live database records */
  async queryInsights(
    userId: string,
    role: RoleSlug,
    query: string
  ): Promise<CopilotQueryResponse> {
    return employeeIntelligenceService.queryCopilot(userId, role, query);
  },
};
