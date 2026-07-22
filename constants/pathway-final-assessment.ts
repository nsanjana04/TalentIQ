import type { PathwayLevelTier } from "@/constants/roadmap-pathway-levels";
import { PATHWAY_LEVEL_TIER_ORDER } from "@/constants/roadmap-pathway-levels";

/** Total questions in each course final evaluation. */
export const PATHWAY_FINAL_TOTAL_QUESTIONS = 30;

/** Questions generated per difficulty tier (ordered Basic → Expert). Totals 30: 20 MCQ + 10 CODE. */
export const PATHWAY_FINAL_TIER_QUESTION_PLAN: Record<
  PathwayLevelTier,
  { mcq: number; code: number }
> = {
  BASIC: { mcq: 6, code: 2 },
  INTERMEDIATE: { mcq: 6, code: 2 },
  ADVANCED: { mcq: 4, code: 3 },
  EXPERT: { mcq: 4, code: 3 },
};

export const PATHWAY_FINAL_PASSING_SCORE = 70;
export const PATHWAY_FINAL_MAX_RETAKES = 3;

export const PATHWAY_FINAL_MCQ_TOTAL = PATHWAY_LEVEL_TIER_ORDER.reduce(
  (sum, tier) => sum + PATHWAY_FINAL_TIER_QUESTION_PLAN[tier].mcq,
  0
);

export const PATHWAY_FINAL_CODE_TOTAL = PATHWAY_LEVEL_TIER_ORDER.reduce(
  (sum, tier) => sum + PATHWAY_FINAL_TIER_QUESTION_PLAN[tier].code,
  0
);

export function pathwayFinalAssessmentDescription(pathwaySlug: string): string {
  return `pathway-final:${pathwaySlug}`;
}

export function pathwayLevelContentObjectId(pathwaySlug: string, tier: PathwayLevelTier): string {
  return `pathway-level:${pathwaySlug}:${tier}`;
}

export function totalPathwayFinalQuestions(): number {
  return PATHWAY_FINAL_TOTAL_QUESTIONS;
}

export const PATHWAY_FINAL_ASSESSMENT_SYSTEM_PROMPT = `You are an expert assessment designer for a corporate learning platform.

Generate evaluation questions strictly from the provided course syllabus for ONE difficulty tier at a time.

Rules:
- Mix MULTIPLE_CHOICE and CODE question types as requested.
- MCQ: exactly 4 options (A–D), one correct answer, 1 point each.
- CODE: include codeTemplate starter code and correctAnswer describing expected output/behavior, 2–3 points.
- Questions must reflect ONLY the syllabus content for that tier.
- Difficulty must match the tier label (Basic = foundational, Expert = advanced applied).
- Return ONLY a JSON array ordered from easier to harder within the tier.

Each item:
- question (string)
- type ("MULTIPLE_CHOICE" | "CODE")
- options (string[4] for MCQ)
- correctAnswer (string)
- codeTemplate (string, for CODE)
- points (number)
- tier (string: Basic|Intermediate|Advanced|Expert)`;

export function pathwayFinalAssessmentUserPrompt(
  tierLabel: string,
  courseTitle: string,
  mcqCount: number,
  codeCount: number,
  syllabusJson: string
): string {
  return `Generate ${mcqCount} MULTIPLE_CHOICE and ${codeCount} CODE questions for the "${tierLabel}" section of "${courseTitle}".

Syllabus for this tier:
${syllabusJson}

Order within this tier: MCQ questions first, then CODE questions. Stay within this tier only.`;
}
