import { FIGMA_TOPIC_COURSE_SLUGS } from "@/constants/demo-learning-stats";
import { PYTHON_PATH_LEVELS } from "@/constants/python-learning-path";

/** Maps pathway topic + level (1–4) to the canonical DB course slug for that tier. */
const TOPIC_LEVEL_COURSE_SLUGS: Record<string, Record<number, string>> = {
  python: Object.fromEntries(
    PYTHON_PATH_LEVELS.map((level, index) => [index + 1, level.slug])
  ),
};

/** Candidate DB course slugs for a Learning Pathways topic card slug. */
export function getPathwayCourseSlugCandidates(
  topicSlug: string,
  levelNumber?: number
): string[] {
  const normalized = topicSlug.trim().toLowerCase();
  const levelSlug =
    levelNumber != null ? TOPIC_LEVEL_COURSE_SLUGS[normalized]?.[levelNumber] : undefined;
  const mapped = FIGMA_TOPIC_COURSE_SLUGS[normalized] ?? [];
  const base = [...new Set([normalized, ...mapped])];
  if (levelSlug) {
    return [...new Set([levelSlug, ...base])];
  }
  return base;
}

export interface PathwayCourseCandidate {
  id: string;
  slug: string;
  title?: string;
  moduleCount?: number;
}

function slugRank(candidateSlugs: string[], slug: string): number {
  const idx = candidateSlugs.findIndex((s) => s.toLowerCase() === slug.toLowerCase());
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

/** Prefer candidate slug priority (101 before 201); module count is only a tie-breaker. */
export function pickBestPathwayCourse(
  candidateSlugs: string[],
  records: PathwayCourseCandidate[]
): PathwayCourseCandidate | null {
  const exactMatches = records.filter((record) =>
    candidateSlugs.some((s) => s.toLowerCase() === record.slug.toLowerCase())
  );
  if (!exactMatches.length) {
    return matchCourseSlugFromCandidates(candidateSlugs, records);
  }

  return [...exactMatches].sort((a, b) => {
    const rankDiff = slugRank(candidateSlugs, a.slug) - slugRank(candidateSlugs, b.slug);
    if (rankDiff !== 0) return rankDiff;
    return (b.moduleCount ?? 0) - (a.moduleCount ?? 0);
  })[0];
}

export function matchCourseSlugFromCandidates(
  candidateSlugs: string[],
  records: { id: string; slug: string }[]
): { id: string; slug: string } | null {
  for (const candidate of candidateSlugs) {
    const c = candidate.toLowerCase();
    const exact = records.find((r) => r.slug.toLowerCase() === c);
    if (exact) return exact;
  }
  for (const candidate of candidateSlugs) {
    const c = candidate.toLowerCase();
    const fuzzy = records.find((r) => {
      const slug = r.slug.toLowerCase();
      return slug.includes(c) || c.includes(slug);
    });
    if (fuzzy) return fuzzy;
  }
  return null;
}
