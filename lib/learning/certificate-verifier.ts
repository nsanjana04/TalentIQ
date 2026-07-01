import {
  ACCEPTED_CERTIFICATE_PLATFORMS,
  type RoadmapPathwayDefinition,
} from "@/constants/roadmap-pathway";

const MAX_BYTES = 10 * 1024 * 1024;
const MIN_BYTES = 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

const ALLOWED_EXT = /\.(pdf|jpe?g|png)$/i;

const FAKE_PATTERNS = [
  /certificate\s+template/i,
  /sample\s+certificate/i,
  /lorem\s+ipsum/i,
  /not\s+a\s+real\s+certificate/i,
  /for\s+demonstration\s+only/i,
];

const PLATFORM_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Coursera", pattern: /coursera/i },
  { label: "Udemy", pattern: /udemy/i },
  { label: "Microsoft Learn", pattern: /microsoft\s*learn|learn\.microsoft/i },
  { label: "Google", pattern: /google|grow with google/i },
  { label: "LinkedIn Learning", pattern: /linkedin\s*learning/i },
  { label: "AWS", pattern: /\baws\b|amazon web services/i },
  { label: "Pluralsight", pattern: /pluralsight/i },
];

export interface VerifyCertificateInput {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  learnerName: string;
  pathwayCourse: RoadmapPathwayDefinition;
}

export interface VerifyCertificateOutput {
  verified: boolean;
  rejectionReason?: string;
  extracted?: {
    learner: string;
    course: string;
    issued: string;
    platform: string;
  };
}

function bufferToSearchText(buffer: Buffer): string {
  return buffer.toString("latin1").replace(/\0/g, " ");
}

function detectPlatform(text: string, fileName: string): string | null {
  const haystack = `${text} ${fileName}`;
  for (const entry of PLATFORM_PATTERNS) {
    if (entry.pattern.test(haystack)) return entry.label;
  }
  return null;
}

function detectIssuedDate(text: string): string {
  const iso = text.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/);
  if (iso) {
    const d = new Date(`${iso[1]}-${iso[2]}-${iso[3]}`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
  }

  const verbal = text.match(
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(20\d{2})\b/i
  );
  if (verbal) {
    return `${verbal[1]} ${verbal[2]} ${verbal[3]}`;
  }

  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function nameMatches(text: string, learnerName: string): boolean {
  const normalized = learnerName.trim().toLowerCase();
  if (!normalized) return false;
  if (text.toLowerCase().includes(normalized)) return true;

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts.every((part) => text.toLowerCase().includes(part));

  const [first, ...rest] = parts;
  const last = rest[rest.length - 1];
  return text.toLowerCase().includes(first) && text.toLowerCase().includes(last);
}

function courseMatches(text: string, fileName: string, course: RoadmapPathwayDefinition): boolean {
  const haystack = `${text} ${fileName} ${course.title}`.toLowerCase();
  return course.certificateKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function assertCertificateFile(fileName: string, mimeType: string, size: number): void {
  if (size > MAX_BYTES) {
    throw new Error("File exceeds the 10 MB limit.");
  }
  if (size < MIN_BYTES) {
    throw new Error("File is too small to be a valid certificate.");
  }
  if (!ALLOWED_EXT.test(fileName)) {
    throw new Error("Only PDF or image files (JPG, PNG) are accepted.");
  }
  const normalizedMime = mimeType.toLowerCase();
  if (normalizedMime !== "application/octet-stream" && !ALLOWED_MIME.has(normalizedMime)) {
    throw new Error("Only PDF or image files (JPG, PNG) are accepted.");
  }
}

export function verifyRoadmapCertificate(input: VerifyCertificateInput): VerifyCertificateOutput {
  const { fileName, buffer, learnerName, pathwayCourse } = input;
  const text = bufferToSearchText(buffer);

  if (FAKE_PATTERNS.some((pattern) => pattern.test(text) || pattern.test(fileName))) {
    return {
      verified: false,
      rejectionReason:
        "We couldn't verify this certificate. It may be edited, from an unsupported platform, or issued for a different course. Upload the original file from your provider.",
    };
  }

  const platform = detectPlatform(text, fileName);
  if (!platform || !ACCEPTED_CERTIFICATE_PLATFORMS.includes(platform as (typeof ACCEPTED_CERTIFICATE_PLATFORMS)[number])) {
    return {
      verified: false,
      rejectionReason:
        "Certificate is from an unsupported platform. Accepted: Coursera, Udemy, Microsoft Learn, Google, LinkedIn Learning, AWS, Pluralsight.",
    };
  }

  const isPdf = fileName.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpe?g|png)$/i.test(fileName);

  if (isPdf && !text.includes("%PDF")) {
    return {
      verified: false,
      rejectionReason: "The uploaded PDF could not be read. Upload the original certificate file from your provider.",
    };
  }

  if (isImage) {
    const imageHint =
      platform.toLowerCase().replace(/\s+/g, "") +
      pathwayCourse.certificateKeywords.join("").toLowerCase();
    const fileHint = fileName.toLowerCase();
    const weakMatch =
      pathwayCourse.certificateKeywords.some((k) => fileHint.includes(k)) ||
      fileHint.includes(platform.toLowerCase().replace(/\s+/g, ""));
    if (!weakMatch && buffer.length < 5000) {
      return {
        verified: false,
        rejectionReason:
          "We couldn't verify this image certificate. Upload a clearer scan or the original PDF from your provider.",
      };
    }
    void imageHint;
  }

  if (!nameMatches(text + " " + fileName, learnerName)) {
    return {
      verified: false,
      rejectionReason: `Learner name on the certificate does not match your profile (${learnerName}).`,
    };
  }

  if (!courseMatches(text, fileName, pathwayCourse)) {
    return {
      verified: false,
      rejectionReason: `This certificate does not appear to be for ${pathwayCourse.title}. Upload the certificate for the correct course.`,
    };
  }

  const issued = detectIssuedDate(text);
  const courseTitle =
    text.match(new RegExp(pathwayCourse.certificateKeywords[0], "i"))?.[0] ??
    `${pathwayCourse.title} for Beginners`;

  return {
    verified: true,
    extracted: {
      learner: learnerName,
      course: courseTitle.charAt(0).toUpperCase() + courseTitle.slice(1),
      issued,
      platform,
    },
  };
}
