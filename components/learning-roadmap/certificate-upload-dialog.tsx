"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import {
  useCompletePathwayCertificate,
  useVerifyPathwayCertificate,
} from "@/hooks/use-roadmap-pathway";
import { ACCEPTED_CERTIFICATE_PLATFORMS } from "@/constants/roadmap-pathway";
import type { RoadmapPathwayCourse } from "@/types/roadmap-pathway";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CertificateUploadDialogProps {
  course: RoadmapPathwayCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateUnlocked?: boolean;
}

export function CertificateUploadDialog({
  course,
  open,
  onOpenChange,
  certificateUnlocked = true,
}: CertificateUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reviewRequested, setReviewRequested] = useState(false);

  const verify = useVerifyPathwayCertificate();
  const complete = useCompletePathwayCertificate();

  const reset = useCallback(() => {
    setSelectedFile(null);
    setReviewRequested(false);
    verify.reset();
    complete.reset();
  }, [verify, complete]);

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const runVerification = async (file: File) => {
    if (!course || !certificateUnlocked) return;
    setSelectedFile(file);
    await verify.mutateAsync({ pathwaySlug: course.slug, file });
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void runVerification(file);
  };

  const handleMarkComplete = async () => {
    if (!course || !verify.data?.verified) return;
    await complete.mutateAsync(course.slug);
    handleClose(false);
  };

  const isBusy = verify.isPending || complete.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose} className="max-w-2xl">
      <DialogContent className="max-h-[90vh] overflow-y-auto" onClose={() => handleClose(false)}>
        <button
          type="button"
          onClick={() => handleClose(false)}
          className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roadmap
        </button>

        <DialogHeader>
          <DialogTitle>Upload completion certificate</DialogTitle>
          <DialogDescription>
            {course ? `${course.title} · ${course.pathwayName}` : "Select a course certificate"}
          </DialogDescription>
        </DialogHeader>

        {!certificateUnlocked && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Pass the final evaluation assessment before uploading your provider certificate.
          </div>
        )}

        {certificateUnlocked && (
          <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
            <p className="text-sm font-medium text-[#111827]">Before you upload, confirm:</p>
            <ul className="mt-2 space-y-1 text-xs text-[#6B7280]">
              <li>· Certificate shows your full name as registered in TalentIQ</li>
              <li>· Course title matches {course?.title ?? "this pathway course"}</li>
              <li>· Completion or issue date is clearly visible</li>
              <li>
                · Issued by an accepted platform ({ACCEPTED_CERTIFICATE_PLATFORMS.slice(0, 4).join(", ")},
                etc.)
              </li>
            </ul>
          </div>
        )}

        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            !certificateUnlocked && "pointer-events-none opacity-50",
            dragOver ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#CBD5E1] bg-[#F8FAFC]"
          )}
        >
          <Upload className="mb-3 h-8 w-8 text-[#64748B]" />
          <p className="text-sm font-medium text-[#111827]">Drop your certificate here</p>
          <p className="mt-1 text-xs text-[#6B7280]">PDF or image (JPG, PNG) · Max 10 MB</p>
          <Button type="button" className="mt-4" disabled={isBusy || !certificateUnlocked}>
            Browse file
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <p className="text-xs text-[#6B7280]">
          Accepted: {ACCEPTED_CERTIFICATE_PLATFORMS.join(" · ")}
        </p>

        {verify.isPending && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying certificate…
          </div>
        )}

        {(verify.isError || (verify.data && !verify.data.verified)) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2 text-red-700">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Not recognised</p>
                <p className="mt-1 text-sm">
                  {verify.error instanceof Error
                    ? verify.error.message
                    : verify.data?.rejectionReason ??
                      "We couldn't verify this certificate. Upload the original file from your provider."}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-red-300 text-red-700"
                onClick={reset}
              >
                Try again
              </Button>
              {!reviewRequested && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-300 text-red-700"
                  onClick={() => setReviewRequested(true)}
                >
                  Request admin review
                </Button>
              )}
            </div>
            {reviewRequested && (
              <p className="mt-3 text-sm text-red-800">
                Manual review requested. Your learning administrator can verify this certificate
                from Learning Administration.
              </p>
            )}
          </div>
        )}

        {verify.data?.verified && verify.data.extracted && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-2 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="w-full">
                <p className="font-semibold">Certificate verified</p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-emerald-700/80">Learner</dt>
                    <dd className="font-medium">{verify.data.extracted.learner}</dd>
                  </div>
                  <div>
                    <dt className="text-emerald-700/80">Course</dt>
                    <dd className="font-medium">{verify.data.extracted.course}</dd>
                  </div>
                  <div>
                    <dt className="text-emerald-700/80">Issued</dt>
                    <dd className="font-medium">{verify.data.extracted.issued}</dd>
                  </div>
                  <div>
                    <dt className="text-emerald-700/80">Platform</dt>
                    <dd className="font-medium">{verify.data.extracted.platform}</dd>
                  </div>
                </dl>
                {selectedFile && (
                  <p className="mt-2 text-xs text-emerald-700/80">File: {selectedFile.name}</p>
                )}
              </div>
            </div>
            <Button
              type="button"
              className="mt-4"
              disabled={complete.isPending}
              onClick={() => void handleMarkComplete()}
            >
              {complete.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Mark as complete"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
