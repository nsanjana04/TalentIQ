import { describe, expect, it } from "vitest";
import { RoleSlug } from "@/constants/role-slugs";
import { Permission } from "@/lib/rbac/permissions";
import { getDefaultPermissionsForRole } from "@/lib/rbac/permission-matrix";
import { resolveEffectivePermissions } from "@/lib/rbac/getEffectivePermissions";
import { isPathAllowedByRoutePermissions } from "@/lib/rbac/get-effective-access";

describe("getEffectiveAccess path checks", () => {
  const employeePerms = getDefaultPermissionsForRole(RoleSlug.EMPLOYEE);

  it("employee without override cannot access employees route permissions", () => {
    const effective = resolveEffectivePermissions({
      userId: "u1",
      roleId: "r1",
      roleSlug: RoleSlug.EMPLOYEE,
      rolePermissions: employeePerms,
    });
    expect(effective.permissions).not.toContain(Permission.USERS_VIEW);
  });

  it("ALLOW screen override grants users.view for employees screen", () => {
    const effective = resolveEffectivePermissions({
      userId: "u1",
      roleId: "r1",
      roleSlug: RoleSlug.EMPLOYEE,
      rolePermissions: employeePerms,
      screenOverrides: [
        {
          overrideType: "ALLOW",
          requiredPermission: "employees.view",
        },
      ],
    });
    expect(effective.permissions).toContain(Permission.USERS_VIEW);
  });

  it("analytics.team.view satisfies /analytics route rule", () => {
    expect(
      isPathAllowedByRoutePermissions("/analytics", [Permission.ANALYTICS_VIEW])
    ).toBe(true);
  });

  it("employee defaults cannot access /analytics route rule", () => {
    expect(isPathAllowedByRoutePermissions("/analytics", employeePerms)).toBe(false);
  });
});
