import type { RoleSlug } from "@/constants/role-slugs";

/** Auth session query — include userId so cache cannot bleed across users. */
export function authMeQueryKey(userId?: string | null) {
  return ["auth", "me", userId ?? "anonymous"] as const;
}

export function dashboardOverviewQueryKey(userId?: string | null, role?: RoleSlug | null) {
  return ["dashboard", "overview", userId ?? "anonymous", role ?? "unknown"] as const;
}

export function userScopedKey(base: readonly string[], userId?: string | null, role?: RoleSlug | null) {
  return [...base, userId ?? "anonymous", role ?? "unknown"] as const;
}
