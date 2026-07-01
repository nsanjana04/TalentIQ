import { prisma } from "@/lib/db/prisma";
import { canonicalRoleWhere, sortCanonicalRoles } from "@/lib/rbac/canonical-roles";

export const roleRepository = {
  async findAll() {
    const roles = await prisma.role.findMany({
      where: canonicalRoleWhere,
      orderBy: { name: "asc" },
    });
    return sortCanonicalRoles(roles);
  },

  async findBySlug(slug: string) {
    return prisma.role.findUnique({ where: { slug } });
  },

  async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
    });
  },
};
