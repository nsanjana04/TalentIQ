import { ROUTES } from "@/constants/routes";
import { dashboardService } from "@/services/dashboard.service";
import { employeeIntelligenceRepository } from "@/repositories/employee-intelligence.repository";
import { mapSnapshot } from "@/services/ai/metrics";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { prisma } from "@/lib/db/prisma";
import type { RoleSlug } from "@/constants/role-slugs";
import type { WarRoomData } from "@/types/enterprise-modules";

export const warRoomService = {
  async getBriefing(userId: string, role: RoleSlug): Promise<WarRoomData> {
    const [overview, scope] = await Promise.all([
      dashboardService.getOverview(userId, role),
      resolveDashboardScope(userId, role),
    ]);

    const { users } = await employeeIntelligenceRepository.loadScopedUsers(scope);
    const snapshots = users.map((u) => mapSnapshot(u, 0));

    const highRisk = snapshots.filter((s) => s.riskLevel === "high").length;
    const critical = snapshots.filter((s) => s.riskLevel === "critical").length;

    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = await prisma.certificate.count({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        expiresAt: { lte: in30Days, gte: new Date() },
        user: { isActive: true, deletedAt: null },
      },
    });

    const nonCompliant = snapshots.filter((s) => {
      if (s.certifications.length === 0) return false;
      const active = s.certifications.filter((c) => c.status === "ACTIVE").length;
      return (active / s.certifications.length) * 100 < 80;
    }).length;

    const complianceRate =
      overview.certificates.total > 0
        ? Math.round((overview.certificates.active / overview.certificates.total) * 100)
        : 0;

    const leadershipHealth = Math.round(
      (overview.skillReadiness.overall + overview.learningProgress.avgProgress + complianceRate) / 3
    );

    const criticalAlerts: WarRoomData["criticalAlerts"] = [];
    if (expiringSoon > 0) {
      criticalAlerts.push({
        title: "Certification renewals",
        message: `${expiringSoon} certificate(s) expiring within 30 days`,
        severity: "medium",
        href: ROUTES.CERTIFICATIONS,
      });
    }
    if (critical > 0) {
      criticalAlerts.push({
        title: "Attrition risk",
        message: `${critical} employee(s) at critical attrition risk`,
        severity: "critical",
        href: `${"/dashboard"}?tab=employee`,
      });
    }
    if (overview.learningProgress.dropped > 0) {
      criticalAlerts.push({
        title: "Learning drop-offs",
        message: `${overview.learningProgress.dropped} enrollment(s) dropped or stalled`,
        severity: "high",
        href: ROUTES.LEARNING,
      });
    }

    return {
      scopeLabel: scope.label,
      topRisks: [
        {
          label: "Attrition",
          severity: "high",
          count: highRisk + critical,
          href: `${"/dashboard"}?tab=employee`,
        },
        {
          label: "Compliance",
          severity: "medium",
          count: nonCompliant,
          href: `${"/dashboard"}?tab=compliance`,
        },
        {
          label: "Learning",
          severity: "medium",
          count: overview.learningProgress.inProgress,
          href: ROUTES.LEARNING,
        },
        {
          label: "Certifications",
          severity: "low",
          count: expiringSoon,
          href: ROUTES.CERTIFICATIONS,
        },
      ],
      complianceRisks: { expiringSoon, nonCompliant },
      attritionRisks: { highRisk, critical },
      learningRisks: {
        overdue: overview.learningProgress.dropped,
        inProgress: overview.learningProgress.inProgress,
        avgProgress: overview.learningProgress.avgProgress,
      },
      leadershipHealth,
      criticalAlerts,
    };
  },
};

