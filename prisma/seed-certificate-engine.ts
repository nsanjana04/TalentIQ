import type { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const TEMPLATES = [
  {
    id: "seed-cert-skill-path",
    name: "Skill Path Certificate",
    issuerName: "TalentIQ Academy",
    validityDays: 730,
  },
  {
    id: "seed-cert-template",
    name: "TalentIQ Standard Certificate",
    issuerName: "TalentIQ Enterprise",
    validityDays: 365,
  },
  {
    id: "seed-cert-expert",
    name: "Expert Achievement Certificate",
    issuerName: "TalentIQ Academy",
    validityDays: 1095,
  },
] as const;

export async function seedCertificateEngine(prisma: PrismaClient) {
  console.log("\n── Certificate Engine ──");

  for (const t of TEMPLATES) {
    await prisma.certificateTemplate.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        issuerName: t.issuerName,
        validityDays: t.validityDays,
        isActive: true,
      },
      create: {
        id: t.id,
        name: t.name,
        description: `${t.name} — official credential`,
        issuerName: t.issuerName,
        validityDays: t.validityDays,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Templates: ${TEMPLATES.length}`);

  const certsWithoutToken = await prisma.certificate.findMany({
    where: { verificationToken: "" },
    select: { id: true },
  });
  for (const c of certsWithoutToken) {
    await prisma.certificate.update({
      where: { id: c.id },
      data: { verificationToken: randomBytes(24).toString("hex") },
    });
  }

  const now = new Date();
  await prisma.certificate.updateMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  const expiringSoon = await prisma.certificate.findFirst({
    where: { deletedAt: null, status: "ACTIVE" },
    orderBy: { issuedAt: "asc" },
  });
  if (expiringSoon) {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    await prisma.certificate.update({
      where: { id: expiringSoon.id },
      data: { expiresAt: soon },
    });
  }

  console.log("  ✓ Certificate statuses synced");
}
