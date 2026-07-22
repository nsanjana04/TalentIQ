import { PrismaClient } from "@prisma/client";
import { RoleSlug } from "../constants/role-slugs";
import {
  resolveDefaultEnabledScreenKeys,
  SCREEN_DEFINITIONS,
} from "../lib/screens/screen-definitions";
import { retireObsoleteScreens } from "../lib/screens/retire-screens";
import { resolveAccessibleScreens } from "../lib/screens/screen-access-resolver";
import { getDefaultPermissionsForRole } from "../lib/rbac/permission-matrix";
import type { Permission } from "../lib/rbac/permissions";

const prisma = new PrismaClient();

function enabledKeysForRole(slug: string, allKeys: string[]): Set<string> {
  return new Set(resolveDefaultEnabledScreenKeys(slug as RoleSlug, allKeys));
}

export async function repairScreenAccess(): Promise<{
  screensBefore: number;
  screensAfter: number;
  rsaBefore: number;
  rsaAfter: number;
  rowsCreated: number;
  rowsUpdated: number;
  rolesMissingBefore: { slug: string; missing: number }[];
  visibleCounts: Record<string, number>;
}> {
  console.log("Screen Access Repair");
  console.log("====================\n");

  const screensBefore = await prisma.screen.count();
  const rsaBefore = await prisma.roleScreenAccess.count();
  const roles = await prisma.role.findMany({ where: { deletedAt: null } });
  const allScreenKeys = SCREEN_DEFINITIONS.map((s) => s.key);

  console.log("── Before repair ──");
  console.log(`  Screens: ${screensBefore}`);
  console.log(`  RoleScreenAccess rows: ${rsaBefore}`);
  console.log(`  Roles: ${roles.length}`);

  const rolesMissingBefore: { slug: string; missing: number }[] = [];
  for (const role of roles) {
    const count = await prisma.roleScreenAccess.count({ where: { roleId: role.id } });
    const missing = allScreenKeys.length - count;
    if (missing > 0) {
      rolesMissingBefore.push({ slug: role.slug, missing });
      console.log(`  ⚠ ${role.slug}: missing ${missing}/${allScreenKeys.length} RoleScreenAccess rows`);
    }
    const enabled = await prisma.roleScreenAccess.count({
      where: { roleId: role.id, enabled: true },
    });
    console.log(`  ${role.slug}: ${enabled}/${count} screens enabled`);
  }

  if (screensBefore === 0) {
    console.log("\n  ⚠ Screen table empty — seeding from definitions…");
  }

  await retireObsoleteScreens(prisma);

  const screenMap = new Map<string, string>();
  for (const def of SCREEN_DEFINITIONS) {
    const screen = await prisma.screen.upsert({
      where: { key: def.key },
      update: {
        label: def.label,
        description: def.description ?? null,
        route: def.route,
        section: def.section,
        icon: def.icon,
        sectionOrder: def.sectionOrder,
        order: def.order,
        requiredPermission: def.requiredPermission,
        isSidebarItem: def.isSidebarItem ?? true,
        isActive: true,
        isSystem: def.isSystem ?? false,
        isPersonal: def.isPersonal ?? false,
      },
      create: {
        key: def.key,
        label: def.label,
        description: def.description ?? null,
        route: def.route,
        section: def.section,
        icon: def.icon,
        sectionOrder: def.sectionOrder,
        order: def.order,
        requiredPermission: def.requiredPermission,
        isSidebarItem: def.isSidebarItem ?? true,
        isActive: true,
        isSystem: def.isSystem ?? false,
        isPersonal: def.isPersonal ?? false,
      },
    });
    screenMap.set(def.key, screen.id);
  }

  let rowsCreated = 0;
  let rowsUpdated = 0;

  for (const role of roles) {
    const enabledSet = enabledKeysForRole(role.slug, allScreenKeys);
    const forceRepair =
      role.slug === RoleSlug.ADMIN ||
      role.slug === RoleSlug.MANAGER ||
      role.slug === RoleSlug.EMPLOYEE;

    for (const screenKey of allScreenKeys) {
      const screenId = screenMap.get(screenKey);
      if (!screenId) continue;

      const shouldEnable = enabledSet.has(screenKey);
      const existing = await prisma.roleScreenAccess.findUnique({
        where: { roleId_screenId: { roleId: role.id, screenId } },
      });

      if (!existing) {
        await prisma.roleScreenAccess.create({
          data: {
            roleId: role.id,
            screenId,
            enabled: shouldEnable,
            canView: shouldEnable,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canManage: false,
          },
        });
        rowsCreated++;
        continue;
      }

      if (forceRepair && (existing.enabled !== shouldEnable || existing.canView !== shouldEnable)) {
        await prisma.roleScreenAccess.update({
          where: { roleId_screenId: { roleId: role.id, screenId } },
          data: {
            enabled: shouldEnable,
            canView: shouldEnable,
          },
        });
        rowsUpdated++;
      }
    }
  }

  const screensAfter = await prisma.screen.count();
  const rsaAfter = await prisma.roleScreenAccess.count();

  console.log("\n── After repair ──");
  console.log(`  Screens: ${screensAfter}`);
  console.log(`  RoleScreenAccess rows: ${rsaAfter}`);
  console.log(`  Rows created: ${rowsCreated}`);
  console.log(`  Rows updated: ${rowsUpdated}`);

  const visibleCounts: Record<string, number> = {};
  const screens = await prisma.screen.findMany({
    where: { isActive: true },
    orderBy: [{ sectionOrder: "asc" }, { order: "asc" }],
  });

  const reportRoles = new Set<string>([
    RoleSlug.ADMIN,
    RoleSlug.MANAGER,
    RoleSlug.EMPLOYEE,
  ]);

  for (const role of roles) {
    if (!reportRoles.has(role.slug)) {
      continue;
    }

    const roleAccess = await prisma.roleScreenAccess.findMany({ where: { roleId: role.id } });
    const rolePerms = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });
    const permissions = rolePerms.map((rp) => rp.permission.key as Permission);
    const fallbackPerms =
      permissions.length > 0
        ? permissions
        : getDefaultPermissionsForRole(role.slug as RoleSlug);

    const visible = resolveAccessibleScreens({
      screens: screens.map((s) => ({
        id: s.id,
        key: s.key,
        label: s.label,
        description: s.description,
        route: s.route,
        section: s.section,
        icon: s.icon,
        sectionOrder: s.sectionOrder,
        order: s.order,
        requiredPermission: s.requiredPermission,
        isSidebarItem: s.isSidebarItem,
        isActive: s.isActive,
        isPersonal: s.isPersonal,
      })),
      roleAccess,
      userOverrides: [],
      permissions: fallbackPerms,
      sidebarOnly: true,
    });

    visibleCounts[role.slug] = visible.length;
    console.log(`  ${role.slug} visible screens: ${visible.length}`);
  }

  console.log("\n✅ Screen access repair complete.");
  if (rolesMissingBefore.length > 0) {
    console.log(
      "Root cause: RoleScreenAccess rows were missing or all disabled for affected roles."
    );
  } else if (rsaBefore > 0 && Object.values(visibleCounts).some((c) => c === 0)) {
    console.log(
      "Root cause: RoleScreenAccess existed but enabled flags or permissions blocked all screens."
    );
  }

  return {
    screensBefore,
    screensAfter,
    rsaBefore,
    rsaAfter,
    rowsCreated,
    rowsUpdated,
    rolesMissingBefore,
    visibleCounts,
  };
}

if (require.main === module) {
  repairScreenAccess()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error("Repair failed:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
