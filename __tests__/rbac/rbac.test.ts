import { describe, expect, it, vi, beforeEach } from "vitest";
import { RoleSlug } from "@/constants/role-slugs";
import { Permission } from "@/lib/rbac/permissions";
import { getDefaultPermissionsForRole } from "@/lib/rbac/permission-matrix";
import { filterNavigation, canAccessNavItem } from "@/lib/rbac/filterNavigation";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import { canAccess } from "@/lib/rbac/canAccess";
import { resolveEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import { getRoutePermissionRule, getVisibleSettingsTabs } from "@/lib/rbac/routePermissions";
import { ROUTES } from "@/constants/routes";
import { permissionVersionService } from "@/lib/rbac/permission-version.service";
import {
  checkCopilotIntentAccess,
  resolveCopilotIntent,
} from "@/lib/rbac/copilot-intent-permissions";
import { canAccessNavHref } from "@/lib/rbac/navRouteAccess";
import { uiPermissionResolver } from "@/lib/rbac/resolvers/ui-resolver";
import { AppError } from "@/lib/errors/app-error";
import { normalizeRole } from "@/lib/rbac/normalizeRole";
import { resolveNavigation } from "@/lib/rbac/resolveNavigation";
import { getRolePermissionScope, getRoleScreenScope } from "@/lib/rbac/role-scope";

vi.mock("@/repositories/user.repository", () => ({
  userRepository: {
    findByIdWithRole: vi.fn(),
  },
}));

import { userRepository } from "@/repositories/user.repository";

describe("filterNavigation", () => {
  const employeePerms = getDefaultPermissionsForRole(RoleSlug.EMPLOYEE);

  it("employee cannot see admin people without permission", () => {
    const items = filterNavigation({
      navigation: NAVIGATION_ITEMS,
      user: { role: RoleSlug.EMPLOYEE, permissions: employeePerms },
      effectivePermissions: employeePerms,
    });
    expect(items.some((i) => i.id === "admin-people")).toBe(false);
    expect(items.some((i) => i.id === "system-settings")).toBe(false);
  });

  it("employee can see account", () => {
    const items = filterNavigation({
      navigation: NAVIGATION_ITEMS,
      user: { role: RoleSlug.EMPLOYEE, permissions: employeePerms },
      effectivePermissions: employeePerms,
    });
    expect(items.some((i) => i.id === "account")).toBe(true);
  });

  it("admin sees admin pages", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN);
    const items = filterNavigation({
      navigation: NAVIGATION_ITEMS,
      user: { role: RoleSlug.ADMIN, permissions: adminPerms },
      effectivePermissions: adminPerms,
    });
    expect(items.some((i) => i.id === "admin-people")).toBe(true);
    expect(items.some((i) => i.id === "system-settings")).toBe(true);
  });

  it("manager cannot see RBAC admin pages", () => {
    const managerPerms = getDefaultPermissionsForRole(RoleSlug.MANAGER);
    const items = filterNavigation({
      navigation: NAVIGATION_ITEMS,
      user: { role: RoleSlug.MANAGER, permissions: managerPerms },
      effectivePermissions: managerPerms,
    });
    expect(items.some((i) => i.id === "admin-roles")).toBe(false);
    expect(items.some((i) => i.id === "admin-people")).toBe(false);
  });

  it("hides parent when all children would be hidden", () => {
    const items = filterNavigation({
      navigation: [
        {
          id: "parent",
          section: "WORKFORCE",
          label: "Parent",
          href: "/parent",
          icon: "Users",
          permissions: [Permission.USERS_VIEW],
          requiredPermissions: [Permission.USERS_VIEW],
          mode: "any",
          children: [
            {
              id: "child",
              section: "WORKFORCE",
              label: "Child",
              href: "/child",
              icon: "Users",
              permissions: [Permission.USERS_DELETE],
              requiredPermissions: [Permission.USERS_DELETE],
              mode: "any",
            } as (typeof NAVIGATION_ITEMS)[0],
          ],
        } as (typeof NAVIGATION_ITEMS)[0],
      ],
      user: { role: RoleSlug.EMPLOYEE, permissions: employeePerms },
      effectivePermissions: employeePerms,
    });
    expect(items.length).toBe(0);
  });
});

describe("canAccess", () => {
  it("explicit deny overrides allow", () => {
    const result = canAccess({
      permissions: [Permission.DEPARTMENTS_VIEW, Permission.DASHBOARD_VIEW],
      denied: [Permission.DEPARTMENTS_VIEW],
      requiredPermissions: [Permission.DEPARTMENTS_VIEW],
    });
    expect(result.allowed).toBe(false);
    expect(result.source).toBe("explicit_deny");
  });

  it("user override grant allows access", () => {
    const effective = resolveEffectivePermissions({
      userId: "u1",
      roleId: "r1",
      roleSlug: RoleSlug.EMPLOYEE,
      rolePermissions: getDefaultPermissionsForRole(RoleSlug.EMPLOYEE),
      userOverrides: [{ permissionKey: Permission.REPORTS_VIEW, effect: "GRANT" }],
    });
    expect(effective.permissions).toContain(Permission.REPORTS_VIEW);
    expect(
      canAccessNavItem("reports", NAVIGATION_ITEMS, effective.permissions, RoleSlug.EMPLOYEE)
    ).toBe(true);
  });
});

describe("routePermissions", () => {
  it("employee direct /admin/people organization tab requires departments permission", () => {
    const rule = getRoutePermissionRule("/dashboard");
    expect(rule?.permissions).toContain(Permission.DEPARTMENTS_VIEW);
  });

  it("account route is authenticated only", () => {
    const rule = getRoutePermissionRule(ROUTES.ACCOUNT);
    expect(rule?.accessType).toBe("authenticated");
  });
});

describe("settings tab filtering", () => {
  it("employee cannot see system settings tabs", () => {
    const tabs = getVisibleSettingsTabs(getDefaultPermissionsForRole(RoleSlug.EMPLOYEE));
    expect(tabs.length).toBe(0);
  });

  it("admin sees settings tabs", () => {
    const tabs = getVisibleSettingsTabs(getDefaultPermissionsForRole(RoleSlug.ADMIN));
    expect(tabs.length).toBeGreaterThan(0);
    expect(tabs).toContain("rbac");
  });
});

describe("role scope", () => {
  it("employee permission scope is personal learning only", () => {
    const perms = getRolePermissionScope(RoleSlug.EMPLOYEE);
    expect(perms).toHaveLength(5);
    expect(perms).not.toContain(Permission.USERS_VIEW);
    expect(perms).not.toContain(Permission.SETTINGS_VIEW);

    const screens = getRoleScreenScope(RoleSlug.EMPLOYEE);
    expect(screens).toContain("dashboard");
    expect(screens).toContain("account");
    expect(screens).not.toContain("admin-roles");
    expect(screens).not.toContain("workforce-analytics");
  });

  it("manager scope includes analytics but not admin rbac", () => {
    const perms = getRolePermissionScope(RoleSlug.MANAGER);
    expect(perms).toContain(Permission.ANALYTICS_VIEW);
    expect(perms).not.toContain(Permission.RBAC_MANAGE);

    const screens = getRoleScreenScope(RoleSlug.MANAGER);
    expect(screens).toContain("workforce-analytics");
    expect(screens).not.toContain("admin-roles");
  });
});

describe("permission version staleness", () => {
  it("detects stale JWT when global version increments", () => {
    expect(
      permissionVersionService.isStale(
        { permissionVersion: 1, userPermissionVersion: 2 },
        { global: 2, user: 2 }
      )
    ).toBe(true);
  });

  it("detects stale JWT when user version increments", () => {
    expect(
      permissionVersionService.isStale(
        { permissionVersion: 3, userPermissionVersion: 1 },
        { global: 3, user: 2 }
      )
    ).toBe(true);
  });

  it("is fresh when versions match", () => {
    expect(
      permissionVersionService.isStale(
        { permissionVersion: 3, userPermissionVersion: 2 },
        { global: 3, user: 2 }
      )
    ).toBe(false);
  });
});

describe("permission refresh sidebar behavior", () => {
  it("granted override updates effective nav without role change", () => {
    const before = filterNavigation({
      navigation: NAVIGATION_ITEMS,
      user: { role: RoleSlug.EMPLOYEE, permissions: getDefaultPermissionsForRole(RoleSlug.EMPLOYEE) },
      effectivePermissions: getDefaultPermissionsForRole(RoleSlug.EMPLOYEE),
    });
    expect(before.some((i) => i.id === "reports")).toBe(false);

    const afterGrant = resolveEffectivePermissions({
      userId: "u1",
      roleId: "r1",
      roleSlug: RoleSlug.EMPLOYEE,
      rolePermissions: getDefaultPermissionsForRole(RoleSlug.EMPLOYEE),
      userOverrides: [{ permissionKey: Permission.REPORTS_VIEW, effect: "GRANT" }],
    });

    const after = filterNavigation({
      navigation: NAVIGATION_ITEMS,
      user: { role: RoleSlug.EMPLOYEE, permissions: afterGrant.permissions },
      effectivePermissions: afterGrant.permissions,
    });
    expect(after.some((i) => i.id === "reports")).toBe(true);
  });

  it("explicit deny still wins after simulated refresh", () => {
    const refreshed = resolveEffectivePermissions({
      userId: "u1",
      roleId: "r1",
      roleSlug: RoleSlug.MANAGER,
      rolePermissions: getDefaultPermissionsForRole(RoleSlug.MANAGER),
      userOverrides: [{ permissionKey: Permission.DEPARTMENTS_VIEW, effect: "DENY" }],
    });

    const result = canAccess({
      permissions: refreshed.permissions,
      denied: refreshed.denied,
      requiredPermissions: [Permission.DEPARTMENTS_VIEW],
    });
    expect(result.allowed).toBe(false);
    expect(result.source).toBe("explicit_deny");
  });
});

describe("dashboard route link guards", () => {
  it("employee cannot access admin users drilldown", () => {
    const employeePerms = getDefaultPermissionsForRole(RoleSlug.EMPLOYEE);
    const access = uiPermissionResolver.canAccessRoute(ROUTES.ADMIN_USERS, employeePerms);
    expect(access.enabled).toBe(false);
  });

  it("HR manager can access certifications drilldown", () => {
    const managerPerms = getDefaultPermissionsForRole(RoleSlug.MANAGER);
    const access = uiPermissionResolver.canAccessRoute(ROUTES.CERTIFICATIONS, managerPerms);
    expect(access.enabled).toBe(true);
  });
});

describe("AI copilot intent permissions", () => {
  it("denies promotion intent without analytics permission", () => {
    const employeePerms = getDefaultPermissionsForRole(RoleSlug.EMPLOYEE);
    const intent = resolveCopilotIntent("who is promotion ready", "promotion_ready");
    const access = checkCopilotIntentAccess(intent, employeePerms);
    expect(access.allowed).toBe(false);
  });

  it("allows promotion intent with analytics permission", () => {
    const perms = [...getDefaultPermissionsForRole(RoleSlug.MANAGER)];
    const intent = resolveCopilotIntent("promotion ready engineers", "promotion_ready");
    const access = checkCopilotIntentAccess(intent, perms);
    expect(access.allowed).toBe(true);
  });

  it("denies audit query without auditlogs.view", () => {
    const employeePerms = getDefaultPermissionsForRole(RoleSlug.EMPLOYEE);
    const intent = resolveCopilotIntent("show audit log for user changes", "workforce_health");
    expect(intent).toBe("audit_query");
    const access = checkCopilotIntentAccess(intent, employeePerms);
    expect(access.allowed).toBe(false);
  });
});


describe("normalizeRole", () => {
  it("normalizes ADMIN, Admin, and admin to ADMIN", () => {
    expect(normalizeRole("ADMIN")).toBe(RoleSlug.ADMIN);
    expect(normalizeRole("Admin")).toBe(RoleSlug.ADMIN);
    expect(normalizeRole("admin")).toBe(RoleSlug.ADMIN);
  });

  it("normalizes manager aliases", () => {
    expect(normalizeRole("manager")).toBe(RoleSlug.MANAGER);
    expect(normalizeRole("MANAGER")).toBe(RoleSlug.MANAGER);
  });
});

describe("resolved sidebar navigation", () => {
  it("ADMIN with full permissions returns sidebar sections > 0", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN);
    const { flatItems, sections } = resolveNavigation({
      role: RoleSlug.ADMIN,
      permissions: adminPerms,
    });

    expect(flatItems.length).toBeGreaterThan(0);
    expect(sections.length).toBeGreaterThan(0);
    expect(flatItems.every((item) => item.section)).toBe(true);
  });

  it("employee returns only allowed sidebar items", () => {
    const employeePerms = getDefaultPermissionsForRole(RoleSlug.EMPLOYEE);
    const { flatItems } = resolveNavigation({
      role: RoleSlug.EMPLOYEE,
      permissions: employeePerms,
    });

    expect(flatItems.some((i) => i.id === "dashboard")).toBe(true);
    expect(flatItems.some((i) => i.id === "account")).toBe(true);
    expect(flatItems.some((i) => i.id === "admin-people")).toBe(false);
    expect(flatItems.some((i) => i.id === "system-settings")).toBe(false);
  });

  it("manager sees analytics items but not RBAC admin", () => {
    const managerPerms = getDefaultPermissionsForRole(RoleSlug.MANAGER);
    const { flatItems } = resolveNavigation({
      role: RoleSlug.MANAGER,
      permissions: managerPerms,
    });

    expect(flatItems.some((i) => i.id === "analytics")).toBe(true);
    expect(flatItems.some((i) => i.id === "admin-roles")).toBe(false);
    expect(flatItems.some((i) => i.id === "admin-people")).toBe(false);
  });

  it("manager visible nav items are all route-accessible", () => {
    const managerPerms = getDefaultPermissionsForRole(RoleSlug.MANAGER);
    const { flatItems } = resolveNavigation({
      role: RoleSlug.MANAGER,
      permissions: managerPerms,
    });

    for (const item of flatItems) {
      expect(canAccessNavHref(item.href, managerPerms, [], RoleSlug.MANAGER)).toBe(true);
    }
  });

  it("manager with settings.view sees System Settings", () => {
    const managerPerms = [
      ...getDefaultPermissionsForRole(RoleSlug.MANAGER),
      Permission.SETTINGS_VIEW,
    ];
    const { flatItems } = resolveNavigation({
      role: RoleSlug.MANAGER,
      permissions: managerPerms,
    });
    expect(flatItems.some((i) => i.id === "system-settings")).toBe(true);
  });

  it("Admin sees System Settings with default permissions", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN);
    const { flatItems } = resolveNavigation({
      role: RoleSlug.ADMIN,
      permissions: adminPerms,
    });
    expect(flatItems.some((i) => i.id === "system-settings")).toBe(true);
  });

  it("removing users.view hides People & Organization for admin", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN).filter(
      (p) =>
        p !== Permission.USERS_VIEW &&
        p !== Permission.DEPARTMENTS_VIEW &&
        p !== Permission.DEPARTMENTS_MANAGE
    );
    const { flatItems } = resolveNavigation({
      role: RoleSlug.ADMIN,
      permissions: adminPerms,
    });
    expect(flatItems.some((i) => i.id === "admin-people")).toBe(false);
  });

  it("admin with users.view sees People & Organization", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN);
    const { flatItems } = resolveNavigation({
      role: RoleSlug.ADMIN,
      permissions: adminPerms,
    });
    expect(flatItems.some((i) => i.id === "admin-people")).toBe(true);
  });

  it("removing settings.view hides Settings", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN).filter(
      (p) => p !== Permission.SETTINGS_VIEW && p !== Permission.SETTINGS_MANAGE
    );
    const { flatItems } = resolveNavigation({
      role: RoleSlug.ADMIN,
      permissions: adminPerms,
    });
    expect(flatItems.some((i) => i.id === "system-settings")).toBe(false);
  });

  it("allowedRoles alone does not grant access", () => {
    const result = canAccess({
      role: RoleSlug.MANAGER,
      permissions: [],
      requiredPermissions: [],
      allowedRoles: [RoleSlug.MANAGER],
    });
    expect(result.allowed).toBe(false);
  });

  it("explicit DENY hides nav item even when role has permission", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN);
    const { flatItems: before } = resolveNavigation({
      role: RoleSlug.ADMIN,
      permissions: adminPerms,
    });
    expect(before.some((i) => i.id === "admin-people")).toBe(true);

    const { flatItems: after } = resolveNavigation({
      role: RoleSlug.ADMIN,
      permissions: adminPerms,
      deniedPermissions: [Permission.USERS_VIEW],
    });
    expect(after.some((i) => i.id === "admin-people")).toBe(false);
  });

  it("role casing Admin resolves same nav as ADMIN", () => {
    const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN);
    const upper = resolveNavigation({ role: "ADMIN", permissions: adminPerms });
    const mixed = resolveNavigation({ role: "Admin", permissions: adminPerms });

    expect(mixed.flatItems.length).toBe(upper.flatItems.length);
    expect(mixed.sections.length).toBe(upper.sections.length);
  });
});

