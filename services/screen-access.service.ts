import type { Permission } from "@/lib/rbac/permissions";
import {
  canAccessScreenFromData,
  findScreenForPathname,
  groupScreensBySection,
  resolveAccessibleScreens,
  type ScreenRecord,
  type SidebarSection,
} from "@/lib/screens/screen-access-resolver";
import { getUserScreenContext, screenRepository } from "@/repositories/screen.repository";
import { permissionVersionService } from "@/lib/rbac/permission-version.service";
import { resolveScreenPermission } from "@/lib/screens/screen-permissions";
import {
  isPrivilegedEmergencyRole,
  resolveSidebarWithEmergencyFallback,
} from "@/lib/screens/emergency-screen-access";
import { ROUTES } from "@/constants/routes";
import { prisma } from "@/lib/db/prisma";
import { isCanonicalScreenKey } from "@/lib/screens/canonical-screens";
import { getRoleScreenScope, isScreenInRoleScope } from "@/lib/rbac/role-scope";
import type { RoleSlug } from "@/constants/role-slugs";

function toScreenRecord(screen: {
  id: string;
  key: string;
  label: string;
  description: string | null;
  route: string;
  section: string;
  icon: string;
  sectionOrder: number;
  order: number;
  requiredPermission: string | null;
  isSidebarItem: boolean;
  isActive: boolean;
  isPersonal: boolean;
}): ScreenRecord {
  return {
    id: screen.id,
    key: screen.key,
    label: screen.label,
    description: screen.description,
    route: screen.route,
    section: screen.section,
    icon: screen.icon,
    sectionOrder: screen.sectionOrder,
    order: screen.order,
    requiredPermission: screen.requiredPermission,
    isSidebarItem: screen.isSidebarItem,
    isActive: screen.isActive,
    isPersonal: screen.isPersonal,
  };
}

async function loadAccessContext(userId: string) {
  const { roleId, roleSlug, permissions } = await getUserScreenContext(userId);
  const [screens, roleAccess, userOverrides] = await Promise.all([
    screenRepository.findAllActive(),
    screenRepository.getRoleScreenAccess(roleId),
    screenRepository.getUserOverrides(userId),
  ]);

  return {
    roleId,
    roleSlug,
    permissions,
    screens: screens.map(toScreenRecord),
    roleAccess,
    userOverrides: userOverrides.map((row) => ({
      screenId: row.screenId,
      overrideType: row.overrideType,
      enabled: row.enabled,
      expiresAt: row.expiresAt,
    })),
  };
}

export const screenAccessService = {
  async getSidebar(userId: string): Promise<{ sections: SidebarSection[] }> {
    const ctx = await loadAccessContext(userId);
    const { sections } = resolveSidebarWithEmergencyFallback({
      roleSlug: ctx.roleSlug,
      screens: ctx.screens,
      roleAccess: ctx.roleAccess,
      userOverrides: ctx.userOverrides,
      permissions: ctx.permissions,
      sidebarOnly: true,
    });
    return { sections };
  },

  async getAccessibleScreens(userId: string): Promise<ScreenRecord[]> {
    const ctx = await loadAccessContext(userId);
    return resolveAccessibleScreens({ ...ctx, sidebarOnly: true });
  },

  async canAccessScreen(
    userId: string,
    keyOrRoute: string,
    permissions?: Permission[]
  ): Promise<boolean> {
    const ctx = await loadAccessContext(userId);
    return canAccessScreenFromData(
      ctx.screens,
      ctx.roleAccess,
      ctx.userOverrides,
      permissions ?? ctx.permissions,
      keyOrRoute
    );
  },

  async checkRouteAccess(
    userId: string,
    pathname: string,
    permissions: Permission[]
  ): Promise<{ allowed: boolean; reason?: "not_found" | "inactive" | "denied" | "forbidden" }> {
    const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";

    if (normalized === ROUTES.ACCOUNT || normalized.startsWith(`${ROUTES.ACCOUNT}/`)) {
      return { allowed: true };
    }

    const screens = (await screenRepository.findAll()).map(toScreenRecord);
    const screen = findScreenForPathname(screens, pathname);

    if (!screen) {
      return { allowed: false, reason: "not_found" };
    }
    if (!screen.isActive) {
      return { allowed: false, reason: "inactive" };
    }

    const ctx = await loadAccessContext(userId);

    if (
      isPrivilegedEmergencyRole(ctx.roleSlug) &&
      (normalized === ROUTES.DASHBOARD || normalized.startsWith(`${ROUTES.DASHBOARD}/`))
    ) {
      return { allowed: true };
    }

    const allowed = canAccessScreenFromData(
      screens.filter((s) => s.isActive),
      ctx.roleAccess,
      ctx.userOverrides,
      permissions,
      screen.key
    );

    if (!allowed) {
      return { allowed: false, reason: "forbidden" };
    }
    return { allowed: true };
  },

  async getAllScreens() {
    const screens = await screenRepository.findAllActive();
    return screens.map((screen) => ({
        id: screen.id,
        key: screen.key,
        label: screen.label,
        route: screen.route,
        section: screen.section,
        sectionOrder: screen.sectionOrder,
        order: screen.order,
        requiredPermission: screen.requiredPermission,
        isActive: screen.isActive,
      }));
  },

  async getRoleScreens(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
    if (!role) throw new Error("Role not found");

    const rolePermissionKeys = new Set(
      role.rolePermissions.map((rp) => rp.permission.key)
    );

    const rows = await screenRepository.getRoleMatrix(roleId);
    const screenScope = new Set(getRoleScreenScope(role.slug as RoleSlug));

    return rows
      .filter((screen) => screenScope.has(screen.key))
      .map((screen) => {
        const access = screen.roleScreenAccess[0];
        const enabled = access?.enabled ?? false;
        const requiredPermission = screen.requiredPermission;
        const resolved = resolveScreenPermission(requiredPermission);
        const permissionGranted =
          !requiredPermission ||
          screen.isPersonal ||
          (resolved
            ? rolePermissionKeys.has(resolved)
            : rolePermissionKeys.has(requiredPermission));

        return {
          screenId: screen.id,
          key: screen.key,
          label: screen.label,
          route: screen.route,
          section: screen.section,
          sectionOrder: screen.sectionOrder,
          order: screen.order,
          requiredPermission,
          enabled,
          permissionGranted,
          isVisible: enabled && permissionGranted,
          permissionWarning:
            enabled && !permissionGranted && !!requiredPermission
              ? "Screen is enabled but hidden because required permission is missing"
              : null,
        };
      });
  },

  async patchRoleScreen(roleId: string, screenId: string, enabled: boolean, actorId: string) {
    const role = await prisma.role.findUnique({ where: { id: roleId }, select: { slug: true } });
    if (!role) throw new Error("Role not found");

    const screen = await screenRepository.findById(screenId);
    if (!screen) throw new Error("Screen not found");
    if (!isScreenInRoleScope(role.slug as RoleSlug, screen.key)) {
      throw new Error(`Screen "${screen.key}" is outside the ${role.slug} role scope.`);
    }

    return this.updateRoleScreenAccess(
      actorId,
      roleId,
      screenId,
      {
        enabled,
        canView: enabled,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canManage: false,
      },
      enabled ? "ROLE_SCREEN_ENABLED" : "ROLE_SCREEN_DISABLED"
    );
  },

  async getRoleMatrix(roleId: string) {
    const rows = await screenRepository.getRoleMatrix(roleId);
    return rows.map((screen) => {
      const access = screen.roleScreenAccess[0];
      return {
        screenId: screen.id,
        key: screen.key,
        label: screen.label,
        route: screen.route,
        section: screen.section,
        sectionOrder: screen.sectionOrder,
        order: screen.order,
        enabled: access?.enabled ?? false,
        canView: access?.canView ?? false,
        canCreate: access?.canCreate ?? false,
        canUpdate: access?.canUpdate ?? false,
        canDelete: access?.canDelete ?? false,
        canManage: access?.canManage ?? false,
      };
    });
  },

  async updateRoleScreenAccess(
    actorId: string,
    roleId: string,
    screenId: string,
    data: {
      enabled: boolean;
      canView: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canManage: boolean;
    },
    action = "ROLE_SCREEN_ACCESS_UPDATE"
  ) {
    const existing = await screenRepository.getRoleScreenAccess(roleId);
    const before = existing.find((row) => row.screenId === screenId);

    const updated = await screenRepository.upsertRoleScreenAccess(roleId, screenId, data);

    await screenRepository.createAudit({
      actorId,
      targetRoleId: roleId,
      screenId,
      action,
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: JSON.stringify(updated),
    });

    await permissionVersionService.bumpForRolePermissionChange();
    return updated;
  },

  async setUserOverride(
    actorId: string,
    userId: string,
    screenId: string,
    data: {
      overrideType: "ALLOW" | "DENY";
      reason: string;
      expiresAt?: Date | null;
    }
  ) {
    const existing = await screenRepository.getUserOverrides(userId);
    const before = existing.find((row) => row.screenId === screenId);

    const updated = await screenRepository.upsertUserOverride(userId, screenId, {
      overrideType: data.overrideType,
      enabled: data.overrideType === "ALLOW",
      reason: data.reason,
      expiresAt: data.expiresAt ?? null,
      createdById: actorId,
    });

    await screenRepository.createAudit({
      actorId,
      targetUserId: userId,
      screenId,
      action: "USER_SCREEN_OVERRIDE_ADDED",
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: JSON.stringify(updated),
    });

    await permissionVersionService.bumpForUserPermissionChange(userId);
    return updated;
  },

  async clearUserOverride(actorId: string, userId: string, screenId: string) {
    const existing = await screenRepository.getUserOverrides(userId);
    const before = existing.find((row) => row.screenId === screenId);

    await screenRepository.deleteUserOverride(userId, screenId);

    await screenRepository.createAudit({
      actorId,
      targetUserId: userId,
      screenId,
      action: "USER_SCREEN_OVERRIDE_REMOVED",
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: null,
    });

    await permissionVersionService.bumpForUserPermissionChange(userId);
  },

  async removeUserOverrideById(actorId: string, overrideId: string) {
    const override = await screenRepository.findUserOverrideById(overrideId);
    if (!override) throw new Error("Override not found");

    await screenRepository.deleteUserOverrideById(overrideId);

    await screenRepository.createAudit({
      actorId,
      targetUserId: override.userId,
      screenId: override.screenId,
      action: "USER_SCREEN_OVERRIDE_REMOVED",
      beforeJson: JSON.stringify(override),
      afterJson: null,
    });

    await permissionVersionService.bumpForUserPermissionChange(override.userId);
  },

  async getUserOverrideDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new Error("User not found");

    const [screens, overrides, roleScreens] = await Promise.all([
      screenRepository.findAll(),
      prisma.userScreenOverride.findMany({
        where: { userId },
        include: { screen: true },
        orderBy: { createdAt: "desc" },
      }),
      this.getRoleScreens(user.roleId),
    ]);

    const roleDefaultKeys = new Set(
      roleScreens.filter((s) => s.enabled).map((s) => s.key)
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        role: { id: user.roleId, name: user.role.name, slug: user.role.slug },
      },
      roleDefaultScreens: roleScreens.filter((s) => s.enabled),
      overrides: overrides.map((row) => ({
        id: row.id,
        screenId: row.screenId,
        key: row.screen.key,
        label: row.screen.label,
        route: row.screen.route,
        section: row.screen.section,
        overrideType: row.overrideType,
        reason: row.reason,
        expiresAt: row.expiresAt?.toISOString() ?? null,
        isExpired: row.expiresAt ? row.expiresAt <= new Date() : false,
        createdAt: row.createdAt.toISOString(),
      })),
      availableScreens: screens
        .filter(
          (s) =>
            s.isActive &&
            isCanonicalScreenKey(s.key) &&
            isScreenInRoleScope(user.role.slug as RoleSlug, s.key)
        )
        .map((s) => ({
          screenId: s.id,
          key: s.key,
          label: s.label,
          route: s.route,
          section: s.section,
          requiredPermission: s.requiredPermission,
          inRoleDefault: roleDefaultKeys.has(s.key),
        })),
    };
  },

  async getUserOverrides(userId: string) {
    const overrides = await prisma.userScreenOverride.findMany({
      where: { userId },
      include: { screen: true },
      orderBy: { createdAt: "desc" },
    });

    return overrides.map((override) => ({
      id: override.id,
      screenId: override.screenId,
      key: override.screen.key,
      label: override.screen.label,
      route: override.screen.route,
      section: override.screen.section,
      overrideType: override.overrideType,
      reason: override.reason,
      expiresAt: override.expiresAt?.toISOString() ?? null,
      isExpired: override.expiresAt ? override.expiresAt <= new Date() : false,
    }));
  },
};

/** Server-side helper for dashboard links and other modules. */
export async function canAccessScreen(
  userId: string,
  keyOrRoute: string
): Promise<boolean> {
  return screenAccessService.canAccessScreen(userId, keyOrRoute);
}
