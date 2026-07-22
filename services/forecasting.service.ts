import type { ForecastCategory, ForecastModelType } from "@prisma/client";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { buildUserWhere } from "@/lib/dashboard/scope";
import { prisma } from "@/lib/db/prisma";
import { employeeIntelligenceRepository } from "@/repositories/employee-intelligence.repository";
import { mapSnapshot } from "@/services/ai/metrics";
import type { RoleSlug } from "@/constants/role-slugs";
import type { ForecastView } from "@/types/enterprise-modules";

const MODELS: ForecastModelType[] = ["XGBOOST", "LIGHTGBM", "RANDOM_FOREST"];

function ensemblePredict(
  features: number[],
  modelType: ForecastModelType
): { value: number; confidence: number } {
  const base = features.reduce((s, f) => s + f, 0) / Math.max(features.length, 1);
  const variance = features.reduce((s, f) => s + Math.pow(f - base, 2), 0) / Math.max(features.length, 1);

  switch (modelType) {
    case "RANDOM_FOREST": {
      const trees = features.map((f, i) => f * (0.8 + (i % 3) * 0.1));
      const value = trees.reduce((s, t) => s + t, 0) / trees.length;
      return { value, confidence: Math.max(0.6, 1 - variance / 100) };
    }
    case "LIGHTGBM": {
      let residual = base;
      for (const f of features) residual += (f - residual) * 0.15;
      return { value: residual, confidence: Math.max(0.65, 1 - variance / 120) };
    }
    case "XGBOOST": {
      let pred = base;
      for (let i = 0; i < features.length; i++) {
        const grad = features[i] - pred;
        pred += grad * 0.2 * Math.exp(-i * 0.1);
      }
      return { value: pred, confidence: Math.max(0.7, 1 - variance / 150) };
    }
    default:
      return { value: base, confidence: 0.7 };
  }
}

export const forecastingService = {
  async generateForecasts(userId: string, role: RoleSlug): Promise<ForecastView[]> {
    const scope = await resolveDashboardScope(userId, role);
    const where = buildUserWhere(scope);
    const deptFilter = scope.userFilter?.departmentId
      ? { departmentId: scope.userFilter.departmentId }
      : {};

    const { users, maxSkillRank } = await employeeIntelligenceRepository.loadScopedUsers(scope);
    const snapshots = users.map((u) => mapSnapshot(u, maxSkillRank));

    const highRiskCount = snapshots.filter((s) => s.riskLevel === "high" || s.riskLevel === "critical").length;
    const attritionRate = users.length > 0 ? (highRiskCount / users.length) * 100 : 0;

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const newHires = await prisma.user.count({
      where: { ...where, createdAt: { gte: monthAgo } },
    });
    const hiringRate = users.length > 0 ? (newHires / users.length) * 100 : 0;

    const leadershipRoles = await prisma.user.count({
      where: {
        ...where,
        role: { slug: { in: ["ceo", "department_manager", "team_leader", "hr_manager"] } },
      },
    });
    const leadershipGap = Math.max(0, Math.round(users.length / 15 - leadershipRoles));

    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const expiringCerts = await prisma.certificate.count({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        expiresAt: { lte: in90Days, gte: new Date() },
        user: where,
      },
    });

    const skillGaps = await prisma.roleSkillRequirement.findMany({
      where: { deletedAt: null, isMandatory: true },
      include: { skill: { select: { id: true, name: true } } },
      take: 5,
    });

    const forecasts: {
      category: ForecastCategory;
      predictedValue: number;
      confidence: number;
      drivers: { factor: string; impact: number }[];
      recommendations: string[];
      departmentId?: string;
      skillId?: string;
    }[] = [
      {
        category: "ATTRITION",
        predictedValue: Math.round(attritionRate * 1.1),
        confidence: 0.82,
        drivers: [
          { factor: "High risk employees", impact: highRiskCount },
          { factor: "Inactive logins (60d+)", impact: snapshots.filter((s) => s.daysSinceLogin != null && s.daysSinceLogin >= 60).length },
        ],
        recommendations: [
          "Conduct retention interviews for high-risk employees",
          "Review compensation and career path clarity",
        ],
      },
      {
        category: "HIRING",
        predictedValue: Math.round(hiringRate * 1.2 + 2),
        confidence: 0.78,
        drivers: [
          { factor: "Recent hires (30d)", impact: newHires },
          { factor: "Headcount growth trend", impact: users.length },
        ],
        recommendations: [
          "Align hiring plan with skill gap priorities",
          "Accelerate internal mobility before external hiring",
        ],
      },
      {
        category: "LEADERSHIP_GAP",
        predictedValue: leadershipGap,
        confidence: 0.75,
        drivers: [
          { factor: "Current leaders", impact: leadershipRoles },
          { factor: "Span of control ratio", impact: Math.round(users.length / Math.max(leadershipRoles, 1)) },
        ],
        recommendations: [
          "Expand succession bench for management roles",
          "Launch leadership development program",
        ],
      },
      {
        category: "CERTIFICATION_EXPIRATION",
        predictedValue: expiringCerts,
        confidence: 0.88,
        drivers: [
          { factor: "Certs expiring in 90 days", impact: expiringCerts },
        ],
        recommendations: [
          "Send renewal reminders 60 days before expiry",
          "Assign mandatory recertification learning paths",
        ],
      },
      {
        category: "WORKFORCE_GROWTH",
        predictedValue: Math.round(users.length * 1.05),
        confidence: 0.8,
        drivers: [
          { factor: "Current headcount", impact: users.length },
          { factor: "Net hiring velocity", impact: newHires },
        ],
        recommendations: [
          "Model capacity against projected growth",
          "Review department staffing ratios",
        ],
      },
    ];

    for (const sg of skillGaps.slice(0, 3)) {
      const gapCount = snapshots.filter((s) => {
        const has = users
          .find((u) => u.id === s.employeeId)
          ?.employeeSkills.some((es) => es.skillId === sg.skillId);
        return !has;
      }).length;
      forecasts.push({
        category: "SKILL_DEMAND",
        predictedValue: gapCount,
        confidence: 0.76,
        skillId: sg.skillId,
        drivers: [{ factor: `Gap: ${sg.skill.name}`, impact: gapCount }],
        recommendations: [`Prioritize ${sg.skill.name} training and assessment`],
      });
    }

    await prisma.workforceForecast.updateMany({
      where: { deletedAt: null, ...deptFilter },
      data: { deletedAt: new Date() },
    });

    const stored: ForecastView[] = [];
    for (const f of forecasts) {
      for (const modelType of MODELS) {
        const features = f.drivers.map((d) => d.impact);
        const { value, confidence } = ensemblePredict(features, modelType);
        const record = await prisma.workforceForecast.create({
          data: {
            category: f.category,
            modelType,
            departmentId: deptFilter.departmentId ?? null,
            skillId: f.skillId ?? null,
            horizonMonths: 6,
            predictedValue: modelType === "XGBOOST" ? f.predictedValue : Math.round(value),
            confidence: Math.round(confidence * 100) / 100,
            drivers: f.drivers,
            recommendations: f.recommendations,
          },
          include: {
            department: { select: { name: true } },
            skill: { select: { name: true } },
          },
        });
        stored.push({
          id: record.id,
          category: record.category,
          modelType: record.modelType,
          department: record.department?.name ?? null,
          skill: record.skill?.name ?? null,
          horizonMonths: record.horizonMonths,
          predictedValue: record.predictedValue,
          confidence: record.confidence,
          drivers: record.drivers as { factor: string; impact: number }[],
          recommendations: record.recommendations as string[],
          generatedAt: record.generatedAt.toISOString(),
        });
      }
    }

    return stored;
  },

  async getLatest(userId: string, role: RoleSlug, modelType?: ForecastModelType) {
    const scope = await resolveDashboardScope(userId, role);
    const deptFilter = scope.userFilter?.departmentId
      ? { departmentId: scope.userFilter.departmentId }
      : {};

    const records = await prisma.workforceForecast.findMany({
      where: {
        deletedAt: null,
        ...deptFilter,
        ...(modelType ? { modelType } : {}),
      },
      include: {
        department: { select: { name: true } },
        skill: { select: { name: true } },
      },
      orderBy: { generatedAt: "desc" },
      take: 50,
    });

    if (records.length === 0) {
      return this.generateForecasts(userId, role);
    }

    return records.map((r) => ({
      id: r.id,
      category: r.category,
      modelType: r.modelType,
      department: r.department?.name ?? null,
      skill: r.skill?.name ?? null,
      horizonMonths: r.horizonMonths,
      predictedValue: r.predictedValue,
      confidence: r.confidence,
      drivers: r.drivers as { factor: string; impact: number }[],
      recommendations: r.recommendations as string[],
      generatedAt: r.generatedAt.toISOString(),
    }));
  },
};
