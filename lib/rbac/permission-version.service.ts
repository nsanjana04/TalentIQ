import { prisma } from "@/lib/db/prisma";

const GLOBAL_KEY = "rbac.global_permission_version";

function userVersionKey(userId: string): string {
  return `rbac.user.${userId}.permission_version`;
}

async function readVersion(key: string): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) return 0;
  const parsed = parseInt(setting.value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function incrementVersion(key: string, description: string): Promise<number> {
  const current = await readVersion(key);
  const next = current + 1;
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: String(next), valueType: "NUMBER" },
    create: {
      key,
      value: String(next),
      valueType: "NUMBER",
      description,
    },
  });
  return next;
}

export interface PermissionVersions {
  global: number;
  user: number;
}

export const permissionVersionService = {
  async getGlobalVersion(): Promise<number> {
    return readVersion(GLOBAL_KEY);
  },

  async getUserVersion(userId: string): Promise<number> {
    return readVersion(userVersionKey(userId));
  },

  async getVersions(userId: string): Promise<PermissionVersions> {
    const [global, user] = await Promise.all([
      readVersion(GLOBAL_KEY),
      readVersion(userVersionKey(userId)),
    ]);
    return { global, user };
  },

  async bumpGlobal(): Promise<number> {
    return incrementVersion(GLOBAL_KEY, "Global RBAC permission version");
  },

  async bumpUser(userId: string): Promise<number> {
    return incrementVersion(
      userVersionKey(userId),
      `Per-user RBAC permission version for ${userId}`
    );
  },

  /** Role matrix change — all sessions should refresh permissions. */
  async bumpForRolePermissionChange(): Promise<number> {
    return this.bumpGlobal();
  },

  /** User override or access grant — target user should refresh. */
  async bumpForUserPermissionChange(userId: string): Promise<PermissionVersions> {
    const [, user] = await Promise.all([this.bumpGlobal(), this.bumpUser(userId)]);
    return { global: await this.getGlobalVersion(), user };
  },

  isStale(
    jwtVersions: { permissionVersion?: number; userPermissionVersion?: number },
    current: PermissionVersions
  ): boolean {
    return (
      (jwtVersions.permissionVersion ?? 0) < current.global ||
      (jwtVersions.userPermissionVersion ?? 0) < current.user
    );
  },
};
