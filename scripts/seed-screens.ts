import { PrismaClient } from "@prisma/client";
import { RoleSlug } from "../constants/role-slugs";
import {
  resolveDefaultEnabledScreenKeys,
  SCREEN_DEFINITIONS,
} from "../lib/screens/screen-definitions";
import { retireObsoleteScreens } from "../lib/screens/retire-screens";
import { retireObsoleteRoles } from "../lib/rbac/retire-roles";
import { canonicalRoleWhere } from "../lib/rbac/canonical-roles";

const prisma = new PrismaClient();

export async function seedScreens(): Promise<void> {
  console.log("  Seeding screen registry…");

  await retireObsoleteScreens(prisma);
  await retireObsoleteRoles(prisma);

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

  console.log(`  ✓ Screens: ${SCREEN_DEFINITIONS.length}`);

  const roles = await prisma.role.findMany({ where: canonicalRoleWhere });
  const allScreenKeys = SCREEN_DEFINITIONS.map((s) => s.key);

  for (const role of roles) {
    const slug = role.slug as RoleSlug;
    const enabledKeys = resolveDefaultEnabledScreenKeys(slug, allScreenKeys);
    const enabledSet = new Set(enabledKeys);

    for (const screenKey of allScreenKeys) {
      const screenId = screenMap.get(screenKey);
      if (!screenId) continue;

      const enabled = enabledSet.has(screenKey);
      await prisma.roleScreenAccess.upsert({
        where: { roleId_screenId: { roleId: role.id, screenId } },
        update: {
          enabled,
          canView: enabled,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canManage: false,
        },
        create: {
          roleId: role.id,
          screenId,
          enabled,
          canView: enabled,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canManage: false,
        },
      });
    }
  }

  console.log(`  ✓ Role screen access: ${roles.length} roles × ${allScreenKeys.length} screens`);
}

if (require.main === module) {
  seedScreens()
    .then(async () => {
      await prisma.$disconnect();
      console.log("Screen seed complete.");
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
