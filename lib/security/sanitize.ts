/**
 * XSS sanitization helpers.
 * React escapes output by default; use these for stored HTML and URL contexts.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}

export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export function sanitizePlainText(input: string, maxLength = 10_000): string {
  return stripHtmlTags(input).trim().slice(0, maxLength);
}

/** Block javascript: and data: URLs in user-provided links */
export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed, "https://localhost");
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
