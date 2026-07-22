import type { QuestionType } from "@/types/assessments";
import {
  CODING_ROUND_PASSING_COUNT,
  CODING_ROUND_QUESTION_COUNT,
  MODULE_EXAM_PASSING_COUNT,
  MODULE_QUIZ_QUESTION_COUNT,
} from "@/constants/assessment-prompts";

export type ExamKind = "module" | "final";

export function modulePassingPercent(): number {
  return Math.round((MODULE_EXAM_PASSING_COUNT / MODULE_QUIZ_QUESTION_COUNT) * 100);
}

export function finalPassingPercent(): number {
  return Math.round((CODING_ROUND_PASSING_COUNT / CODING_ROUND_QUESTION_COUNT) * 100);
}

export function formatModulePassRequirement(): string {
  return `${MODULE_EXAM_PASSING_COUNT} of ${MODULE_QUIZ_QUESTION_COUNT} correct (${modulePassingPercent()}%)`;
}

export function formatFinalPassRequirement(): string {
  return `${CODING_ROUND_PASSING_COUNT} of ${CODING_ROUND_QUESTION_COUNT} correct (${finalPassingPercent()}%)`;
}

export function getQuestionEvaluationLabel(type: QuestionType): string {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "Auto-graded: your selected option is compared to the answer key (exact match).";
    case "TRUE_FALSE":
      return "Auto-graded: True/False compared to the answer key.";
    case "SHORT_ANSWER":
      return "Auto-graded: your text is compared to the expected answer (case-insensitive, trimmed).";
    case "CODE":
      return "Auto-graded: code/output checked against expected behavior; suspicious submissions may be flagged for manual review.";
    case "ESSAY":
      return "Manual review: an instructor reviews your response before a final score is recorded.";
    default:
      return "Graded per question rubric.";
  }
}

export function getExamGradingSummary(kind: ExamKind = "module"): string[] {
  if (kind === "final") {
    return [
      `This final exam has ${CODING_ROUND_QUESTION_COUNT} questions (1 mark each). Pass with ${formatFinalPassRequirement()}.`,
      "Questions are generated from all modules you completed, including coding or scenario items when applicable.",
      "Multiple choice and true/false are auto-graded instantly.",
      "Coding answers may be checked for output/behavior; high AI-suspicion flags manual review — not an automatic fail.",
      "The next module unlocks only after you pass the previous module exam.",
    ];
  }

  return [
    `This module exam has ${MODULE_QUIZ_QUESTION_COUNT} questions. Your score is always 0–100%: (correct answers ÷ total questions) × 100. Pass with ${formatModulePassRequirement()}.`,
    "Questions are generated automatically from this module's lessons when you start (AI uses module syllabus only).",
    "Each correct answer counts equally toward your percentage. Example: 10 of 15 correct = 67%.",
    "Each MCQ has four options (A–D); exactly one correct answer. No answer key is shown until you submit.",
    "The next module assessment unlocks only after you pass this one.",
  ];
}
