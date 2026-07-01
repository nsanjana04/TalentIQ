import { RoleSlug } from "@/constants/role-slugs";

export interface ScreenSeedDefinition {
  key: string;
  label: string;
  route: string;
  section: string;
  icon: string;
  sectionOrder: number;
  order: number;
  requiredPermission: string | null;
  isSidebarItem?: boolean;
  isPersonal?: boolean;
  isSystem?: boolean;
  description?: string;
}

/** Canonical screens in the TalentIQ product (sidebar + hidden admin routes). */
export const SCREEN_DEFINITIONS: ScreenSeedDefinition[] = [
  // COMMAND CENTER
  { key: "dashboard", label: "Dashboard", route: "/dashboard", section: "COMMAND CENTER", icon: "LayoutDashboard", sectionOrder: 1, order: 1, requiredPermission: "dashboard.view" },
  { key: "ai-copilot", label: "AI Workforce Copilot", route: "/ai-copilot", section: "COMMAND CENTER", icon: "Bot", sectionOrder: 1, order: 2, requiredPermission: "ai.copilot.view" },
  { key: "executive-war-room", label: "Executive War Room", route: "/executive-war-room", section: "COMMAND CENTER", icon: "Crown", sectionOrder: 1, order: 3, requiredPermission: "executive.view", isSystem: true },

  // LEARNING & DEVELOPMENT
  { key: "learning-pathways", label: "Learning Pathways", route: "/learning", section: "LEARNING & DEVELOPMENT", icon: "Route", sectionOrder: 4, order: 31, requiredPermission: "learning.view" },
  { key: "courses", label: "Courses", route: "/courses", section: "LEARNING & DEVELOPMENT", icon: "BookOpen", sectionOrder: 4, order: 32, requiredPermission: "courses.view" },
  { key: "assessments", label: "Assessments", route: "/assessments", section: "LEARNING & DEVELOPMENT", icon: "ClipboardCheck", sectionOrder: 4, order: 33, requiredPermission: "assessments.view" },
  { key: "certifications", label: "Certifications", route: "/certifications", section: "LEARNING & DEVELOPMENT", icon: "Award", sectionOrder: 4, order: 34, requiredPermission: "certificates.view" },
  { key: "admin-learning", label: "Learning Administration", route: "/admin/learning", section: "LEARNING & DEVELOPMENT", icon: "GraduationCap", sectionOrder: 4, order: 35, requiredPermission: "learning.assignments.create", isSystem: true },

  // ANALYTICS
  { key: "workforce-analytics", label: "Workforce Analytics", route: "/analytics", section: "ANALYTICS", icon: "BarChart3", sectionOrder: 6, order: 50, requiredPermission: "analytics.view" },
  { key: "reports", label: "Reports", route: "/reports", section: "ANALYTICS", icon: "FileText", sectionOrder: 6, order: 56, requiredPermission: "reports.view" },

  // ADMINISTRATION
  { key: "admin-people", label: "People & Organization", route: "/admin/people", section: "ADMINISTRATION", icon: "UsersRound", sectionOrder: 7, order: 60, requiredPermission: "users.view", isSystem: true },
  { key: "admin-roles", label: "RBAC & Permissions", route: "/admin/roles", section: "ADMINISTRATION", icon: "Shield", sectionOrder: 7, order: 61, requiredPermission: "rbac.manage", isSystem: true },
  { key: "admin-screen-access", label: "Screen Access", route: "/admin/screen-access", section: "ADMINISTRATION", icon: "Shield", sectionOrder: 7, order: 66, requiredPermission: "rbac.manage", isSystem: true, isSidebarItem: false },
  { key: "system-settings", label: "System Settings", route: "/settings", section: "ADMINISTRATION", icon: "Cog", sectionOrder: 7, order: 65, requiredPermission: "settings.view", isSystem: true },

  // ACCOUNT
  { key: "account", label: "Account", route: "/account", section: "ACCOUNT", icon: "Settings", sectionOrder: 9, order: 90, requiredPermission: null, isPersonal: true },
];

const EMPLOYEE_SCREENS = [
  "dashboard",
  "ai-copilot",
  "learning-pathways",
  "courses",
  "assessments",
  "certifications",
  "account",
] as const;

const MANAGER_EXTRA = [
  "executive-war-room",
  "admin-learning",
  "workforce-analytics",
  "reports",
] as const;

export const DEFAULT_ROLE_SCREEN_KEYS: Record<RoleSlug, readonly string[] | "all"> = {
  EMPLOYEE: EMPLOYEE_SCREENS,
  MANAGER: [...EMPLOYEE_SCREENS, ...MANAGER_EXTRA],
  ADMIN: "all",
};

/** Screens that redirect or repeat content available on another sidebar entry. */
export const REDUNDANT_SCREEN_KEYS = ["admin-screen-access"] as const;

/** Extra aliases for Admin (canonical screens kept instead). */
export const ADMIN_REDUNDANT_SCREEN_KEYS = [] as const;

const REDUNDANT_SCREEN_SET = new Set<string>(REDUNDANT_SCREEN_KEYS);
const ADMIN_REDUNDANT_SCREEN_SET = new Set<string>(ADMIN_REDUNDANT_SCREEN_KEYS);

export function resolveDefaultEnabledScreenKeys(
  slug: RoleSlug,
  allScreenKeys: readonly string[]
): string[] {
  const config = DEFAULT_ROLE_SCREEN_KEYS[slug];
  if (!config) return [];
  const base = config === "all" ? [...allScreenKeys] : [...config];
  const withoutGlobalRedundant = base.filter((key) => !REDUNDANT_SCREEN_SET.has(key));

  if (slug === RoleSlug.ADMIN) {
    return withoutGlobalRedundant.filter((key) => !ADMIN_REDUNDANT_SCREEN_SET.has(key));
  }

  return withoutGlobalRedundant;
}

export const SECTION_ORDER = [
  "COMMAND CENTER",
  "LEARNING & DEVELOPMENT",
  "ANALYTICS",
  "ADMINISTRATION",
  "ACCOUNT",
] as const;
