import { describe, expect, it } from "vitest";
import { RoleSlug } from "@/constants/role-slugs";
import { Permission } from "@/lib/rbac/permissions";
import { getDefaultPermissionsForRole } from "@/lib/rbac/permission-matrix";
import { resolveEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import {
  canAccessScreenFromData,
  isScreenAccessible,
  resolveAccessibleScreens,
  type RoleScreenAccessRecord,
  type ScreenRecord,
  type UserScreenOverrideRecord,
} from "@/lib/screens/screen-access-resolver";
import { SCREEN_DEFINITIONS } from "@/lib/screens/screen-definitions";
import { canAny } from "@/lib/rbac/check";
import { getRoutePermissionRule } from "@/lib/rbac/routePermissions";

function buildScreens(): ScreenRecord[] {
  return SCREEN_DEFINITIONS.map((def, index) => ({
    id: `screen-${index}`,
    key: def.key,
    label: def.label,
    route: def.route,
    section: def.section,
    icon: def.icon,
    sectionOrder: def.sectionOrder,
    order: def.order,
    requiredPermission: def.requiredPermission,
    isSidebarItem: def.isSidebarItem ?? true,
    isActive: true,
    isPersonal: def.isPersonal ?? false,
  }));
}

function roleAccess(enabledKeys: string[], screens: ScreenRecord[]): RoleScreenAccessRecord[] {
  const enabled = new Set(enabledKeys);
  return screens.map((screen) => ({
    screenId: screen.id,
    enabled: enabled.has(screen.key),
    canView: enabled.has(screen.key),
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canManage: false,
  }));
}

describe("screen override effective permissions", () => {
  const screens = buildScreens();
  const executiveScreen = screens.find((screen) => screen.key === "executive-war-room")!;
  const employeeRolePerms = getDefaultPermissionsForRole(RoleSlug.EMPLOYEE);

  const employeeScreens = [
    "dashboard",
    "ai-copilot",
    "learning-pathways",
    "courses",
    "assessments",
    "certifications",
    "account",
  ];

  function resolveWithScreenOverrides(
    screenOverrides: UserScreenOverrideRecord[],
    rolePermissions = employeeRolePerms
  ) {
    return resolveEffectivePermissions({
      userId: "user-paul",
      roleId: "role-employee",
      roleSlug: RoleSlug.EMPLOYEE,
      rolePermissions,
      screenOverrides: screenOverrides.map((override) => {
        const screen = screens.find((row) => row.id === override.screenId)!;
        return {
          overrideType: override.overrideType,
          requiredPermission: screen.requiredPermission,
          expiresAt: override.expiresAt,
        };
      }),
    });
  }

  function routeAllowed(permissions: Permission[], pathname: string): boolean {
    const rule = getRoutePermissionRule(pathname);
    if (!rule || rule.permissions.length === 0) return true;
    return canAny(permissions, rule.permissions);
  }

  it("employee without Executive Intelligence: sidebar hidden and route forbidden", () => {
    const access = roleAccess(employeeScreens, screens);
    const effective = resolveWithScreenOverrides([]);
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: [],
      permissions: effective.permissions,
      sidebarOnly: true,
    });

    expect(visible.some((screen) => screen.key === "executive-war-room")).toBe(false);
    expect(effective.permissions).not.toContain(Permission.ANALYTICS_EXECUTIVE_VIEW);
    expect(routeAllowed(effective.permissions, "/executive-war-room")).toBe(false);
  });

  it("ALLOW override grants analytics.executive.view and opens route", () => {
    const access = roleAccess(employeeScreens, screens);
    const overrides: UserScreenOverrideRecord[] = [
      {
        screenId: executiveScreen.id,
        overrideType: "ALLOW",
        enabled: true,
      },
    ];
    const effective = resolveWithScreenOverrides(overrides);
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: overrides,
      permissions: effective.permissions,
      sidebarOnly: true,
    });

    expect(effective.permissions).toContain(Permission.ANALYTICS_EXECUTIVE_VIEW);
    expect(visible.some((screen) => screen.key === "executive-war-room")).toBe(true);
    expect(routeAllowed(effective.permissions, "/executive-war-room")).toBe(true);
    expect(
      canAccessScreenFromData(
        screens,
        access,
        overrides,
        effective.permissions,
        "/executive-war-room"
      )
    ).toBe(true);
  });

  it("DENY override hides screen and removes analytics.executive.view", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN);
    const access = roleAccess([...employeeScreens, "executive-war-room"], screens);
    const overrides: UserScreenOverrideRecord[] = [
      {
        screenId: executiveScreen.id,
        overrideType: "DENY",
        enabled: false,
      },
    ];
    const effective = resolveEffectivePermissions({
      userId: "user-ceo",
      roleId: "role-ceo",
      roleSlug: RoleSlug.ADMIN,
      rolePermissions: adminPerms,
      screenOverrides: [
        {
          overrideType: "DENY",
          requiredPermission: executiveScreen.requiredPermission,
        },
      ],
    });
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: overrides,
      permissions: effective.permissions,
      sidebarOnly: true,
    });

    expect(effective.permissions).not.toContain(Permission.ANALYTICS_EXECUTIVE_VIEW);
    expect(visible.some((screen) => screen.key === "executive-war-room")).toBe(false);
    expect(routeAllowed(effective.permissions, "/executive-war-room")).toBe(false);
    expect(
      isScreenAccessible(executiveScreen, access, overrides, effective.permissions)
    ).toBe(false);
  });

  it("expired ALLOW override is ignored", () => {
    const access = roleAccess(employeeScreens, screens);
    const overrides: UserScreenOverrideRecord[] = [
      {
        screenId: executiveScreen.id,
        overrideType: "ALLOW",
        enabled: true,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
    ];
    const effective = resolveWithScreenOverrides(overrides);

    expect(effective.permissions).not.toContain(Permission.ANALYTICS_EXECUTIVE_VIEW);
    expect(
      resolveAccessibleScreens({
        screens,
        roleAccess: access,
        userOverrides: overrides,
        permissions: effective.permissions,
        sidebarOnly: true,
      }).some((screen) => screen.key === "executive-war-room")
    ).toBe(false);
  });

  it("DENY wins over role permission and ALLOW on same permission", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN);
    const effective = resolveEffectivePermissions({
      userId: "user-ceo",
      roleId: "role-ceo",
      roleSlug: RoleSlug.ADMIN,
      rolePermissions: adminPerms,
      screenOverrides: [
        {
          overrideType: "ALLOW",
          requiredPermission: executiveScreen.requiredPermission,
        },
        {
          overrideType: "DENY",
          requiredPermission: executiveScreen.requiredPermission,
        },
      ],
    });

    expect(effective.permissions).not.toContain(Permission.ANALYTICS_EXECUTIVE_VIEW);
    expect(effective.denied).toContain(Permission.ANALYTICS_EXECUTIVE_VIEW);
  });

  it("ALLOW grants only screen required permission, not broad manage permissions", () => {
    const effective = resolveWithScreenOverrides([
      {
        screenId: executiveScreen.id,
        overrideType: "ALLOW",
        enabled: true,
      },
    ]);

    expect(effective.permissions).toContain(Permission.ANALYTICS_EXECUTIVE_VIEW);
    expect(effective.permissions).not.toContain(Permission.RBAC_MANAGE);
    expect(effective.permissions).not.toContain(Permission.SETTINGS_MANAGE);
    expect(effective.permissions).not.toContain(Permission.DEPARTMENTS_MANAGE);
  });
});
