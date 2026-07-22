import type { ScreenOverrideType } from "@prisma/client";
import { resolveScreenPermission } from "@/lib/screens/screen-permissions";
import type { Permission } from "./permissions";

export interface ScreenPermissionOverrideInput {
  overrideType: ScreenOverrideType;
  requiredPermission: string | null;
  expiresAt?: Date | string | null;
}

function isExpired(expiresAt?: Date | string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
}

/**
 * Applies user screen ALLOW/DENY overrides to a permission set.
 * ALLOW grants only the screen's resolved requiredPermission (never broad manage perms).
 * DENY always wins and runs after ALLOW grants.
 */
export function applyScreenOverridePermissions(
  grantedSet: Set<Permission>,
  denied: Permission[],
  grantSources: Map<Permission, "role" | "user_override" | "screen_override">,
  screenOverrides: ScreenPermissionOverrideInput[]
): void {
  const active = screenOverrides.filter((row) => !isExpired(row.expiresAt));

  for (const override of active) {
    if (override.overrideType !== "ALLOW") continue;
    const permission = resolveScreenPermission(override.requiredPermission);
    if (!permission) continue;
    grantedSet.add(permission);
    const deniedIndex = denied.indexOf(permission);
    if (deniedIndex >= 0) {
      denied.splice(deniedIndex, 1);
    }
    grantSources.set(permission, "screen_override");
  }

  for (const override of active) {
    if (override.overrideType !== "DENY") continue;
    const permission = resolveScreenPermission(override.requiredPermission);
    if (!permission) continue;
    grantedSet.delete(permission);
    if (!denied.includes(permission)) {
      denied.push(permission);
    }
    grantSources.delete(permission);
  }
}

export function screenOverridesToPermissionKeys(
  screenOverrides: ScreenPermissionOverrideInput[],
  overrideType: ScreenOverrideType
): Permission[] {
  return screenOverrides
    .filter((row) => !isExpired(row.expiresAt) && row.overrideType === overrideType)
    .map((row) => resolveScreenPermission(row.requiredPermission))
    .filter((permission): permission is Permission => permission !== null);
}
