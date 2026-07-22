import { readdirSync, statSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { RoleSlug } from "../constants/role-slugs";
import { SCREEN_DEFINITIONS } from "../lib/screens/screen-definitions";
import { VALID_SCREEN_PERMISSION_KEYS } from "../lib/screens/screen-permissions";

const prisma = new PrismaClient();
const APP_ROOT = join(process.cwd(), "app/(dashboard)");

function collectRouteFiles(dir: string, base = ""): string[] {
  if (!existsSync(dir)) return [];
  const routes: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const relative = base ? `${base}/${entry}` : entry;

    if (statSync(fullPath).isDirectory()) {
      routes.push(...collectRouteFiles(fullPath, relative));
      continue;
    }

    if (entry === "page.tsx" || entry === "page.ts") {
      routes.push(`/${relative.replace(/\/page\.tsx?$/, "").replace(/^\//, "")}`);
    }
  }

  return routes;
}

function normalizeRoute(route: string): string {
  return route.replace(/\/$/, "") || "/";
}

async function main() {
  const errors: string[] = [];
  const appRoutes = new Set(collectRouteFiles(APP_ROOT).map(normalizeRoute));

  const keys = SCREEN_DEFINITIONS.map((s) => s.key);
  const routes = SCREEN_DEFINITIONS.map((s) => s.route);

  if (new Set(keys).size !== keys.length) {
    errors.push("Duplicate screen keys detected");
  }
  if (new Set(routes).size !== routes.length) {
    errors.push("Duplicate screen routes detected");
  }

  for (const screen of SCREEN_DEFINITIONS) {
    if (screen.requiredPermission && !VALID_SCREEN_PERMISSION_KEYS.has(screen.requiredPermission)) {
      errors.push(`Unknown requiredPermission for ${screen.key}: ${screen.requiredPermission}`);
    }

    const routePath = normalizeRoute(screen.route.split("?")[0]);
    const hasRoute =
      appRoutes.has(routePath) ||
      appRoutes.has(routePath.replace(/^\//, "")) ||
      [...appRoutes].some(
        (r) => routePath === normalizeRoute(r) || routePath.startsWith(`${normalizeRoute(r)}/`)
      );

    if (!hasRoute && screen.isSidebarItem !== false) {
      const exact = appRoutes.has(routePath);
      if (!exact) {
        errors.push(`Missing app route for screen ${screen.key}: ${screen.route}`);
      }
    }

    const sectionPeers = SCREEN_DEFINITIONS.filter((s) => s.section === screen.section);
    const orderDupes = sectionPeers.filter((s) => s.order === screen.order);
    if (orderDupes.length > 1) {
      errors.push(`Duplicate order ${screen.order} in section ${screen.section}`);
    }
  }

  const screenCount = await prisma.screen.count();
  if (screenCount === 0) {
    errors.push("No screens in database — run seed-screens first");
  } else {
    const roles = await prisma.role.findMany({ where: { deletedAt: null } });
    const screens = await prisma.screen.findMany();

    for (const role of roles) {
      const accessCount = await prisma.roleScreenAccess.count({ where: { roleId: role.id } });
      if (accessCount < screens.length) {
        errors.push(
          `Role ${role.slug} missing RoleScreenAccess rows (${accessCount}/${screens.length})`
        );
      }
    }

    const settings = screens.find((s) => s.key === "system-settings");
    const account = screens.find((s) => s.key === "account");

    if (settings) {
      for (const slug of [RoleSlug.MANAGER, RoleSlug.EMPLOYEE]) {
        const role = roles.find((r) => r.slug === slug);
        if (!role) continue;
        const access = await prisma.roleScreenAccess.findUnique({
          where: { roleId_screenId: { roleId: role.id, screenId: settings.id } },
        });
        if (access?.enabled) {
          errors.push(`Settings should be disabled for ${slug} by default`);
        }
      }

      for (const slug of [RoleSlug.ADMIN]) {
        const role = roles.find((r) => r.slug === slug);
        if (!role) continue;
        const access = await prisma.roleScreenAccess.findUnique({
          where: { roleId_screenId: { roleId: role.id, screenId: settings.id } },
        });
        if (!access?.enabled) {
          errors.push(`Settings should be enabled for ${slug} by default`);
        }
      }
    }

    if (account) {
      for (const role of roles) {
        const access = await prisma.roleScreenAccess.findUnique({
          where: { roleId_screenId: { roleId: role.id, screenId: account.id } },
        });
        if (!access?.enabled) {
          errors.push(`Account should be enabled for role ${role.slug}`);
        }
      }
    }
  }

  await prisma.$disconnect();

  if (errors.length) {
    console.error("Screen validation failed:\n");
    for (const error of errors) console.error(`  ✗ ${error}`);
    process.exit(1);
  }

  console.log("✅ Screen registry validation passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
