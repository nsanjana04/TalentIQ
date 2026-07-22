"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Printer, ShieldAlert, XCircle } from "lucide-react";
import { useVerifyCertificate } from "@/hooks/use-certificates";
import { CertificateExportMenu } from "@/components/certificates/certificate-export-menu";
import { CertificateVisual } from "@/components/certificates/certificate-visual";
import { printCertificate } from "@/lib/certificates/print-certificate";
import {
  downloadCertificateImage,
  downloadCertificatePdf,
} from "@/lib/certificates/certificate-export";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function VerifyCertificateClient({ token }: { token: string }) {
  const { data: result, isLoading, isError } = useVerifyCertificate(token);
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-primary/5 p-6">
        <p className="text-muted-foreground">Verifying certificate…</p>
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-primary/5 p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <p className="mt-4 font-medium">Verification failed</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verifyUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify/certificate/${token}`;

  const visualProps = {
    recipientName: result.recipientName,
    templateName: result.templateName,
    certificateNumber: result.certificateNumber,
    issuerName: result.issuerName,
    courseTitle: result.courseTitle,
    issuedAt: result.issuedAt,
    expiresAt: result.expiresAt,
    status: result.status,
    verificationUrl: verifyUrl,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 py-8 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            {result.valid ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-amber-500" />
            )}
            <div>
              <h1 className="text-lg font-semibold">
                {result.valid ? "Certificate Verified" : "Certificate Invalid"}
              </h1>
              <p className="text-sm text-muted-foreground">{result.message}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                result.valid
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-amber-500/15 text-amber-700"
              )}
            >
              {result.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={!!exporting}
              onClick={() => {
                const ok = printCertificate(visualProps);
                if (!ok) window.print();
              }}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <CertificateExportMenu
              variant="outline"
              size="sm"
              exporting={exporting}
              onExportPdf={async () => {
                setExporting("pdf");
                try {
                  await downloadCertificatePdf(visualProps, result.certificateNumber);
                } finally {
                  setExporting(null);
                }
              }}
              onExportImage={async () => {
                setExporting("image");
                try {
                  await downloadCertificateImage(visualProps, result.certificateNumber);
                } finally {
                  setExporting(null);
                }
              }}
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-[min(100vw-2rem,68rem)]">
          <CertificateVisual {...visualProps} className="w-full" />
        </div>
      </div>
    </div>
  );
}
