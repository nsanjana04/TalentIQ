import type { LearningResourceType } from "@/types/learning-content";

export const MAX_LEARNING_FILE_BYTES = 200 * 1024 * 1024;

type FileTypeRule = {
  type: LearningResourceType;
  provider: string;
  mimeTypes: string[];
  extensions: string[];
};

const FILE_TYPE_RULES: FileTypeRule[] = [
  {
    type: "PDF",
    provider: "PDF",
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
  },
  {
    type: "DOCUMENT",
    provider: "Word Document",
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    extensions: [".doc", ".docx"],
  },
  {
    type: "DOCUMENT",
    provider: "PowerPoint",
    mimeTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    extensions: [".ppt", ".pptx"],
  },
  {
    type: "DOCUMENT",
    provider: "Excel Spreadsheet",
    mimeTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    extensions: [".xls", ".xlsx"],
  },
  {
    type: "DOCUMENT",
    provider: "Text File",
    mimeTypes: ["text/plain", "text/csv"],
    extensions: [".txt", ".csv"],
  },
  {
    type: "VIDEO",
    provider: "Video",
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    extensions: [".mp4", ".webm", ".mov"],
  },
];

export const RESOURCE_URL_PLACEHOLDERS: Record<LearningResourceType, string> = {
  YOUTUBE: "https://www.youtube.com/watch?v=...",
  UDEMY: "https://www.udemy.com/course/...",
  COURSERA: "https://www.coursera.org/learn/...",
  MICROSOFT_LEARN: "https://learn.microsoft.com/en-us/training/modules/...",
  PDF: "https://example.com/document.pdf",
  DOCUMENT: "https://example.com/handbook.docx",
  VIDEO: "https://example.com/training.mp4",
  LINK: "https://example.com/resource",
  OTHER: "https://example.com/resource",
};

export const LINK_ONLY_RESOURCE_TYPES = new Set<LearningResourceType>([
  "YOUTUBE",
  "UDEMY",
  "COURSERA",
  "MICROSOFT_LEARN",
  "LINK",
]);

export const UPLOADABLE_RESOURCE_TYPES = new Set<LearningResourceType>([
  "PDF",
  "DOCUMENT",
  "VIDEO",
  "OTHER",
]);

export function getAcceptForResourceType(type: LearningResourceType): string {
  if (type === "PDF") return ".pdf,application/pdf";
  if (type === "VIDEO") return ".mp4,.webm,.mov,video/*";
  if (type === "DOCUMENT") {
    return ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv";
  }
  return ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.mp4,.webm,.mov";
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

export function detectTypeFromFile(
  filename: string,
  mimeType: string
): { type: LearningResourceType; provider: string } | null {
  const ext = extensionOf(filename);
  const normalizedMime = mimeType.toLowerCase();

  for (const rule of FILE_TYPE_RULES) {
    if (
      rule.extensions.includes(ext) ||
      rule.mimeTypes.some((m) => normalizedMime === m || normalizedMime.startsWith(`${m};`))
    ) {
      return { type: rule.type, provider: rule.provider };
    }
  }

  return null;
}

export function assertAllowedLearningFile(
  filename: string,
  mimeType: string,
  size: number
): { type: LearningResourceType; provider: string } {
  if (size <= 0) {
    throw new Error("File is empty");
  }
  if (size > MAX_LEARNING_FILE_BYTES) {
    throw new Error("File exceeds the 200 MB limit");
  }

  const detected = detectTypeFromFile(filename, mimeType);
  if (!detected) {
    throw new Error(
      "Unsupported file type. Upload PDF, Word, PowerPoint, Excel, text, or video files."
    );
  }

  return detected;
}
