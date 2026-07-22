import { RoleSlug, type RoleSlug as RoleSlugType } from "@/constants/role-slugs";
import { ROUTES } from "@/constants/routes";
import {
  groupScreensBySection,
  resolveAccessibleScreens,
  type ScreenRecord,
  type SidebarSection,
} from "@/lib/screens/screen-access-resolver";
import type { Permission } from "@/lib/rbac/permissions";
import type { RoleScreenAccessRecord, UserScreenOverrideRecord } from "@/lib/screens/screen-access-resolver";

export const EMPLOYEE_CORE_SCREEN_KEYS = [
  "dashboard",
  "ai-copilot",
  "learning-pathways",
  "courses",
  "assessments",
  "certifications",
  "account",
] as const;

export const MANAGER_CORE_SCREEN_KEYS = [
  ...EMPLOYEE_CORE_SCREEN_KEYS,
  "executive-war-room",
  "admin-learning",
  "workforce-analytics",
  "reports",
] as const;

const PRIVILEGED_EMERGENCY_ROLES = new Set<RoleSlugType>([RoleSlug.ADMIN]);

export function isPrivilegedEmergencyRole(roleSlug: string | undefined): boolean {
  return !!roleSlug && PRIVILEGED_EMERGENCY_ROLES.has(roleSlug as RoleSlugType);
}

export function resolveEmergencySidebarScreens(
  roleSlug: string | undefined,
  screens: ScreenRecord[]
): ScreenRecord[] {
  const sidebarScreens = screens.filter((screen) => screen.isSidebarItem && screen.isActive);

  if (isPrivilegedEmergencyRole(roleSlug)) {
    return sidebarScreens.sort(
      (a, b) => a.sectionOrder - b.sectionOrder || a.order - b.order
    );
  }

  if (roleSlug === RoleSlug.MANAGER) {
    const keys = new Set<string>(MANAGER_CORE_SCREEN_KEYS);
    return sidebarScreens
      .filter((screen) => keys.has(screen.key))
      .sort((a, b) => a.sectionOrder - b.sectionOrder || a.order - b.order);
  }

  if (roleSlug === RoleSlug.EMPLOYEE) {
    const keys = new Set<string>(EMPLOYEE_CORE_SCREEN_KEYS);
    return sidebarScreens
      .filter((screen) => keys.has(screen.key))
      .sort((a, b) => a.sectionOrder - b.sectionOrder || a.order - b.order);
  }

  const account = sidebarScreens.find((screen) => screen.key === "account");
  const dashboard = sidebarScreens.find((screen) => screen.key === "dashboard");
  return [dashboard, account].filter((screen): screen is ScreenRecord => !!screen);
}

export interface SidebarResolutionInput {
  roleSlug?: string;
  screens: ScreenRecord[];
  roleAccess: RoleScreenAccessRecord[];
  userOverrides: UserScreenOverrideRecord[];
  permissions: Permission[];
  sidebarOnly?: boolean;
}

export function resolveSidebarWithEmergencyFallback(
  input: SidebarResolutionInput
): { sections: SidebarSection[]; usedEmergencyFallback: boolean } {
  const accessible = resolveAccessibleScreens({
    screens: input.screens,
    roleAccess: input.roleAccess,
    userOverrides: input.userOverrides,
    permissions: input.permissions,
    sidebarOnly: input.sidebarOnly ?? true,
  });

  if (accessible.length > 0) {
    return { sections: groupScreensBySection(accessible), usedEmergencyFallback: false };
  }

  const emergency = resolveEmergencySidebarScreens(input.roleSlug, input.screens);
  if (emergency.length === 0) {
    return { sections: [], usedEmergencyFallback: false };
  }

  console.error(
    `[CRITICAL] Screen access emergency fallback activated for role=${input.roleSlug ?? "unknown"}. ` +
      `Normal resolution returned 0 screens; returning ${emergency.length} emergency screens. ` +
      "Run npm run repair:screen-access to fix RoleScreenAccess data."
  );

  return { sections: groupScreensBySection(emergency), usedEmergencyFallback: true };
}

export function resolvePostLoginFallbackPath(roleSlug: string | undefined): string {
  if (isPrivilegedEmergencyRole(roleSlug)) {
    return ROUTES.DASHBOARD;
  }
  return ROUTES.ACCOUNT;
}
