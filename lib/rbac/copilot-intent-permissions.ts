import type { CopilotIntent } from "@/types/employee-intelligence";
import { canAccess } from "./canAccess";
import { Permission, type Permission as PermissionType } from "./permissions";

export interface CopilotIntentRule {
  /** Human-readable permission label shown in denial messages. */
  label: string;
  permissions: PermissionType[];
  mode: "any" | "all";
}

/**
 * Maps copilot intents to effective RBAC permissions.
 * Labels mirror product vocabulary (e.g. promotion.view → analytics.view).
 */
export const COPILOT_INTENT_RULES: Record<CopilotIntent | "audit_query", CopilotIntentRule> = {
  promotion_ready: {
    label: "promotion.view or analytics.view",
    permissions: [Permission.ANALYTICS_VIEW, Permission.ANALYTICS_VIEW],
    mode: "any",
  },
  succession_planning: {
    label: "succession.view or analytics.view",
    permissions: [Permission.ANALYTICS_VIEW, Permission.ANALYTICS_VIEW],
    mode: "any",
  },
  skill_gap_analysis: {
    label: "skills.view or analytics.view",
    permissions: [Permission.ANALYTICS_VIEW, Permission.ANALYTICS_VIEW],
    mode: "any",
  },
  certification_risk: {
    label: "certificates.view",
    permissions: [Permission.CERTIFICATES_VIEW, Permission.CERTIFICATES_MANAGE],
    mode: "any",
  },
  compliance_risk: {
    label: "compliance.view or analytics.view",
    permissions: [Permission.CERTIFICATES_VIEW, Permission.ANALYTICS_VIEW],
    mode: "any",
  },
  learning_progress: {
    label: "learning.view",
    permissions: [Permission.COURSES_VIEW, Permission.LEARNING_ENROLL, Permission.LEARNING_TEAM_VIEW],
    mode: "any",
  },
  employee_search: {
    label: "users.view",
    permissions: [Permission.USERS_VIEW],
    mode: "any",
  },
  department_analysis: {
    label: "departments.view or analytics.department.view",
    permissions: [Permission.DEPARTMENTS_VIEW, Permission.ANALYTICS_VIEW],
    mode: "any",
  },
  audit_query: {
    label: "auditlogs.view",
    permissions: [Permission.AUDITLOGS_VIEW],
    mode: "any",
  },
  attrition_risk: {
    label: "analytics.view",
    permissions: [Permission.ANALYTICS_VIEW, Permission.ANALYTICS_VIEW],
    mode: "any",
  },
  workforce_health: {
    label: "analytics.view",
    permissions: [
      Permission.ANALYTICS_VIEW,
      Permission.ANALYTICS_EXECUTIVE_VIEW,
      Permission.ANALYTICS_VIEW,
    ],
    mode: "any",
  },
};

const AUDIT_QUERY_PATTERN = /\b(audit|audit\s*log|who\s+(changed|modified|updated|deleted))\b/i;

export function resolveCopilotIntent(query: string, classified: CopilotIntent): CopilotIntent | "audit_query" {
  if (AUDIT_QUERY_PATTERN.test(query)) return "audit_query";
  return classified;
}

export function checkCopilotIntentAccess(
  intent: CopilotIntent | "audit_query",
  permissions: PermissionType[],
  denied: PermissionType[] = []
) {
  const rule = COPILOT_INTENT_RULES[intent];
  return canAccess({
    permissions,
    denied,
    requiredPermissions: rule.permissions,
    permissionMode: rule.mode,
  });
}

export function getCopilotIntentRule(intent: CopilotIntent | "audit_query"): CopilotIntentRule {
  return COPILOT_INTENT_RULES[intent];
}
