import type { RoleSlug } from "@/constants/role-slugs";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import {
  checkCopilotIntentAccess,
  getCopilotIntentRule,
  resolveCopilotIntent,
} from "@/lib/rbac/copilot-intent-permissions";
import {
  employeeIntelligenceRepository,
  type IntelUserRecord,
} from "@/repositories/employee-intelligence.repository";
import type { CopilotQueryResponse, Employee360Profile } from "@/types/employee-intelligence";
import { lrsService } from "@/services/lrs.service";
import { rbacService } from "@/services/rbac.service";
import { userRepository } from "@/repositories/user.repository";
import {
  buildCopilotContext,
  executeCopilotQuery,
} from "@/services/ai/copilot-engine";
import { classifyIntent } from "@/services/ai/intent-classifier";
import {
  BASE_SOURCES,
  computeDataSourceCounts,
  confidenceFor,
  mapSnapshot,
} from "@/services/ai/metrics";

function buildCopilotDeniedResponse(
  query: string,
  intent: ReturnType<typeof resolveCopilotIntent>,
  scopeLabel: string
): CopilotQueryResponse {
  const rule = getCopilotIntentRule(intent);
  const headline = "You do not have permission to view this insight.";
  const narrative = `${headline} Required permission: ${rule.label}. You can request access from the forbidden page or contact your administrator.`;

  return {
    query,
    scopeLabel,
    intent: intent === "audit_query" ? "workforce_health" : intent,
    headline,
    narrative,
    structured: {
      executiveSummary: headline,
      keyFindings: [`Required permission: ${rule.label}`],
      affectedEmployees: [],
      recommendedActions: [
        "Request access from the forbidden page or contact your administrator.",
      ],
      riskLevel: "medium",
      confidenceScore: 0,
      dataSources: BASE_SOURCES,
      recordCounts: {
        employees: 0,
        performanceReviews: 0,
        certifications: 0,
        skillRecords: 0,
        enrollments: 0,
      },
    },
    cards: [],
    rankedEmployees: [],
    drillDown: { type: "organization", id: "denied", label: scopeLabel },
    generatedAt: new Date().toISOString(),
    dataSources: {
      employees: 0,
      performanceReviews: 0,
      certifications: 0,
      skillRecords: 0,
      enrollments: 0,
    },
    confidence: 0,
  };
}

export const employeeIntelligenceService = {
  async loadCatalog(userId: string, role: RoleSlug) {
    const scope = await resolveDashboardScope(userId, role);
    const { users, maxSkillRank } = await employeeIntelligenceRepository.loadScopedUsers(scope);
    const snapshots = users.map((u) => mapSnapshot(u, maxSkillRank));
    return { scope, snapshots, users, maxSkillRank };
  },

  async getEmployee360(userId: string, role: RoleSlug, employeeId: string): Promise<Employee360Profile> {
    const record = await employeeIntelligenceRepository.findUserById(employeeId);
    if (!record) throw new Error("Employee not found");

    const user = record.user as IntelUserRecord;
    const snapshot = mapSnapshot(user, record.maxSkillRank);
    const dataSources = computeDataSourceCounts([user]);
    const successionScore = Math.round(snapshot.promotionScore * 0.6 + snapshot.readinessScore * 0.4);

    let learningProfile;
    try {
      learningProfile = await lrsService.getEmployeeLearningProfile(employeeId);
    } catch {
      learningProfile = undefined;
    }

    return {
      ...snapshot,
      firstName: record.user.firstName,
      lastName: record.user.lastName,
      isActive: record.user.isActive,
      experienceLevel: record.user.experienceLevel?.name ?? null,
      successionScore,
      aiInsights: {
        summary: `${snapshot.employeeName} — readiness ${snapshot.readinessScore}%, performance ${snapshot.performanceScore}%, risk ${snapshot.riskLevel} (${snapshot.riskScore}%). Promotion target: ${snapshot.promotionTarget}.`,
        recommendations: snapshot.recommendations,
        confidence: confidenceFor(user, dataSources),
        sources: BASE_SOURCES,
      },
      assessments: record.user.assessmentAttempts.map((a) => ({
        id: a.id,
        title: a.assessment.title,
        score: a.score,
        maxScore: a.maxScore,
        passed: a.passed,
        status: a.status,
        submittedAt: a.submittedAt?.toISOString() ?? null,
      })),
      enrollments: record.user.enrollments.map((e) => ({
        id: e.id,
        courseTitle: e.course.title,
        progress: e.progress,
        status: e.status,
      })),
      learningProfile,
      activityTimeline: record.activityTimeline.map((log) => ({
        id: log.id,
        action: log.action,
        description: `${log.action} · ${log.entityType}`,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  },

  async queryCopilot(userId: string, role: RoleSlug, query: string): Promise<CopilotQueryResponse> {
    const scope = await resolveDashboardScope(userId, role);
    const classified = classifyIntent(query);
    const intent = resolveCopilotIntent(query, classified);

    const dbUser = await userRepository.findByIdWithRole(userId);
    const roleId = dbUser?.roleId ?? "";
    const effective = await rbacService.resolveUserPermissions(userId, roleId, role);
    const access = checkCopilotIntentAccess(intent, effective.permissions, effective.denied);

    if (!access.allowed) {
      return buildCopilotDeniedResponse(query, intent, scope.label);
    }

    const { users, maxSkillRank } = await employeeIntelligenceRepository.loadScopedUsers(scope);
    const ctx = buildCopilotContext(query, scope, users, maxSkillRank);
    return executeCopilotQuery(ctx);
  },

  compareEmployees(
    snapshots: import("@/types/employee-intelligence").EmployeeIntelSnapshot[],
    ids: string[]
  ) {
    return snapshots.filter((s) => ids.includes(s.employeeId));
  },
};
