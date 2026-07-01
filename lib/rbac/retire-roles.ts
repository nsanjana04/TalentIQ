import type { PrismaClient } from "@prisma/client";
import {
  CANONICAL_ROLE_SLUGS,
  isCanonicalRoleSlug,
  resolveLegacyRoleMigrationTarget,
} from "@/lib/rbac/canonical-roles";

/**
 * Soft-delete roles outside the 3-role product model and reassign users
 * to the closest canonical role.
 */
export async function retireObsoleteRoles(prisma: PrismaClient): Promise<{
  retired: number;
  usersReassigned: number;
}> {
  const canonical = await prisma.role.findMany({
    where: { deletedAt: null, slug: { in: [...CANONICAL_ROLE_SLUGS] } },
    select: { id: true, slug: true },
  });
  const canonicalBySlug = new Map(canonical.map((role) => [role.slug, role.id]));

  const obsolete = await prisma.role.findMany({
    where: {
      deletedAt: null,
      slug: { notIn: [...CANONICAL_ROLE_SLUGS] },
    },
    select: { id: true, slug: true, name: true },
  });

  if (obsolete.length === 0) {
    return { retired: 0, usersReassigned: 0 };
  }

  let usersReassigned = 0;

  for (const role of obsolete) {
    const targetSlug = resolveLegacyRoleMigrationTarget(role.slug);
    const targetRoleId = canonicalBySlug.get(targetSlug);
    if (!targetRoleId) continue;

    const reassigned = await prisma.user.updateMany({
      where: { roleId: role.id, deletedAt: null },
      data: { roleId: targetRoleId },
    });
    usersReassigned += reassigned.count;
  }

  const retired = await prisma.role.updateMany({
    where: { id: { in: obsolete.map((role) => role.id) } },
    data: { deletedAt: new Date() },
  });

  if (retired.count > 0) {
    const names = obsolete.map((role) => role.slug).join(", ");
    console.log(`  ✓ Retired ${retired.count} obsolete role(s): ${names}`);
    if (usersReassigned > 0) {
      console.log(`  ✓ Reassigned ${usersReassigned} user(s) to canonical roles`);
    }
  }

  return { retired: retired.count, usersReassigned };
}

/** Guard against non-canonical slugs at write time. */
export function assertCanonicalRoleSlug(slug: string): void {
  if (!isCanonicalRoleSlug(slug)) {
    throw new Error(`Role slug "${slug}" is not part of the TalentIQ role model.`);
  }
}
