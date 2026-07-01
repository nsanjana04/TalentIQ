import type { PrismaClient } from "@prisma/client";
import { SCREEN_DEFINITIONS } from "@/lib/screens/screen-definitions";

/** Screens removed from the product — kept for DB cleanup only. */
export const RETIRED_SCREEN_KEYS = [
  "org-chart",
  "talent-marketplace",
  "reviews",
  "promotion-readiness",
  "admin-users",
  "admin-departments",
  "admin-access-requests",
  "executive-intelligence",
  "employees",
  "contractors",
  "departments",
  "teams",
  "skill-matrix",
  "skill-framework",
  "competency-models",
  "skill-validation",
  "learning-programs",
  "career",
  "career-progression",
  "succession-planning",
  "executive-analytics",
  "department-analytics",
  "team-analytics",
  "compliance-analytics",
  "workforce-forecasting",
  "admin-audit-logs",
  "goals",
  "reviews",
  "promotion-readiness",
  "org-chart",
  "talent-marketplace",
] as const;

export const RETIRED_SCREEN_ROUTES = [
  "/org-chart",
  "/talent-marketplace",
  "/reviews",
  "/promotion",
  "/admin/access-requests",
  "/admin/audit-logs",
  "/employees",
  "/contractors",
  "/departments",
  "/teams",
  "/skill-matrix",
  "/skill-framework",
  "/competency-models",
  "/skill-validation",
  "/learning-programs",
  "/career",
  "/career-progression",
  "/succession-planning",
  "/executive-analytics",
  "/department-analytics",
  "/team-analytics",
  "/compliance-analytics",
  "/workforce-forecasting",
  "/executive-intelligence",
] as const;

/**
 * Deactivate screens that were removed from SCREEN_DEFINITIONS so they no longer
 * appear in the sidebar, search, or screen-access admin matrix.
 */
export async function retireObsoleteScreens(prisma: PrismaClient): Promise<{
  deactivated: number;
  accessDisabled: number;
}> {
  const canonicalKeys = SCREEN_DEFINITIONS.map((s) => s.key);

  const obsolete = await prisma.screen.findMany({
    where: {
      OR: [
        { key: { in: [...RETIRED_SCREEN_KEYS] } },
        { route: { in: [...RETIRED_SCREEN_ROUTES] } },
        { key: { notIn: canonicalKeys }, isActive: true },
      ],
    },
    select: { id: true, key: true },
  });

  if (obsolete.length === 0) {
    return { deactivated: 0, accessDisabled: 0 };
  }

  const ids = obsolete.map((s) => s.id);

  const deactivated = await prisma.screen.updateMany({
    where: { id: { in: ids } },
    data: { isActive: false, isSidebarItem: false },
  });

  const accessDisabled = await prisma.roleScreenAccess.updateMany({
    where: { screenId: { in: ids } },
    data: {
      enabled: false,
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canManage: false,
    },
  });

  if (deactivated.count > 0) {
    const keys = obsolete.map((s) => s.key).join(", ");
    console.log(`  ✓ Retired ${deactivated.count} obsolete screen(s): ${keys}`);
  }

  return { deactivated: deactivated.count, accessDisabled: accessDisabled.count };
}
