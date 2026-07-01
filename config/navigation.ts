import { Permission } from "@/lib/rbac/permissions";
import { RoleSlug } from "@/constants/role-slugs";
import { ROUTES } from "@/constants/routes";
import type { SidebarNavItem } from "@/lib/rbac/types";

export type NavSection =
  | "COMMAND CENTER"
  | "LEARNING & DEVELOPMENT"
  | "ANALYTICS"
  | "ADMINISTRATION"
  | "ACCOUNT";

export interface NavigationItem extends SidebarNavItem {
  section: NavSection;
  requiredPermissions: Permission[];
  badgeKey?: string;
}

/**
 * Static navigation seed / validation source.
 * Sidebar rendering uses GET /api/navigation/sidebar (database screen registry).
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "dashboard",
    section: "COMMAND CENTER",
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: "LayoutDashboard",
    permissions: [Permission.DASHBOARD_VIEW],
    requiredPermissions: [Permission.DASHBOARD_VIEW],
    mode: "any",
    description: "Workforce command center overview",
  },
  {
    id: "ai-copilot",
    section: "COMMAND CENTER",
    label: "AI Workforce Copilot",
    href: ROUTES.AI_COPILOT,
    icon: "Bot",
    permissions: [Permission.DASHBOARD_VIEW],
    requiredPermissions: [Permission.DASHBOARD_VIEW],
    mode: "any",
  },
  {
    id: "war-room",
    section: "COMMAND CENTER",
    label: "Executive War Room",
    href: ROUTES.WAR_ROOM,
    icon: "Crown",
    permissions: [Permission.ANALYTICS_EXECUTIVE_VIEW],
    requiredPermissions: [Permission.ANALYTICS_EXECUTIVE_VIEW],
    mode: "any",
    allowedRoles: [RoleSlug.ADMIN],
    isAdminOnly: true,
  },
  {
    id: "learning",
    section: "LEARNING & DEVELOPMENT",
    label: "Learning Pathways",
    href: ROUTES.LEARNING,
    icon: "Route",
    permissions: [Permission.COURSES_VIEW],
    requiredPermissions: [Permission.COURSES_VIEW],
    mode: "any",
  },
  {
    id: "admin-learning",
    section: "LEARNING & DEVELOPMENT",
    label: "Learning Administration",
    href: ROUTES.ADMIN_LEARNING,
    icon: "GraduationCap",
    permissions: [
      Permission.LEARNING_ASSIGNMENTS_CREATE,
      Permission.LEARNING_COURSES_MANAGE,
      Permission.COURSES_MANAGE,
    ],
    requiredPermissions: [
      Permission.LEARNING_ASSIGNMENTS_CREATE,
      Permission.LEARNING_COURSES_MANAGE,
      Permission.COURSES_MANAGE,
    ],
    mode: "any",
    allowedRoles: [RoleSlug.ADMIN, RoleSlug.MANAGER],
  },
  {
    id: "courses",
    section: "LEARNING & DEVELOPMENT",
    label: "Courses",
    href: ROUTES.COURSES,
    icon: "BookOpen",
    permissions: [Permission.COURSES_VIEW, Permission.COURSES_MANAGE],
    requiredPermissions: [Permission.COURSES_VIEW, Permission.COURSES_MANAGE],
    mode: "any",
  },
  {
    id: "assessments",
    section: "LEARNING & DEVELOPMENT",
    label: "Assessments",
    href: ROUTES.ASSESSMENTS,
    icon: "ClipboardCheck",
    permissions: [Permission.ASSESSMENTS_TAKE, Permission.ASSESSMENTS_MANAGE],
    requiredPermissions: [Permission.ASSESSMENTS_TAKE, Permission.ASSESSMENTS_MANAGE],
    mode: "any",
  },
  {
    id: "certificates",
    section: "LEARNING & DEVELOPMENT",
    label: "Certifications",
    href: ROUTES.CERTIFICATIONS,
    icon: "Award",
    permissions: [
      Permission.CERTIFICATES_SELF_VIEW,
      Permission.CERTIFICATES_VIEW,
      Permission.CERTIFICATES_MANAGE,
    ],
    requiredPermissions: [
      Permission.CERTIFICATES_SELF_VIEW,
      Permission.CERTIFICATES_VIEW,
      Permission.CERTIFICATES_MANAGE,
    ],
    mode: "any",
    badgeKey: "certificates",
  },
  {
    id: "analytics",
    section: "ANALYTICS",
    label: "Workforce Analytics",
    href: ROUTES.ANALYTICS,
    icon: "BarChart3",
    permissions: [Permission.ANALYTICS_VIEW],
    requiredPermissions: [Permission.ANALYTICS_VIEW],
    mode: "any",
  },
  {
    id: "reports",
    section: "ANALYTICS",
    label: "Reports",
    href: ROUTES.REPORTS,
    icon: "FileText",
    permissions: [Permission.REPORTS_VIEW],
    requiredPermissions: [Permission.REPORTS_VIEW],
    mode: "any",
  },
  {
    id: "admin-people",
    section: "ADMINISTRATION",
    label: "People & Organization",
    href: ROUTES.ADMIN_PEOPLE,
    icon: "UsersRound",
    permissions: [Permission.USERS_VIEW, Permission.DEPARTMENTS_VIEW, Permission.DEPARTMENTS_MANAGE],
    requiredPermissions: [Permission.USERS_VIEW, Permission.DEPARTMENTS_VIEW, Permission.DEPARTMENTS_MANAGE],
    mode: "any",
    allowedRoles: [RoleSlug.ADMIN],
    isAdminOnly: true,
  },
  {
    id: "admin-roles",
    section: "ADMINISTRATION",
    label: "RBAC & Permissions",
    href: ROUTES.ADMIN_ROLES,
    icon: "Shield",
    permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE],
    requiredPermissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE],
    mode: "any",
    allowedRoles: [RoleSlug.ADMIN],
    isAdminOnly: true,
    isSystemOnly: true,
    disallowedRoles: [RoleSlug.MANAGER],
  },
  {
    id: "system-settings",
    section: "ADMINISTRATION",
    label: "System Settings",
    href: ROUTES.SETTINGS,
    icon: "Cog",
    permissions: [Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE],
    requiredPermissions: [Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE],
    mode: "any",
    isSystemOnly: true,
    disallowedRoles: [RoleSlug.EMPLOYEE],
  },
  {
    id: "account",
    section: "ACCOUNT",
    label: "Account",
    href: ROUTES.ACCOUNT,
    icon: "Settings",
    permissions: [],
    requiredPermissions: [],
    mode: "any",
    isPersonal: true,
    description: "Profile, security, and notification preferences",
  },
];

/** Group filtered nav items by section for sidebar rendering. */
export function groupNavBySection(
  items: SidebarNavItem[]
): { section: NavSection; items: SidebarNavItem[] }[] {
  const sections: NavSection[] = [
    "COMMAND CENTER",
    "LEARNING & DEVELOPMENT",
    "ANALYTICS",
    "ADMINISTRATION",
    "ACCOUNT",
  ];
  return sections
    .map((section) => ({
      section,
      items: items.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);
}
