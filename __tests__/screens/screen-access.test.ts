import { describe, expect, it } from "vitest";
import { Permission } from "@/lib/rbac/permissions";
import { getDefaultPermissionsForRole } from "@/lib/rbac/permission-matrix";
import { RoleSlug } from "@/constants/role-slugs";
import {
  canAccessScreenFromData,
  groupScreensBySection,
  isScreenAccessible,
  resolveAccessibleScreens,
  type RoleScreenAccessRecord,
  type ScreenRecord,
  type UserScreenOverrideRecord,
} from "@/lib/screens/screen-access-resolver";
import { SCREEN_DEFINITIONS } from "@/lib/screens/screen-definitions";

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

describe("screen access resolver", () => {
  const screens = buildScreens();
  const employeePerms = getDefaultPermissionsForRole(RoleSlug.EMPLOYEE);
  const managerPerms = getDefaultPermissionsForRole(RoleSlug.MANAGER);

  it("employee sidebar excludes admin people when RoleScreenAccess disabled", () => {
    const access = roleAccess(
      ["dashboard", "ai-copilot", "learning-pathways", "courses", "assessments", "certifications", "account"],
      screens
    );
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: [],
      permissions: employeePerms,
      sidebarOnly: true,
    });
    expect(visible.some((screen) => screen.key === "admin-people")).toBe(false);
  });

  it("enabling admin people for employee makes it appear", () => {
    const access = roleAccess(
      ["dashboard", "admin-people", "account"],
      screens
    );
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: [],
      permissions: [...employeePerms, Permission.USERS_VIEW],
      sidebarOnly: true,
    });
    expect(visible.some((screen) => screen.key === "admin-people")).toBe(true);
  });

  it("disabling admin people hides it", () => {
    const access = roleAccess(["dashboard", "account"], screens);
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: [],
      permissions: employeePerms,
      sidebarOnly: true,
    });
    expect(visible.some((screen) => screen.key === "admin-people")).toBe(false);
  });

  it("settings disabled for HR by default fixture", () => {
    const hrEnabled = roleAccess(
      [
        "dashboard",
        "reports",
        "account",
      ],
      screens
    );
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: hrEnabled,
      userOverrides: [],
      permissions: managerPerms,
      sidebarOnly: true,
    });
    expect(visible.some((screen) => screen.key === "system-settings")).toBe(false);
  });

  it("enabling settings for HR shows it when permission exists", () => {
    const hrEnabled = roleAccess(
      ["dashboard", "system-settings", "account"],
      screens
    );
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: hrEnabled,
      userOverrides: [],
      permissions: [...managerPerms, Permission.SETTINGS_VIEW],
      sidebarOnly: true,
    });
    expect(visible.some((screen) => screen.key === "system-settings")).toBe(true);
  });

  it("user DENY hides screen even if role enabled", () => {
    const adminPeople = screens.find((screen) => screen.key === "admin-people")!;
    const access = roleAccess(["dashboard", "admin-people", "account"], screens);
    const overrides: UserScreenOverrideRecord[] = [
      { screenId: adminPeople.id, overrideType: "DENY", enabled: false },
    ];
    expect(
      isScreenAccessible(adminPeople, access, overrides, [...employeePerms, Permission.USERS_VIEW])
    ).toBe(false);
  });

  it("user ALLOW shows screen even if role disabled", () => {
    const adminPeople = screens.find((screen) => screen.key === "admin-people")!;
    const access = roleAccess(["dashboard", "account"], screens);
    const overrides: UserScreenOverrideRecord[] = [
      { screenId: adminPeople.id, overrideType: "ALLOW", enabled: true },
    ];
    expect(
      isScreenAccessible(adminPeople, access, overrides, [...employeePerms, Permission.USERS_VIEW])
    ).toBe(true);
  });

  it("user ALLOW shows screen when effective permissions include required permission", () => {
    const settings = screens.find((screen) => screen.key === "system-settings")!;
    const access = roleAccess(["dashboard", "account"], screens);
    const overrides: UserScreenOverrideRecord[] = [
      { screenId: settings.id, overrideType: "ALLOW", enabled: true },
    ];
    expect(
      isScreenAccessible(settings, access, overrides, [...employeePerms, Permission.SETTINGS_VIEW])
    ).toBe(true);
  });

  it("user ALLOW without granted permission does not show screen", () => {
    const warRoom = screens.find((screen) => screen.key === "executive-war-room")!;
    const access = roleAccess(["dashboard", "account"], screens);
    const overrides: UserScreenOverrideRecord[] = [
      { screenId: warRoom.id, overrideType: "ALLOW", enabled: true },
    ];
    expect(isScreenAccessible(warRoom, access, overrides, employeePerms)).toBe(false);
  });

  it("DENY wins over role enable and ALLOW", () => {
    const settings = screens.find((screen) => screen.key === "system-settings")!;
    const access = roleAccess(["dashboard", "system-settings", "account"], screens);
    const overrides: UserScreenOverrideRecord[] = [
      { screenId: settings.id, overrideType: "DENY", enabled: false },
    ];
    expect(
      isScreenAccessible(settings, access, overrides, [...managerPerms, Permission.SETTINGS_VIEW])
    ).toBe(false);
  });

  it("employee sidebar excludes disabled screens by default", () => {
    const access = roleAccess(
      ["dashboard", "ai-copilot", "learning-pathways", "courses", "assessments", "certifications", "account"],
      screens
    );
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: [],
      permissions: employeePerms,
      sidebarOnly: true,
    });
    expect(visible.map((s) => s.key)).toEqual([
      "dashboard",
      "ai-copilot",
      "learning-pathways",
      "courses",
      "assessments",
      "certifications",
      "account",
    ]);
  });

  it("HR Manager does not see Settings by default", () => {
    const hrEnabled = roleAccess(
      SCREEN_DEFINITIONS.filter((s) =>
        [
          "dashboard", "reports", "account",
        ].includes(s.key)
      ).map((s) => s.key),
      screens
    );
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: hrEnabled,
      userOverrides: [],
      permissions: managerPerms,
      sidebarOnly: true,
    });
    expect(visible.some((screen) => screen.key === "system-settings")).toBe(false);
  });

  it("disabling Settings hides it for HR", () => {
    const hrEnabled = roleAccess(["dashboard", "system-settings", "account"], screens);
    const visibleOn = resolveAccessibleScreens({
      screens,
      roleAccess: hrEnabled,
      userOverrides: [],
      permissions: [...managerPerms, Permission.SETTINGS_VIEW],
      sidebarOnly: true,
    });
    const accessOff = roleAccess(["dashboard", "account"], screens);
    const visibleOff = resolveAccessibleScreens({
      screens,
      roleAccess: accessOff,
      userOverrides: [],
      permissions: [...managerPerms, Permission.SETTINGS_VIEW],
      sidebarOnly: true,
    });
    expect(visibleOn.some((s) => s.key === "system-settings")).toBe(true);
    expect(visibleOff.some((s) => s.key === "system-settings")).toBe(false);
  });

  it("sidebar order follows sectionOrder + order", () => {
    const access = roleAccess(screens.map((screen) => screen.key), screens);
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: [],
      permissions: getDefaultPermissionsForRole(RoleSlug.ADMIN),
      sidebarOnly: true,
    });
    const grouped = groupScreensBySection(visible);
    expect(grouped[0]?.section).toBe("COMMAND CENTER");
    expect(grouped[0]?.items[0]?.key).toBe("dashboard");
    expect(grouped[0]?.items[1]?.key).toBe("ai-copilot");
  });

  it("canAccessScreenFromData respects route lookup", () => {
    const access = roleAccess(["admin-people"], screens);
    const allowed = canAccessScreenFromData(
      screens,
      access,
      [],
      [...employeePerms, Permission.USERS_VIEW],
      "/admin/people"
    );
    expect(allowed).toBe(true);
  });

  it("direct admin people blocked when disabled in role access", () => {
    const access = roleAccess(["dashboard", "account"], screens);
    const allowed = canAccessScreenFromData(
      screens,
      access,
      [],
      [...employeePerms, Permission.USERS_VIEW],
      "/admin/people"
    );
    expect(allowed).toBe(false);
  });

  it("search-style exclusion removes disabled screens from accessible set", () => {
    const access = roleAccess(["dashboard", "account"], screens);
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: [],
      permissions: employeePerms,
      sidebarOnly: true,
    });
    expect(visible.some((screen) => screen.key === "reports")).toBe(false);
  });

  it("expired user override is ignored", () => {
    const adminPeople = screens.find((screen) => screen.key === "admin-people")!;
    const access = roleAccess(["dashboard", "account"], screens);
    const overrides: UserScreenOverrideRecord[] = [
      {
        screenId: adminPeople.id,
        overrideType: "ALLOW",
        enabled: true,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
    ];
    expect(
      isScreenAccessible(adminPeople, access, overrides, [...employeePerms, Permission.USERS_VIEW])
    ).toBe(false);
  });

  it("visible sidebar routes map to known screen keys", () => {
    const access = roleAccess(screens.map((screen) => screen.key), screens);
    const visible = resolveAccessibleScreens({
      screens,
      roleAccess: access,
      userOverrides: [],
      permissions: getDefaultPermissionsForRole(RoleSlug.ADMIN),
      sidebarOnly: true,
    });
    for (const screen of visible) {
      expect(screens.some((candidate) => candidate.key === screen.key)).toBe(true);
      expect(screen.route.startsWith("/")).toBe(true);
    }
  });
});

describe("emergency screen access fallback", () => {
  const screens = buildScreens();
  const adminPerms = getDefaultPermissionsForRole(RoleSlug.ADMIN);
  const employeePerms = getDefaultPermissionsForRole(RoleSlug.EMPLOYEE);
  const emptyAccess: RoleScreenAccessRecord[] = screens.map((screen) => ({
    screenId: screen.id,
    enabled: false,
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canManage: false,
  }));

  it("ADMIN never has zero visible screens when RoleScreenAccess is empty", async () => {
    const { resolveSidebarWithEmergencyFallback } = await import(
      "@/lib/screens/emergency-screen-access"
    );
    const { sections, usedEmergencyFallback } = resolveSidebarWithEmergencyFallback({
      roleSlug: RoleSlug.ADMIN,
      screens,
      roleAccess: emptyAccess,
      userOverrides: [],
      permissions: adminPerms,
      sidebarOnly: true,
    });
    const count = sections.flatMap((section) => section.items).length;
    expect(count).toBeGreaterThan(0);
    expect(usedEmergencyFallback).toBe(true);
  });

  it("admin never has zero visible screens when RoleScreenAccess is empty", async () => {
    const { resolveSidebarWithEmergencyFallback } = await import(
      "@/lib/screens/emergency-screen-access"
    );
    const { sections, usedEmergencyFallback } = resolveSidebarWithEmergencyFallback({
      roleSlug: RoleSlug.ADMIN,
      screens,
      roleAccess: emptyAccess,
      userOverrides: [],
      permissions: adminPerms,
      sidebarOnly: true,
    });
    const keys = sections.flatMap((section) => section.items).map((item) => item.key);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toContain("dashboard");
    expect(keys).toContain("account");
    expect(usedEmergencyFallback).toBe(true);
  });

  it("EMPLOYEE has at least Dashboard and Account with empty RoleScreenAccess", async () => {
    const { resolveSidebarWithEmergencyFallback } = await import(
      "@/lib/screens/emergency-screen-access"
    );
    const { sections } = resolveSidebarWithEmergencyFallback({
      roleSlug: RoleSlug.EMPLOYEE,
      screens,
      roleAccess: emptyAccess,
      userOverrides: [],
      permissions: employeePerms,
      sidebarOnly: true,
    });
    const keys = sections.flatMap((section) => section.items).map((item) => item.key);
    expect(keys).toContain("dashboard");
    expect(keys).toContain("account");
  });

  it("account screen is always personal and accessible with role access enabled", () => {
    const account = screens.find((screen) => screen.key === "account")!;
    const access = roleAccess(["account"], screens);
    expect(isScreenAccessible(account, access, [], employeePerms)).toBe(true);
  });

  it("admin dashboard accessible after repair fixture", () => {
    const access = roleAccess(screens.map((screen) => screen.key), screens);
    expect(
      canAccessScreenFromData(screens, access, [], adminPerms, "/dashboard")
    ).toBe(true);
  });
});
