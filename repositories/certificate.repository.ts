import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CertificateListQuery } from "@/lib/validations/certificates";

export const certificateRepository = {
  async getOverview() {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const [templates, activeTemplates, total, active, expired, revoked, renewals] =
      await Promise.all([
        prisma.certificateTemplate.count({ where: { deletedAt: null } }),
        prisma.certificateTemplate.count({
          where: { deletedAt: null, isActive: true },
        }),
        prisma.certificate.count({ where: { deletedAt: null } }),
        prisma.certificate.count({ where: { deletedAt: null, status: "ACTIVE" } }),
        prisma.certificate.count({ where: { deletedAt: null, status: "EXPIRED" } }),
        prisma.certificate.count({ where: { deletedAt: null, status: "REVOKED" } }),
        prisma.certificate.count({
          where: { deletedAt: null, renewedAt: { gte: yearStart } },
        }),
      ]);
    return {
      totalTemplates: templates,
      activeTemplates,
      totalIssued: total,
      activeCertificates: active,
      expiredCertificates: expired,
      revokedCertificates: revoked,
      renewalsThisYear: renewals,
    };
  },

  async listTemplates() {
    return prisma.certificateTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { certificates: { where: { deletedAt: null } } } },
      },
    });
  },

  async getTemplateById(id: string) {
    return prisma.certificateTemplate.findFirst({
      where: { id, deletedAt: null },
    });
  },

  async createTemplate(data: Prisma.CertificateTemplateCreateInput) {
    return prisma.certificateTemplate.create({ data });
  },

  async updateTemplate(id: string, data: Prisma.CertificateTemplateUpdateInput) {
    return prisma.certificateTemplate.update({ where: { id }, data });
  },

  async softDeleteTemplate(id: string) {
    return prisma.certificateTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  async listCertificates(query: CertificateListQuery) {
    const where: Prisma.CertificateWhereInput = {
      deletedAt: null,
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.templateId ? { templateId: query.templateId } : {}),
      ...(query.status !== "all" ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { certificateNumber: { contains: query.search, mode: "insensitive" } },
              { user: { firstName: { contains: query.search, mode: "insensitive" } } },
              { user: { lastName: { contains: query.search, mode: "insensitive" } } },
              { user: { email: { contains: query.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    return prisma.certificate.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        template: { select: { id: true, name: true, issuerName: true } },
        course: { select: { title: true } },
        assessment: { select: { title: true } },
        issuedBy: { select: { firstName: true, lastName: true } },
      },
      take: 100,
    });
  },

  async getCertificateById(id: string) {
    return prisma.certificate.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        template: true,
        course: { select: { title: true } },
        assessment: { select: { title: true } },
        issuedBy: { select: { firstName: true, lastName: true } },
      },
    });
  },

  async getByVerificationToken(token: string) {
    return prisma.certificate.findFirst({
      where: { verificationToken: token, deletedAt: null },
      include: {
        user: { select: { firstName: true, lastName: true } },
        template: { select: { name: true, issuerName: true } },
        course: { select: { title: true } },
      },
    });
  },

  async createCertificate(data: {
    userId: string;
    templateId: string;
    courseId?: string;
    assessmentId?: string;
    certificateNumber: string;
    verificationToken: string;
    issuedById?: string;
    expiresAt?: Date | null;
    renewedFromId?: string;
  }) {
    return prisma.certificate.create({
      data: {
        userId: data.userId,
        templateId: data.templateId,
        courseId: data.courseId,
        assessmentId: data.assessmentId,
        certificateNumber: data.certificateNumber,
        verificationToken: data.verificationToken,
        issuedById: data.issuedById,
        expiresAt: data.expiresAt,
        renewedFromId: data.renewedFromId,
        renewedAt: data.renewedFromId ? new Date() : undefined,
        status: "ACTIVE",
      },
    });
  },

  async updateCertificate(id: string, data: Prisma.CertificateUpdateInput) {
    return prisma.certificate.update({ where: { id }, data });
  },

  async expireStaleCertificates() {
    return prisma.certificate.updateMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });
  },

  async getAnalytics() {
    const certs = await prisma.certificate.findMany({
      where: { deletedAt: null },
      select: {
        status: true,
        issuedAt: true,
        renewedAt: true,
        expiresAt: true,
        template: { select: { name: true } },
      },
    });
    return certs;
  },

  async getMeta() {
    const [users, templates, courses, assessments] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, firstName: true, lastName: true, email: true },
        orderBy: { firstName: "asc" },
        take: 200,
      }),
      prisma.certificateTemplate.findMany({
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true, validityDays: true },
      }),
      prisma.course.findMany({
        where: { deletedAt: null, isPublished: true },
        select: { id: true, title: true },
        take: 50,
      }),
      prisma.assessment.findMany({
        where: { deletedAt: null, isPublished: true },
        select: { id: true, title: true },
        take: 50,
      }),
    ]);
    return { users, templates, courses, assessments };
  },
};
