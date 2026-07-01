import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSION_MATRIX } from "../lib/rbac/permission-matrix";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  getPermissionModule,
} from "../lib/rbac/permissions";
import { retireObsoletePermissions } from "../lib/rbac/retire-permissions";
import { retireObsoleteRoles } from "../lib/rbac/retire-roles";
import { RoleSlug } from "../constants/role-slugs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "TalentIQ@2026";

const ROLES = [
  { slug: RoleSlug.EMPLOYEE, name: "Employee", description: "Individual contributor" },
  { slug: RoleSlug.MANAGER, name: "Manager", description: "Team and department manager" },
  { slug: RoleSlug.ADMIN, name: "Admin", description: "System administrator" },
] as const;

const TEST_USERS = [
  {
    email: "employee@talentiq.com",
    firstName: "Anna",
    lastName: "Kowalski",
    roleSlug: RoleSlug.EMPLOYEE,
  },
  {
    email: "manager@talentiq.com",
    firstName: "Michael",
    lastName: "Torres",
    roleSlug: RoleSlug.MANAGER,
  },
  {
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@talentiq.com",
    firstName: "Jordan",
    lastName: "Hayes",
    roleSlug: RoleSlug.ADMIN,
  },
] as const;

async function seedRolesAndPermissions() {
  const roleMap = new Map<string, string>();

  for (const role of ROLES) {
    const record = await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description, isSystem: true },
      create: { slug: role.slug, name: role.name, description: role.description, isSystem: true },
    });
    roleMap.set(role.slug, record.id);
  }
  console.log(`  ✓ Roles: ${ROLES.length}`);

  const permissionMap = new Map<string, string>();
  for (const key of ALL_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key },
      update: { name: PERMISSION_LABELS[key], module: getPermissionModule(key) },
      create: {
        key,
        name: PERMISSION_LABELS[key],
        module: getPermissionModule(key),
        description: PERMISSION_LABELS[key],
      },
    });
    permissionMap.set(key, record.id);
  }
  console.log(`  ✓ Permissions: ${ALL_PERMISSIONS.length}`);

  for (const [roleSlug, permKeys] of Object.entries(PERMISSION_MATRIX)) {
    const roleId = roleMap.get(roleSlug);
    if (!roleId) continue;
    for (const permKey of permKeys) {
      const permissionId = permissionMap.get(permKey);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }
  console.log("  ✓ Role-permission matrix");

  await retireObsoletePermissions(prisma);
  await retireObsoleteRoles(prisma);

  return roleMap;
}

async function seedUsers(roleMap: Map<string, string>) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const user of TEST_USERS) {
    const roleId = roleMap.get(user.roleSlug);
    if (!roleId) continue;

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        roleId,
        passwordHash,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId,
        passwordHash,
        isActive: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  console.log(`  ✓ Users: ${TEST_USERS.length}`);
  console.log(`  Default password: ${DEFAULT_PASSWORD}`);
}

async function main() {
  console.log("Seeding auth (roles, permissions, login users)...");
  const roleMap = await seedRolesAndPermissions();
  await seedUsers(roleMap);
  console.log("Auth seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
