import type { UdemyCurriculumLecture, UdemyCurriculumSection } from "@/types/udemy-curriculum";

/** Extract Udemy course slug from a course URL. */
export function parseUdemyCourseSlug(url: string): string | null {
  const match = url.match(/udemy\.com\/course\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function parseDurationMinutes(fragment: string): number | undefined {
  const match = fragment.match(/(\d+)\s*(?:hr|hour|h)\s*(?:(\d+)\s*min)?|(\d+)\s*min/i);
  if (!match) return undefined;
  const hours = match[1] ? Number(match[1]) : 0;
  const minsFromHours = match[2] ? Number(match[2]) : 0;
  const minsOnly = match[3] ? Number(match[3]) : 0;
  const total = (hours ? hours * 60 : 0) + (minsFromHours || minsOnly);
  return total > 0 ? total : undefined;
}

function cleanSectionTitle(raw: string): string {
  return raw
    .replace(/\d+\s*lectures?\s*•.*$/i, "")
    .replace(/\d+\s*lecture\s*•.*$/i, "")
    .replace(/\d+\s*sections?\s*•.*$/i, "")
    .trim();
}

function cleanLectureTitle(raw: string): string {
  return raw
    .replace(/Preview$/i, "")
    .replace(/\d{1,2}:\d{2}$/, "")
    .trim();
}

/**
 * Parse Udemy course page text (markdown/HTML) into sections and lectures.
 * Works with public syllabus blocks when automated API access is blocked.
 */
export function parseUdemyPageCurriculum(pageText: string): UdemyCurriculumSection[] {
  const sections: UdemyCurriculumSection[] = [];
  let current: UdemyCurriculumSection | null = null;

  for (const line of pageText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionMatch = trimmed.match(/^#{2,3}\s+(.+)$/);
    if (sectionMatch) {
      const title = cleanSectionTitle(sectionMatch[1]);
      if (title && !/^course content$/i.test(title) && !/^expand all sections$/i.test(title)) {
        current = { title, lectures: [] };
        sections.push(current);
      }
      continue;
    }

    if (!current) continue;

    if (/^\d+\s*sections?\s*•/i.test(trimmed)) continue;
    if (/^expand all sections$/i.test(trimmed)) continue;
    if (/^preview this course$/i.test(trimmed)) continue;
    if (/^section quiz$/i.test(trimmed)) continue;
    if (/^\d+\s*more sections?$/i.test(trimmed)) continue;

    const lectureTitle = cleanLectureTitle(trimmed);
    if (
      lectureTitle.length < 3 ||
      lectureTitle.length > 200 ||
      /^rating:/i.test(lectureTitle) ||
      /^created by/i.test(lectureTitle)
    ) {
      continue;
    }

    const durationMinutes = parseDurationMinutes(trimmed);
    const duplicate = current.lectures.some((l) => l.title === lectureTitle);
    if (!duplicate) {
      current.lectures.push({ title: lectureTitle, durationMinutes });
    }
  }

  return sections
    .map((section) => ({
      ...section,
      lectures:
        section.lectures.length > 0
          ? section.lectures
          : [{ title: `Complete all lectures in "${section.title}" on Udemy` }],
    }))
    .filter((section) => section.title.length > 0);
}
