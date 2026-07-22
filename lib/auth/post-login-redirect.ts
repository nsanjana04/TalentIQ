import type { RoleSlug } from "@/constants/role-slugs";
import { ROUTES } from "@/constants/routes";
import {
  isPrivilegedEmergencyRole,
  resolvePostLoginFallbackPath,
} from "@/lib/screens/emergency-screen-access";
import { screenAccessService } from "@/services/screen-access.service";

/**
 * Resolve where to send the user after login.
 * Prefers the first visible sidebar screen; falls back by role when none are visible.
 */
export async function resolvePostLoginRedirect(
  userId: string,
  role: RoleSlug,
  requestedRedirect?: string | null
): Promise<string> {
  const sidebar = await screenAccessService.getSidebar(userId);
  const firstVisible = sidebar.sections.flatMap((section) => section.items)[0]?.route;

  if (firstVisible) {
    if (requestedRedirect && requestedRedirect !== ROUTES.LOGIN && requestedRedirect !== "/") {
      const allowed = sidebar.sections
        .flatMap((section) => section.items)
        .some((item) => {
          const route = item.route.split("?")[0].replace(/\/$/, "") || "/";
          const target = requestedRedirect.split("?")[0].replace(/\/$/, "") || "/";
          return route === target || target.startsWith(`${route}/`);
        });
      if (allowed) return requestedRedirect;
    }
    return firstVisible;
  }

  if (isPrivilegedEmergencyRole(role)) {
    return ROUTES.DASHBOARD;
  }

  return resolvePostLoginFallbackPath(role);
}
