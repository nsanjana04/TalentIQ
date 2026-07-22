"use client";

import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CertificateExportMenu } from "./certificate-export-menu";
import { cn } from "@/lib/utils";

export const CERTIFICATE_ACTION_BTN_CLASS =
  "h-10 min-w-[6.5rem] gap-2 border border-input bg-background px-4 text-sm font-medium shadow-sm hover:bg-muted/60";

type CertificateDialogActionsProps = {
  onPrint: () => void;
  onClose: () => void;
  onExportPdf: () => void | Promise<void>;
  onExportImage: () => void | Promise<void>;
  exporting?: "pdf" | "image" | null;
  className?: string;
};

export function CertificateDialogActions({
  onPrint,
  onClose,
  onExportPdf,
  onExportImage,
  exporting = null,
  className,
}: CertificateDialogActionsProps) {
  return (
    <div
      className={cn(
        "certificate-dialog-actions flex flex-wrap items-center justify-end gap-3 border-t pt-4 print:hidden",
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        className={CERTIFICATE_ACTION_BTN_CLASS}
        disabled={!!exporting}
        onClick={onPrint}
      >
        <Printer className="h-4 w-4 shrink-0" />
        Print
      </Button>
      <CertificateExportMenu
        variant="outline"
        buttonClassName={CERTIFICATE_ACTION_BTN_CLASS}
        menuPlacement="top"
        exporting={exporting}
        onExportPdf={onExportPdf}
        onExportImage={onExportImage}
      />
      <Button
        type="button"
        variant="outline"
        className={CERTIFICATE_ACTION_BTN_CLASS}
        onClick={onClose}
      >
        <X className="h-4 w-4 shrink-0" />
        Close
      </Button>
    </div>
  );
}
