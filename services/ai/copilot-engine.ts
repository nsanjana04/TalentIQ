import { ROUTES } from "@/constants/routes";
import type {
  AiResponseCard,
  CopilotIntent,
  CopilotQueryResponse,
  DrillDownNode,
  EmployeeIntelSnapshot,
} from "@/types/employee-intelligence";
import { classifyIntent, extractEntities } from "./intent-classifier";
import {
  BASE_SOURCES,
  computeDataSourceCounts,
  globalConfidence,
  mapSnapshot,
} from "./metrics";
import {
  buildRichNarrative,
  buildStructuredCopilotResponse,
} from "@/lib/ai/structured-response";
import { successionService } from "./successionService";
import { skillGapService } from "./skillGapService";
import { complianceService, certificationService } from "./complianceService";
import { learningService } from "./learningService";
import { analyticsService } from "./analyticsService";
import type { CopilotQueryContext, ServiceQueryResult } from "./types";
import type { DashboardScope } from "@/lib/dashboard/scope";
import type { IntelUserRecord } from "@/repositories/employee-intelligence.repository";

function buildDrillDown(scopeLabel: string, employees: EmployeeIntelSnapshot[]): DrillDownNode {
  const deptMap = new Map<string, EmployeeIntelSnapshot[]>();
  for (const e of employees) {
    const key = e.department ?? "Unassigned";
    const list = deptMap.get(key) ?? [];
    list.push(e);
    deptMap.set(key, list);
  }

  return {
    type: "organization",
    id: "org",
    label: scopeLabel,
    count: employees.length,
    children: [...deptMap.entries()].map(([dept, emps]) => {
      const teamMap = new Map<string, EmployeeIntelSnapshot[]>();
      for (const e of emps) {
        const t = e.team ?? "Unassigned";
        const list = teamMap.get(t) ?? [];
        list.push(e);
        teamMap.set(t, list);
      }
      return {
        type: "department" as const,
        id: emps[0]?.departmentId ?? dept,
        label: dept,
        count: emps.length,
        href: `${"/dashboard"}?tab=department`,
        children: [...teamMap.entries()].map(([team, teamEmps]) => ({
          type: "team" as const,
          id: teamEmps[0]?.teamId ?? team,
          label: team,
          count: teamEmps.length,
          href: `${"/dashboard"}?tab=team`,
          children: teamEmps.slice(0, 12).map((e) => ({
            type: "employee" as const,
            id: e.employeeId,
            label: e.employeeName,
            href: e.profileHref,
          })),
        })),
      };
    }),
  };
}

function routeIntent(ctx: CopilotQueryContext): ServiceQueryResult {
  switch (ctx.intent) {
    case "promotion_ready":
      return skillGapService(ctx);
    case "succession_planning":
      return successionService(ctx);
    case "skill_gap_analysis":
      return skillGapService(ctx);
    case "certification_risk":
      return certificationService(ctx);
    case "compliance_risk":
      return complianceService(ctx);
    case "learning_progress":
      return learningService(ctx);
    case "attrition_risk":
    case "employee_search":
    case "department_analysis":
    case "workforce_health":
      return analyticsService(ctx);
    default:
      return analyticsService(ctx);
  }
}

function buildCard(result: ServiceQueryResult, ctx: CopilotQueryContext, drillDown: DrillDownNode): AiResponseCard {
  const avgConfidence =
    result.ranked.length > 0
      ? Math.round(result.ranked.reduce((s, r) => s + r.confidence, 0) / result.ranked.length)
      : globalConfidence([], ctx.dataSources);

  return {
    id: `${result.cardType}-1`,
    cardType: result.cardType,
    title: result.cardTitle,
    summary: result.cardSummary,
    severity: result.severity,
    employees: result.ranked.slice(0, 20),
    drillDown,
    confidence: avgConfidence,
    sources: BASE_SOURCES,
  };
}

export function buildCopilotContext(
  query: string,
  scope: DashboardScope,
  users: IntelUserRecord[],
  maxSkillRank: number
): CopilotQueryContext {
  const snapshots = users.map((u) => mapSnapshot(u, maxSkillRank));
  const intent = classifyIntent(query);
  const entities = extractEntities(query, snapshots);
  const generatedAt = new Date().toISOString();
  const dataSources = computeDataSourceCounts(users);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    query,
    intent,
    entities,
    scope,
    users,
    snapshots,
    filteredSnapshots: snapshots,
    userMap,
    maxSkillRank,
    generatedAt,
    dataSources,
  };
}

export function executeCopilotQuery(ctx: CopilotQueryContext): CopilotQueryResponse {
  const result = routeIntent(ctx);
  const drillEmployees = result.drillDownEmployees ?? result.ranked.map((r) => r.employee);
  const drillDown = buildDrillDown(ctx.scope.label, drillEmployees);
  const card = buildCard(result, ctx, drillDown);
  const confidence = globalConfidence(result.ranked, ctx.dataSources);

  const structured = buildStructuredCopilotResponse({
    intent: ctx.intent,
    headline: result.headline,
    ranked: result.ranked,
    cardSummary: result.cardSummary,
    severity: result.severity,
    confidence,
    dataSources: ctx.dataSources,
    sources: BASE_SOURCES,
    deptLabel: ctx.entities.department,
  });

  const narrative = buildRichNarrative(structured, result.headline);

  return {
    query: ctx.query,
    scopeLabel: ctx.scope.label,
    intent: ctx.intent,
    headline: result.headline,
    narrative,
    structured,
    cards: [card],
    rankedEmployees: result.ranked.slice(0, 30),
    drillDown,
    generatedAt: ctx.generatedAt,
    dataSources: ctx.dataSources,
    confidence,
  };
}

export function intentLabel(intent: CopilotIntent): string {
  return intent.replace(/_/g, " ");
}

