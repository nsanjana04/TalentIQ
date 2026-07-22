import type { SsoProvider } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const userIdentityRepository = {
  async findByProviderAndExternalId(provider: SsoProvider, externalId: string) {
    return prisma.userIdentity.findUnique({
      where: { provider_externalId: { provider, externalId } },
      include: { user: { include: { role: true } } },
    });
  },

  async findByUserAndProvider(userId: string, provider: SsoProvider) {
    return prisma.userIdentity.findUnique({
      where: { userId_provider: { userId, provider } },
    });
  },

  async linkIdentity(userId: string, provider: SsoProvider, externalId: string) {
    return prisma.userIdentity.create({
      data: { userId, provider, externalId },
    });
  },

  async userHasSsoIdentity(userId: string) {
    const count = await prisma.userIdentity.count({ where: { userId } });
    return count > 0;
  },
};
