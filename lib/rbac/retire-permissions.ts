import type { PrismaClient } from "@prisma/client";
import { ALL_PERMISSIONS } from "@/lib/rbac/permissions";

/** Permission keys removed from the product — kept for DB cleanup only. */
export const RETIRED_PERMISSION_KEYS = [
  "skills.view",
  "skills.manage",
  "analytics.self.view",
  "analytics.team.view",
  "analytics.department.view",
  "access_requests.manage",
  "courses.instruct",
] as const;

/**
 * Soft-delete permissions that are no longer in the canonical catalog so they
 * disappear from the RBAC permission matrix UI.
 */
export async function retireObsoletePermissions(prisma: PrismaClient): Promise<number> {
  const canonicalKeys = new Set<string>(ALL_PERMISSIONS);

  const obsolete = await prisma.permission.findMany({
    where: {
      deletedAt: null,
      OR: [
        { key: { in: [...RETIRED_PERMISSION_KEYS] } },
        { key: { notIn: [...canonicalKeys] } },
      ],
    },
    select: { id: true, key: true },
  });

  if (obsolete.length === 0) return 0;

  const result = await prisma.permission.updateMany({
    where: { id: { in: obsolete.map((p) => p.id) } },
    data: { deletedAt: new Date() },
  });

  if (result.count > 0) {
    const keys = obsolete.map((p) => p.key).join(", ");
    console.log(`  ✓ Retired ${result.count} obsolete permission(s): ${keys}`);
  }

  return result.count;
}
