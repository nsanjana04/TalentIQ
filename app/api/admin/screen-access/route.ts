import { withAnyPermission } from "@/lib/api/with-auth";
import { apiSuccess } from "@/lib/errors/api-error";
import { Permission } from "@/lib/rbac/permissions";
import { RoleSlug } from "@/constants/role-slugs";
import { screenAccessService } from "@/services/screen-access.service";
import { prisma } from "@/lib/db/prisma";
import { canonicalRoleWhere, sortCanonicalRoles } from "@/lib/rbac/canonical-roles";
import { z } from "zod";

const updateSchema = z.object({
  roleId: z.string().min(1),
  screenId: z.string().min(1),
  enabled: z.boolean(),
  canView: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
  canManage: z.boolean(),
});

export const GET = withAnyPermission(
  [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE],
  async (request) => {
    const roleId = request.nextUrl.searchParams.get("roleId");

    if (!roleId) {
      const roles = sortCanonicalRoles(
        await prisma.role.findMany({
          where: canonicalRoleWhere,
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true },
        })
      );
      return apiSuccess({ roles, matrix: [] as Awaited<ReturnType<typeof screenAccessService.getRoleMatrix>> });
    }

    const matrix = await screenAccessService.getRoleMatrix(roleId);
    return apiSuccess({ roles: [], matrix });
  }
);

export const PUT = withAnyPermission(
  [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE],
  async (request, session) => {
    const body = updateSchema.parse(await request.json());
    const role = await prisma.role.findUnique({ where: { id: body.roleId } });
    if (!role) {
      throw new Error("Role not found");
    }

    const updated = await screenAccessService.updateRoleScreenAccess(
      session.userId,
      body.roleId,
      body.screenId,
      {
        enabled: body.enabled,
        canView: body.canView,
        canCreate: body.canCreate,
        canUpdate: body.canUpdate,
        canDelete: body.canDelete,
        canManage: body.canManage,
      }
    );

    return apiSuccess(updated);
  }
);
