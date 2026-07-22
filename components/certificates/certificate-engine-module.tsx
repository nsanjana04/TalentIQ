"use client";

import { useState } from "react";
import {
  Award,
  Eye,
  FileBadge,
  Loader2,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShieldX,
  Timer,
} from "lucide-react";
import {
  useCertificateAnalytics,
  useCertificateList,
  useCertificateMeta,
  useCertificateMutations,
  useCertificateOverview,
  useCertificateTemplates,
  useMyCertificates,
} from "@/hooks/use-certificates";
import { CertificateAnalyticsPanel } from "./certificate-analytics-panel";
import { CertificateDialogActions } from "./certificate-dialog-actions";
import { CertificateExportMenu } from "./certificate-export-menu";
import { CertificateQr } from "./certificate-qr";
import { CertificateVisual } from "./certificate-visual";
import { printCertificate } from "@/lib/certificates/print-certificate";
import {
  certificateRecordToVisualProps,
  downloadCertificateImage,
  downloadCertificatePdf,
  downloadCertificatesCsv,
  downloadCertificatesPdf,
} from "@/lib/certificates/certificate-export";
import { StatPill } from "@/components/skills-admin/admin-ui";
import type { CertificateRecord, CertificateTemplateItem } from "@/types/certificates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionGate } from "@/components/rbac/permission-gate";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";

type Tab = "my" | "issued" | "templates" | "analytics";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  EXPIRED: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  REVOKED: "bg-destructive/15 text-destructive",
  RENEWED: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
};

function CertificateCard({
  cert,
  isManager,
  onRenew,
  onExpire,
  onRevoke,
}: {
  cert: CertificateRecord;
  isManager: boolean;
  onRenew?: (id: string) => void;
  onExpire?: (id: string) => void;
  onRevoke?: (id: string) => void;
}) {
  const [showQr, setShowQr] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);

  const visualProps = certificateRecordToVisualProps(cert);

  async function handleExportPdf() {
    setExporting("pdf");
    try {
      await downloadCertificatePdf(visualProps, cert.certificateNumber);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportImage() {
    setExporting("image");
    try {
      await downloadCertificateImage(visualProps, cert.certificateNumber);
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
    <Card className="border-primary/10">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{cert.templateName}</h3>
            </div>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {cert.certificateNumber}
            </p>
            {isManager && (
              <p className="text-sm text-muted-foreground">
                {cert.userName} · {cert.userEmail}
              </p>
            )}
          </div>
          <Badge className={cn("text-xs", STATUS_STYLES[cert.status])}>{cert.status}</Badge>
        </div>

        <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
          {cert.courseTitle && <span>Course: {cert.courseTitle}</span>}
          <span>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</span>
          {cert.expiresAt && (
            <span>
              Expires: {new Date(cert.expiresAt).toLocaleDateString()}
              {cert.daysUntilExpiry !== null && cert.status === "ACTIVE" && (
                <span className="ml-1">({cert.daysUntilExpiry}d left)</span>
              )}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowCertificate(true)}>
            <Eye className="mr-1 h-4 w-4" />
            View Certificate
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowQr(!showQr)}>
            <QrCode className="mr-1 h-4 w-4" />
            QR Verify
          </Button>
          {isManager && cert.status === "ACTIVE" && (
            <>
              <Button size="sm" variant="outline" onClick={() => onRenew?.(cert.id)}>
                <RefreshCw className="mr-1 h-4 w-4" />
                Renew
              </Button>
              <Button size="sm" variant="outline" onClick={() => onExpire?.(cert.id)}>
                <Timer className="mr-1 h-4 w-4" />
                Expire
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => onRevoke?.(cert.id)}
              >
                <ShieldX className="mr-1 h-4 w-4" />
                Revoke
              </Button>
            </>
          )}
        </div>

        {showQr && (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border bg-muted/20 p-4">
            <CertificateQr url={cert.verificationUrl} />
            <p className="break-all text-center text-xs text-muted-foreground">
              {cert.verificationUrl}
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={showCertificate} onOpenChange={setShowCertificate} className="max-w-[min(100vw-1rem,68rem)]">
      <DialogContent className="certificate-print-dialog w-full max-h-[95vh] overflow-y-auto p-3 sm:p-6 print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Certificate</DialogTitle>
        </DialogHeader>
        <CertificateVisual
          recipientName={cert.userName}
          templateName={cert.templateName}
          certificateNumber={cert.certificateNumber}
          issuerName={cert.issuerName}
          courseTitle={cert.courseTitle}
          assessmentTitle={cert.assessmentTitle}
          issuedAt={cert.issuedAt}
          expiresAt={cert.expiresAt}
          status={cert.status}
          verificationUrl={cert.verificationUrl}
          className="w-full"
        />
        <CertificateDialogActions
          exporting={exporting}
          onPrint={() => {
            const ok = printCertificate(visualProps);
            if (!ok) window.print();
          }}
          onClose={() => setShowCertificate(false)}
          onExportPdf={handleExportPdf}
          onExportImage={handleExportImage}
        />
      </DialogContent>
    </Dialog>
    </>
  );
}

export function CertificateEngineModule() {
  const { can } = usePermissions();
  const isManager = can(Permission.CERTIFICATES_MANAGE);

  const [tab, setTab] = useState<Tab>(isManager ? "issued" : "my");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [issueOpen, setIssueOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplateItem | null>(null);

  const [issueForm, setIssueForm] = useState({
    userId: "",
    templateId: "",
    courseId: "",
    assessmentId: "",
  });
  const [templateForm, setTemplateForm] = useState({
    name: "",
    issuerName: "TalentIQ Academy",
    validityDays: 365,
    isActive: true,
  });

  const { data: overview } = useCertificateOverview();
  const { data: meta } = useCertificateMeta();
  const { data: templates } = useCertificateTemplates();
  const { data: issued, isLoading: issuedLoading } = useCertificateList(search, status);
  const { data: myCerts } = useMyCertificates();
  const { data: analytics, isLoading: analyticsLoading } = useCertificateAnalytics();
  const mutations = useCertificateMutations();
  const [bulkExporting, setBulkExporting] = useState<"pdf" | "csv" | null>(null);

  async function handleBulkExport(
    certs: CertificateRecord[] | undefined,
    format: "pdf" | "csv",
    label: string
  ) {
    if (!certs?.length) return;
    setBulkExporting(format);
    try {
      if (format === "csv") {
        downloadCertificatesCsv(certs, label);
      } else {
        await downloadCertificatesPdf(certs, label);
      }
    } finally {
      setBulkExporting(null);
    }
  }

  const tabs: { id: Tab; label: string; managerOnly?: boolean }[] = [
    { id: "my", label: "My Certificates" },
    { id: "issued", label: "Issued Certificates", managerOnly: true },
    { id: "templates", label: "Templates", managerOnly: true },
    { id: "analytics", label: "Analytics", managerOnly: true },
  ];

  return (
    <div className="space-y-6">
      {isManager && overview && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatPill label="Templates" value={overview.totalTemplates} />
          <StatPill label="Active Certs" value={overview.activeCertificates} />
          <StatPill label="Expired" value={overview.expiredCertificates} />
          <StatPill label="Revoked" value={overview.revokedCertificates} />
          <StatPill label="Renewals YTD" value={overview.renewalsThisYear} />
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {tabs
          .filter((t) => !t.managerOnly || isManager)
          .map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tab === t.id ? "default" : "outline"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
      </div>

      {tab === "my" && (
        <div className="space-y-4">
          {!!myCerts?.length && (
            <div className="flex justify-end">
              <CertificateExportMenu
                size="sm"
                exporting={bulkExporting}
                onExportPdf={() => handleBulkExport(myCerts, "pdf", "my-certificates")}
                onExportCsv={() => handleBulkExport(myCerts, "csv", "my-certificates")}
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
          {myCerts?.map((cert) => (
            <CertificateCard key={cert.id} cert={cert} isManager={false} />
          ))}
          {!myCerts?.length && (
            <p className="col-span-2 py-12 text-center text-muted-foreground">
              You have no certificates yet.
            </p>
          )}
          </div>
        </div>
      )}

      {tab === "issued" && isManager && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search certificates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
              <option value="RENEWED">Renewed</option>
            </Select>
            <PermissionGate elementId="certificates.manage.button">
              <Button size="sm" onClick={() => setIssueOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Issue Certificate
              </Button>
            </PermissionGate>
            {!!issued?.length && (
              <CertificateExportMenu
                size="sm"
                exporting={bulkExporting}
                onExportPdf={() => handleBulkExport(issued, "pdf", "issued-certificates")}
                onExportCsv={() => handleBulkExport(issued, "csv", "issued-certificates")}
              />
            )}
          </div>

          {issuedLoading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {issued?.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  isManager
                  onRenew={(id) => mutations.renewCertificate.mutate(id)}
                  onExpire={(id) => mutations.expireCertificate.mutate(id)}
                  onRevoke={(id) => setRevokeId(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "templates" && isManager && (
        <div className="space-y-4">
          <PermissionGate elementId="certificates.manage.button">
            <Button size="sm" onClick={() => setTemplateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              New Template
            </Button>
          </PermissionGate>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates?.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileBadge className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{t.name}</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t.issuerName ?? "TalentIQ"} · {t.validityDays ?? 365} days
                      </p>
                      <p className="text-xs text-muted-foreground">{t.issuedCount} issued</p>
                    </div>
                    <Badge variant="outline" className={t.isActive ? "text-emerald-600" : ""}>
                      {t.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => setPreviewTemplate(t)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    Preview design
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "analytics" && isManager && (
        <CertificateAnalyticsPanel analytics={analytics} isLoading={analyticsLoading} />
      )}

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Certificate</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={issueForm.userId}
              onChange={(e) => setIssueForm((f) => ({ ...f, userId: e.target.value }))}
            >
              <option value="">Select recipient</option>
              {meta?.users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </Select>
            <Select
              value={issueForm.templateId}
              onChange={(e) => setIssueForm((f) => ({ ...f, templateId: e.target.value }))}
            >
              <option value="">Select template</option>
              {meta?.templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            <Select
              value={issueForm.courseId}
              onChange={(e) => setIssueForm((f) => ({ ...f, courseId: e.target.value }))}
            >
              <option value="">Course (optional)</option>
              {meta?.courses?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
            <Button
              className="w-full"
              onClick={async () => {
                await mutations.issueCertificate.mutateAsync({
                  userId: issueForm.userId,
                  templateId: issueForm.templateId,
                  courseId: issueForm.courseId || undefined,
                  assessmentId: issueForm.assessmentId || undefined,
                });
                setIssueOpen(false);
              }}
            >
              Issue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Template name"
              value={templateForm.name}
              onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Issuer name"
              value={templateForm.issuerName}
              onChange={(e) => setTemplateForm((f) => ({ ...f, issuerName: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Validity days"
              value={templateForm.validityDays}
              onChange={(e) =>
                setTemplateForm((f) => ({ ...f, validityDays: Number(e.target.value) }))
              }
            />
            <Button
              className="w-full"
              onClick={async () => {
                await mutations.createTemplate.mutateAsync(templateForm);
                setTemplateOpen(false);
              }}
            >
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)} className="max-w-[min(100vw-1rem,68rem)]">
        <DialogContent className="w-full max-h-[95vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle>Template preview — {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <CertificateVisual
              recipientName="Sample Employee"
              templateName={previewTemplate.name}
              certificateNumber="TIQ-SAMPLE-0001"
              issuerName={previewTemplate.issuerName}
              courseTitle="Sample Course Completion"
              issuedAt={new Date().toISOString()}
              expiresAt={
                new Date(
                  Date.now() + (previewTemplate.validityDays ?? 365) * 24 * 60 * 60 * 1000
                ).toISOString()
              }
              status="ACTIVE"
              className="w-full"
            />
          )}
          <div className="flex justify-end border-t pt-4 print:hidden">
            <Button variant="outline" className="h-10 min-w-[6.5rem]" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Certificate</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Reason for revocation"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
          />
          <Button
            variant="destructive"
            className="w-full"
            onClick={async () => {
              if (revokeId && revokeReason) {
                await mutations.revokeCertificate.mutateAsync({
                  id: revokeId,
                  reason: revokeReason,
                });
                setRevokeId(null);
                setRevokeReason("");
              }
            }}
          >
            Revoke Certificate
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
