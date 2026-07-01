import type { LearningResourceType } from "@/types/learning-content";

export interface LearningNavigation {
  href: string;
  openInNewTab: boolean;
  embedUrl: string | null;
  provider: string;
}

const PROVIDER_PATTERNS: { pattern: RegExp; type: LearningResourceType; provider: string }[] = [
  { pattern: /(?:youtube\.com|youtu\.be)/i, type: "YOUTUBE", provider: "YouTube" },
  { pattern: /udemy\.com/i, type: "UDEMY", provider: "Udemy" },
  { pattern: /coursera\.org/i, type: "COURSERA", provider: "Coursera" },
  { pattern: /learn\.microsoft\.com/i, type: "MICROSOFT_LEARN", provider: "Microsoft Learn" },
  { pattern: /linkedin\.com\/learning/i, type: "LINK", provider: "LinkedIn Learning" },
  { pattern: /pluralsight\.com/i, type: "LINK", provider: "Pluralsight" },
  { pattern: /docs\.google\.com/i, type: "DOCUMENT", provider: "Google Docs" },
  { pattern: /drive\.google\.com/i, type: "DOCUMENT", provider: "Google Drive" },
  { pattern: /\.pdf(\?|#|$)/i, type: "PDF", provider: "PDF" },
];

export function normalizeLearningUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) throw new Error("URL is required");
  if (trimmed.startsWith("/")) return encodeLocalMediaPath(trimmed);

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only HTTP and HTTPS URLs are supported");
    }
    return url.toString();
  } catch {
    throw new Error("Invalid URL format");
  }
}

/** Encode each path segment so spaces and special chars work in video/audio src. */
export function encodeLocalMediaPath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment, index) => {
      if (index === 0 || !segment) return segment;
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
}

export type MediaPlaybackKind = "youtube" | "pdf" | "video" | "none";

export interface MediaPlayback {
  kind: MediaPlaybackKind;
  embedUrl: string | null;
  href: string;
}

export function resolveMediaPlayback(
  type: LearningResourceType,
  rawUrl: string
): MediaPlayback {
  const navigation = resolveLearningNavigation(type, rawUrl);
  const detected = detectProviderFromUrl(navigation.href);
  const effectiveType = type === "LINK" || type === "OTHER" ? detected.type : type;

  if (effectiveType === "YOUTUBE" && navigation.embedUrl) {
    return { kind: "youtube", embedUrl: navigation.embedUrl, href: navigation.href };
  }
  if (effectiveType === "PDF") {
    return {
      kind: "pdf",
      embedUrl: navigation.embedUrl ?? navigation.href,
      href: navigation.href,
    };
  }
  if (effectiveType === "VIDEO" || detected.type === "VIDEO") {
    const embedUrl = navigation.embedUrl ?? encodeLocalMediaPath(navigation.href);
    return { kind: "video", embedUrl, href: navigation.href };
  }
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(navigation.href)) {
    const embedUrl = encodeLocalMediaPath(navigation.href);
    return { kind: "video", embedUrl, href: navigation.href };
  }
  return { kind: "none", embedUrl: null, href: navigation.href };
}

export function detectProviderFromUrl(url: string): { type: LearningResourceType; provider: string } {
  const normalized = normalizeLearningUrl(url);
  for (const entry of PROVIDER_PATTERNS) {
    if (entry.pattern.test(normalized)) {
      return { type: entry.type, provider: entry.provider };
    }
  }
  if (/\.(pdf)(\?|#|$)/i.test(normalized)) {
    return { type: "PDF", provider: "PDF" };
  }
  if (/\.(doc|docx|ppt|pptx|xls|xlsx)(\?|#|$)/i.test(normalized)) {
    return { type: "DOCUMENT", provider: "Document" };
  }
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(normalized)) {
    return { type: "VIDEO", provider: "Video" };
  }
  return { type: "LINK", provider: "External Link" };
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }
    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
    const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1];
  } catch {
    return null;
  }
  return null;
}

function toYouTubeWatchUrl(url: string): string {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : url;
}

function toYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function resolveLearningNavigation(
  type: LearningResourceType,
  rawUrl: string
): LearningNavigation {
  const href = normalizeLearningUrl(rawUrl);
  const detected = detectProviderFromUrl(href);
  const effectiveType = type === "LINK" || type === "OTHER" ? detected.type : type;

  switch (effectiveType) {
    case "YOUTUBE": {
      const watchUrl = toYouTubeWatchUrl(href);
      return {
        href: watchUrl,
        openInNewTab: true,
        embedUrl: toYouTubeEmbedUrl(watchUrl),
        provider: "YouTube",
      };
    }
    case "PDF":
      return {
        href,
        openInNewTab: true,
        embedUrl: href,
        provider: "PDF",
      };
    case "DOCUMENT":
      return {
        href,
        openInNewTab: true,
        embedUrl: null,
        provider: detected.provider,
      };
    case "MICROSOFT_LEARN":
      return {
        href,
        openInNewTab: true,
        embedUrl: null,
        provider: "Microsoft Learn",
      };
    case "UDEMY":
      return {
        href,
        openInNewTab: true,
        embedUrl: null,
        provider: "Udemy",
      };
    case "COURSERA":
      return {
        href,
        openInNewTab: true,
        embedUrl: null,
        provider: "Coursera",
      };
    case "VIDEO":
      return {
        href,
        openInNewTab: !href.startsWith("/"),
        embedUrl: href.startsWith("/") ? encodeLocalMediaPath(href) : href,
        provider: "Video",
      };
    default:
      return {
        href,
        openInNewTab: true,
        embedUrl: null,
        provider: detected.provider,
      };
  }
}

export const LEARNING_RESOURCE_TYPE_LABELS: Record<LearningResourceType, string> = {
  LINK: "Web Link",
  YOUTUBE: "YouTube",
  PDF: "PDF",
  DOCUMENT: "Document",
  VIDEO: "Video File",
  MICROSOFT_LEARN: "Microsoft Learn",
  UDEMY: "Udemy",
  COURSERA: "Coursera",
  OTHER: "Other",
};

export const OPEN_COURSE_CATEGORY_LABELS: Record<
  import("@/types/learning-content").OpenCourseCategory,
  string
> = {
  PRODUCT: "Product",
  HR_POLICIES: "HR Policies",
  SECURITY: "Security",
  GENERAL: "General",
};
