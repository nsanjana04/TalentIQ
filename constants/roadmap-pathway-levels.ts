import { PYTHON_PATH_LEVELS } from "@/constants/python-learning-path";
import { relatedDbSlugsForPathway } from "@/constants/roadmap-pathway";
import { getModuleTopicsForCourse } from "@/constants/skill-path-modules";

export type PathwayLevelTier = "BASIC" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export const PATHWAY_LEVEL_TIER_ORDER: PathwayLevelTier[] = [
  "BASIC",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
];

export const PATHWAY_LEVEL_TIER_LABELS: Record<PathwayLevelTier, string> = {
  BASIC: "Basic",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

/** Concept modules shown per level in the roadmap pathway (not full 10-module skill path). */
export const MODULES_PER_PATHWAY_LEVEL = 4;

export interface PathwayLevelDefinition {
  tier: PathwayLevelTier;
  name: string;
  courseSlug: string;
  /** Fallback concept titles when DB modules are not seeded yet. */
  conceptTitles: string[];
}

function genericLevelDefinitions(
  pathwaySlug: string,
  primaryCourseSlug: string
): PathwayLevelDefinition[] {
  const related = relatedDbSlugsForPathway(pathwaySlug);
  const slugs = Array.from(new Set([primaryCourseSlug, ...related])).slice(0, 4);
  while (slugs.length < 4) {
    slugs.push(slugs[slugs.length - 1] ?? primaryCourseSlug);
  }

  return PATHWAY_LEVEL_TIER_ORDER.map((tier, index) => {
    const courseSlug = slugs[index]!;
    return {
      tier,
      name: PATHWAY_LEVEL_TIER_LABELS[tier],
      courseSlug,
      conceptTitles: getModuleTopicsForCourse(courseSlug).slice(0, MODULES_PER_PATHWAY_LEVEL),
    };
  });
}

const PYTHON_LEVELS: PathwayLevelDefinition[] = PYTHON_PATH_LEVELS.map((level, index) => ({
  tier: PATHWAY_LEVEL_TIER_ORDER[index]!,
  name: PATHWAY_LEVEL_TIER_LABELS[PATHWAY_LEVEL_TIER_ORDER[index]!],
  courseSlug: level.slug,
  conceptTitles: getModuleTopicsForCourse(level.slug).slice(0, MODULES_PER_PATHWAY_LEVEL),
}));

/** Four-level curriculum per roadmap pathway course (Basic → Expert). */
export const PATHWAY_LEVEL_DEFINITIONS: Record<string, PathwayLevelDefinition[]> = {
  python: PYTHON_LEVELS,
  aws: genericLevelDefinitions("aws", "aws-zero-to-hero"),
  devops: genericLevelDefinitions("devops", "git-expert-4-hours"),
  "data-analytics": genericLevelDefinitions("data-analytics", "intro-databases-sql"),
  kubernetes: genericLevelDefinitions("kubernetes", "intro-cloud-computing"),
  "cyber-security": genericLevelDefinitions("cyber-security", "cyber-security-beginners"),
};

export function getPathwayLevelDefinitions(pathwaySlug: string): PathwayLevelDefinition[] {
  return PATHWAY_LEVEL_DEFINITIONS[pathwaySlug] ?? [];
}
