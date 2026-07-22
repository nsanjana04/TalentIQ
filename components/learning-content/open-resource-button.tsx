"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { LearningNavigationInfo, LearningResourceType } from "@/types/learning-content";
import { Button } from "@/components/ui/button";
import { LEARNING_RESOURCE_TYPE_LABELS } from "@/lib/utils/learning-url";

interface OpenResourceButtonProps {
  navigation: LearningNavigationInfo;
  label?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function OpenResourceButton({
  navigation,
  label = "Open",
  size = "sm",
  variant = "default",
  className,
}: OpenResourceButtonProps) {
  return (
    <Button asChild size={size} variant={variant} className={className}>
      <a
        href={navigation.href}
        target={navigation.openInNewTab ? "_blank" : "_self"}
        rel={navigation.openInNewTab ? "noopener noreferrer" : undefined}
      >
        {label}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </Button>
  );
}

export function ResourceTypeBadge({ type, provider }: { type: LearningResourceType; provider?: string | null }) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {provider ?? LEARNING_RESOURCE_TYPE_LABELS[type]}
    </span>
  );
}

export function YouTubeEmbed({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
      <iframe
        src={embedUrl}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export function PdfEmbed({
  url,
  title,
  backHref,
  backLabel = "Back to Open Courses",
}: {
  url: string;
  title: string;
  backHref?: string;
  backLabel?: string;
}) {
  const [loadState, setLoadState] = useState<"checking" | "ready" | "error">("checking");

  useEffect(() => {
    let cancelled = false;
    setLoadState("checking");

    void fetch(url, { method: "HEAD" })
      .then((response) => {
        if (!cancelled) setLoadState(response.ok ? "ready" : "error");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loadState === "checking") {
    return (
      <div className="flex h-[480px] w-full items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">
        Loading document…
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="rounded-xl border border-dashed border-amber-400/40 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Unable to load this document.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          The PDF file may be missing or unavailable. Use &quot;Open in new tab&quot; below or return
          to Open Courses.
        </p>
        {backHref && (
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-[480px] w-full overflow-hidden rounded-lg border">
      <iframe src={url} title={title} className="h-full w-full" />
    </div>
  );
}

export function VideoEmbed({ src, title, resetKey }: { src: string; title: string; resetKey?: string }) {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [resetKey, src]);

  if (loadError) {
    return (
      <div className="rounded-xl border border-dashed border-amber-400/40 bg-amber-500/5 p-6 text-center">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Unable to load this video file.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Confirm the MP4 exists under <code className="rounded bg-muted px-1">public/learning/training/</code>{" "}
          or use Open in new tab below.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          Open video directly
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
      <video
        key={resetKey ?? src}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full"
        src={src}
        title={title}
        onError={() => setLoadError(true)}
      >
        Your browser does not support embedded video playback.
      </video>
    </div>
  );
}
