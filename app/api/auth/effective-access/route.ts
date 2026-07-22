import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import {
  canAccessPathWithEffectiveAccess,
  getEffectiveAccess,
} from "@/lib/rbac/get-effective-access";

export const GET = withAuth(async (request, session) => {
  const path = request.nextUrl.searchParams.get("path");
  const access = await getEffectiveAccess(session.userId);

  if (path) {
    const allowed = await canAccessPathWithEffectiveAccess(session.userId, path, access);
    return apiSuccess({
      permissions: access.permissions,
      role: access.role,
      permissionVersion: access.permissionVersion,
      userPermissionVersion: access.userPermissionVersion,
      path,
      allowed,
    });
  }

  return apiSuccess({
    permissions: access.permissions,
    role: access.role,
    permissionVersion: access.permissionVersion,
    userPermissionVersion: access.userPermissionVersion,
  });
});
