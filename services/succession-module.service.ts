import { ROUTES } from "@/constants/routes";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { prisma } from "@/lib/db/prisma";
import type { RoleSlug } from "@/constants/role-slugs";
import type { SuccessionRoleView } from "@/types/enterprise-modules";

export const successionModuleService = {
  async getPlans(userId: string, role: RoleSlug): Promise<SuccessionRoleView[]> {
    const scope = await resolveDashboardScope(userId, role);
    const deptFilter = scope.userFilter?.departmentId
      ? { departmentId: scope.userFilter.departmentId }
      : {};

    const roles = await prisma.criticalRole.findMany({
      where: { deletedAt: null, ...deptFilter },
      include: {
        department: { select: { name: true } },
        holder: { select: { id: true, firstName: true, lastName: true } },
        successors: {
          where: { deletedAt: null },
          include: {
            candidate: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { readinessScore: "desc" },
        },
      },
      orderBy: { riskScore: "desc" },
    });

    return roles.map((r) => {
      const mapCandidate = (s: (typeof r.successors)[0]) => ({
        id: s.id,
        candidateId: s.candidateId,
        name: `${s.candidate.firstName} ${s.candidate.lastName}`,
        readiness: s.readiness,
        readinessScore: s.readinessScore,
        skillGapSummary: s.skillGapSummary,
        profileHref: `${ROUTES.EMPLOYEES}/${s.candidateId}`,
      });

      return {
        id: r.id,
        title: r.title,
        department: r.department?.name ?? null,
        holder: r.holder
          ? { id: r.holder.id, name: `${r.holder.firstName} ${r.holder.lastName}` }
          : null,
        retirementRiskScore: r.retirementRiskScore,
        attritionRiskScore: r.attritionRiskScore,
        benchStrength: r.benchStrength,
        coverageScore: r.coverageScore,
        riskScore: r.riskScore,
        readyNow: r.successors.filter((s) => s.readiness === "READY_NOW").map(mapCandidate),
        ready6Months: r.successors
          .filter((s) => s.readiness === "READY_6_MONTHS")
          .map(mapCandidate),
        ready12Months: r.successors
          .filter((s) => s.readiness === "READY_12_MONTHS")
          .map(mapCandidate),
      };
    });
  },

  async getSummary(userId: string, role: RoleSlug) {
    const plans = await this.getPlans(userId, role);
    const criticalRoles = plans.length;
    const uncovered = plans.filter((p) => p.readyNow.length === 0).length;
    const avgCoverage =
      criticalRoles > 0
        ? Math.round(plans.reduce((s, p) => s + p.coverageScore, 0) / criticalRoles)
        : 0;
    const highRisk = plans.filter((p) => p.riskScore >= 70).length;

    return { criticalRoles, uncovered, avgCoverage, highRisk, plans };
  },
};
