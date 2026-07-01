"use client";

import { useEffect, useRef, useState } from "react";
import { FileDown, Image, Loader2, Sheet, Upload } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExportFormat = "pdf" | "image" | "csv";

type CertificateExportMenuProps = {
  onExportPdf: () => void | Promise<void>;
  onExportImage?: () => void | Promise<void>;
  onExportCsv?: () => void | Promise<void>;
  exporting?: ExportFormat | null;
  disabled?: boolean;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  buttonClassName?: string;
  className?: string;
  menuPlacement?: "top" | "bottom";
};

export function CertificateExportMenu({
  onExportPdf,
  onExportImage,
  onExportCsv,
  exporting = null,
  disabled = false,
  size = "default",
  variant = "default",
  buttonClassName,
  className,
  menuPlacement = "bottom",
}: CertificateExportMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function runExport(format: ExportFormat) {
    setOpen(false);
    if (format === "pdf") {
      await onExportPdf();
    } else if (format === "image") {
      await onExportImage?.();
    } else {
      await onExportCsv?.();
    }
  }

  const isBusy = !!exporting || disabled;

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={isBusy}
        className={buttonClassName}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Export
      </Button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 z-[100] min-w-[200px] overflow-hidden rounded-lg border bg-card py-1 shadow-lg ring-1 ring-border/60",
            menuPlacement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          )}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-muted/60"
            onClick={() => runExport("pdf")}
          >
            <FileDown className="h-4 w-4 text-muted-foreground" />
            Download as PDF
          </button>
          {onExportImage && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-muted/60"
              onClick={() => runExport("image")}
            >
              <Image className="h-4 w-4 text-muted-foreground" />
              Download as Image
            </button>
          )}
          {onExportCsv && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-muted/60"
              onClick={() => runExport("csv")}
            >
              <Sheet className="h-4 w-4 text-muted-foreground" />
              Export to CSV
            </button>
          )}
        </div>
      )}
    </div>
  );
}
