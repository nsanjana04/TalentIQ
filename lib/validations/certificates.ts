import { z } from "zod";

export const certificateListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "REVOKED", "RENEWED", "all"]).optional().default("all"),
  templateId: z.string().optional(),
  userId: z.string().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  issuerName: z.string().max(200).optional(),
  templateHtml: z.string().max(50000).optional(),
  validityDays: z.coerce.number().int().min(1).max(3650).optional().default(365),
  isActive: z.boolean().optional().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const issueCertificateSchema = z.object({
  userId: z.string().min(1),
  templateId: z.string().min(1),
  courseId: z.string().optional(),
  assessmentId: z.string().optional(),
  validityDays: z.coerce.number().int().min(1).optional(),
});

export const revokeCertificateSchema = z.object({
  reason: z.string().min(2).max(500),
});

export type CertificateListQuery = z.infer<typeof certificateListQuerySchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
