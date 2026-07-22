export type CertificateStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "RENEWED";

export interface CertificateOverview {
  totalTemplates: number;
  activeTemplates: number;
  totalIssued: number;
  activeCertificates: number;
  expiredCertificates: number;
  revokedCertificates: number;
  renewalsThisYear: number;
}

export interface CertificateTemplateItem {
  id: string;
  name: string;
  description: string | null;
  issuerName: string | null;
  validityDays: number | null;
  isActive: boolean;
  issuedCount: number;
  createdAt: string;
}

export interface CertificateRecord {
  id: string;
  certificateNumber: string;
  verificationToken: string;
  verificationUrl: string;
  status: CertificateStatus;
  userId: string;
  userName: string;
  userEmail: string;
  templateId: string;
  templateName: string;
  issuerName: string | null;
  courseTitle: string | null;
  assessmentTitle: string | null;
  issuedAt: string;
  expiresAt: string | null;
  renewedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  issuedByName: string | null;
  daysUntilExpiry: number | null;
}

export interface CertificateAnalytics {
  totalIssued: number;
  byStatus: { status: string; count: number }[];
  byTemplate: { templateName: string; count: number }[];
  issuanceTrend: { month: string; issued: number; renewed: number; expired: number }[];
  expiringWithin30Days: number;
  renewalRate: number;
}

export interface CertificateMeta {
  users: { id: string; firstName: string; lastName: string; email: string }[];
  templates: { id: string; name: string; validityDays: number | null }[];
  courses: { id: string; title: string }[];
  assessments: { id: string; title: string }[];
}

export interface VerificationResult {
  valid: boolean;
  status: CertificateStatus;
  certificateNumber: string;
  recipientName: string;
  templateName: string;
  issuerName: string | null;
  courseTitle: string | null;
  issuedAt: string;
  expiresAt: string | null;
  message: string;
}
