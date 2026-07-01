import { AppError } from "@/lib/errors/app-error";
import {
  generateCertificateNumber,
  generateVerificationToken,
  getVerificationUrl,
  resolveCertificateStatus,
} from "@/lib/certificates/helpers";
import type {
  CertificateListQuery,
  CreateTemplateInput,
  IssueCertificateInput,
  UpdateTemplateInput,
} from "@/lib/validations/certificates";
import { certificateRepository } from "@/repositories/certificate.repository";
import type {
  CertificateAnalytics,
  CertificateOverview,
  CertificateRecord,
  CertificateTemplateItem,
  VerificationResult,
} from "@/types/certificates";
import { auditService } from "@/services/audit.service";

function mapCertificate(
  cert: Awaited<ReturnType<typeof certificateRepository.listCertificates>>[number]
): CertificateRecord {
  const status = resolveCertificateStatus(cert.status, cert.expiresAt);
  const daysUntilExpiry = cert.expiresAt
    ? Math.ceil((cert.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return {
    id: cert.id,
    certificateNumber: cert.certificateNumber,
    verificationToken: cert.verificationToken,
    verificationUrl: getVerificationUrl(cert.verificationToken),
    status,
    userId: cert.user.id,
    userName: `${cert.user.firstName} ${cert.user.lastName}`,
    userEmail: cert.user.email,
    templateId: cert.template.id,
    templateName: cert.template.name,
    issuerName: cert.template.issuerName,
    courseTitle: cert.course?.title ?? null,
    assessmentTitle: cert.assessment?.title ?? null,
    issuedAt: cert.issuedAt.toISOString(),
    expiresAt: cert.expiresAt?.toISOString() ?? null,
    renewedAt: cert.renewedAt?.toISOString() ?? null,
    revokedAt: cert.revokedAt?.toISOString() ?? null,
    revokedReason: cert.revokedReason,
    issuedByName: cert.issuedBy
      ? `${cert.issuedBy.firstName} ${cert.issuedBy.lastName}`
      : null,
    daysUntilExpiry,
  };
}

async function audit(
  actorId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  entityType: string,
  entityId?: string
) {
  await auditService.log({ action, entityType, entityId, actorId });
}

export const certificateService = {
  async syncExpired() {
    await certificateRepository.expireStaleCertificates();
  },

  getOverview: async (): Promise<CertificateOverview> => {
    await certificateService.syncExpired();
    return certificateRepository.getOverview();
  },

  async listTemplates(): Promise<CertificateTemplateItem[]> {
    const items = await certificateRepository.listTemplates();
    return items.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      issuerName: t.issuerName,
      validityDays: t.validityDays,
      isActive: t.isActive,
      issuedCount: t._count.certificates,
      createdAt: t.createdAt.toISOString(),
    }));
  },

  async createTemplate(input: CreateTemplateInput, actorId: string) {
    const t = await certificateRepository.createTemplate({
      name: input.name,
      description: input.description,
      issuerName: input.issuerName,
      templateHtml: input.templateHtml,
      validityDays: input.validityDays,
      isActive: input.isActive,
    });
    await audit(actorId, "CREATE", "CertificateTemplate", t.id);
    return t;
  },

  async updateTemplate(id: string, input: UpdateTemplateInput, actorId: string) {
    const existing = await certificateRepository.getTemplateById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Template not found");
    const t = await certificateRepository.updateTemplate(id, input);
    await audit(actorId, "UPDATE", "CertificateTemplate", id);
    return t;
  },

  async deleteTemplate(id: string, actorId: string) {
    await certificateRepository.softDeleteTemplate(id);
    await audit(actorId, "DELETE", "CertificateTemplate", id);
  },

  getMeta: () => certificateRepository.getMeta(),

  async listCertificates(query: CertificateListQuery): Promise<CertificateRecord[]> {
    await certificateService.syncExpired();
    const items = await certificateRepository.listCertificates(query);
    return items.map(mapCertificate);
  },

  async issueCertificate(input: IssueCertificateInput, actorId: string) {
    const template = await certificateRepository.getTemplateById(input.templateId);
    if (!template || !template.isActive) {
      throw new AppError("NOT_FOUND", "Template not found or inactive");
    }

    const validityDays = input.validityDays ?? template.validityDays ?? 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    let certNumber = generateCertificateNumber();
    let attempts = 0;
    while (attempts < 5) {
      try {
        const cert = await certificateRepository.createCertificate({
          userId: input.userId,
          templateId: input.templateId,
          courseId: input.courseId,
          assessmentId: input.assessmentId,
          certificateNumber: certNumber,
          verificationToken: generateVerificationToken(),
          issuedById: actorId,
          expiresAt,
        });
        await audit(actorId, "CREATE", "Certificate", cert.id);
        const full = await certificateRepository.getCertificateById(cert.id);
        if (!full) throw new AppError("INTERNAL_ERROR", "Certificate creation failed");
        return mapCertificate(full as Parameters<typeof mapCertificate>[0]);
      } catch {
        certNumber = generateCertificateNumber();
        attempts++;
      }
    }
    throw new AppError("INTERNAL_ERROR", "Failed to generate unique certificate number");
  },

  async renewCertificate(id: string, actorId: string) {
    const existing = await certificateRepository.getCertificateById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Certificate not found");
    if (existing.status === "REVOKED") {
      throw new AppError("BAD_REQUEST", "Cannot renew a revoked certificate");
    }

    const template = existing.template;
    const validityDays = template.validityDays ?? 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    await certificateRepository.updateCertificate(id, { status: "RENEWED" });

    const renewed = await certificateRepository.createCertificate({
      userId: existing.userId,
      templateId: existing.templateId,
      courseId: existing.courseId ?? undefined,
      assessmentId: existing.assessmentId ?? undefined,
      certificateNumber: generateCertificateNumber(),
      verificationToken: generateVerificationToken(),
      issuedById: actorId,
      expiresAt,
      renewedFromId: id,
    });

    await audit(actorId, "CREATE", "Certificate", renewed.id);
    const full = await certificateRepository.getCertificateById(renewed.id);
    if (!full) throw new AppError("INTERNAL_ERROR", "Renewal failed");
    return mapCertificate(full as Parameters<typeof mapCertificate>[0]);
  },

  async expireCertificate(id: string, actorId: string) {
    const existing = await certificateRepository.getCertificateById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Certificate not found");
    if (existing.status !== "ACTIVE") {
      throw new AppError("BAD_REQUEST", "Only active certificates can be expired");
    }
    await certificateRepository.updateCertificate(id, { status: "EXPIRED" });
    await audit(actorId, "UPDATE", "Certificate", id);
    return { expired: true };
  },

  async revokeCertificate(id: string, reason: string, actorId: string) {
    const existing = await certificateRepository.getCertificateById(id);
    if (!existing) throw new AppError("NOT_FOUND", "Certificate not found");
    await certificateRepository.updateCertificate(id, {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedReason: reason,
    });
    await audit(actorId, "UPDATE", "Certificate", id);
    return { revoked: true };
  },

  async getAnalytics(): Promise<CertificateAnalytics> {
    await certificateService.syncExpired();
    const certs = await certificateRepository.getAnalytics();
    const now = new Date();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);

    const byStatus = ["ACTIVE", "EXPIRED", "REVOKED", "RENEWED"].map((status) => ({
      status,
      count: certs.filter((c) => c.status === status).length,
    }));

    const templateMap = new Map<string, number>();
    for (const c of certs) {
      const name = c.template.name;
      templateMap.set(name, (templateMap.get(name) ?? 0) + 1);
    }

    const monthBuckets = new Map<string, { issued: number; renewed: number; expired: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      monthBuckets.set(key, { issued: 0, renewed: 0, expired: 0 });
    }
    for (const c of certs) {
      const iKey = c.issuedAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (monthBuckets.has(iKey)) monthBuckets.get(iKey)!.issued++;
      if (c.renewedAt) {
        const rKey = c.renewedAt.toLocaleString("en-US", { month: "short", year: "2-digit" });
        if (monthBuckets.has(rKey)) monthBuckets.get(rKey)!.renewed++;
      }
    }

    const expiringWithin30Days = certs.filter(
      (c) =>
        c.status === "ACTIVE" &&
        c.expiresAt &&
        c.expiresAt <= in30 &&
        c.expiresAt >= now
    ).length;

    const renewedCount = certs.filter((c) => c.renewedAt).length;
    const renewalRate = certs.length ? Math.round((renewedCount / certs.length) * 100) : 0;

    return {
      totalIssued: certs.length,
      byStatus,
      byTemplate: Array.from(templateMap.entries()).map(([templateName, count]) => ({
        templateName,
        count,
      })),
      issuanceTrend: Array.from(monthBuckets.entries()).map(([month, v]) => ({ month, ...v })),
      expiringWithin30Days,
      renewalRate,
    };
  },

  async verify(token: string): Promise<VerificationResult> {
    await certificateService.syncExpired();
    const cert = await certificateRepository.getByVerificationToken(token);

    if (!cert) {
      return {
        valid: false,
        status: "REVOKED",
        certificateNumber: "",
        recipientName: "",
        templateName: "",
        issuerName: null,
        courseTitle: null,
        issuedAt: "",
        expiresAt: null,
        message: "Certificate not found. This verification link may be invalid.",
      };
    }

    const status = resolveCertificateStatus(cert.status, cert.expiresAt);
    const valid = status === "ACTIVE";

    return {
      valid,
      status,
      certificateNumber: cert.certificateNumber,
      recipientName: `${cert.user.firstName} ${cert.user.lastName}`,
      templateName: cert.template.name,
      issuerName: cert.template.issuerName,
      courseTitle: cert.course?.title ?? null,
      issuedAt: cert.issuedAt.toISOString(),
      expiresAt: cert.expiresAt?.toISOString() ?? null,
      message: valid
        ? "This certificate is valid and authentic."
        : status === "EXPIRED"
          ? "This certificate has expired."
          : status === "REVOKED"
            ? "This certificate has been revoked."
            : "This certificate has been renewed — refer to the latest certificate.",
    };
  },
};
