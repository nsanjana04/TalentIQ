/** Udemy onboarding PDF — module exam: 15 MCQs, pass 10/15. */
export const MODULE_QUIZ_QUESTION_COUNT = 15;
export const MODULE_EXAM_PASSING_COUNT = 10;
/** Stored on Assessment.passingScore (percentage). */
export const MODULE_PASSING_SCORE = Math.round(
  (MODULE_EXAM_PASSING_COUNT / MODULE_QUIZ_QUESTION_COUNT) * 100
);

/** Udemy onboarding PDF — final exam: 25 questions, pass 17/25. */
export const CODING_ROUND_QUESTION_COUNT = 25;
export const CODING_ROUND_PASSING_COUNT = 17;
export const CODING_ROUND_PASSING_SCORE = Math.round(
  (CODING_ROUND_PASSING_COUNT / CODING_ROUND_QUESTION_COUNT) * 100
);

export const CODE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const ALLOWED_CODE_UPLOAD_EXTENSIONS = [".txt"] as const;

/**
 * System prompt for AI module quiz generation (Udemy Onboarding Exam Guide §9.1).
 */
export const MODULE_QUIZ_SYSTEM_PROMPT = `You are an expert corporate learning designer and MCQ generator for a company onboarding portal.

Generate module exams strictly from the provided module syllabus JSON.

Rules for each module exam:
- Exactly 15 MCQ questions (questionType: mcq → use type MULTIPLE_CHOICE in output array).
- Four options labeled A, B, C, D (return as options object OR string array).
- Exactly one correct answer per question.
- 1 mark per question (points: 1).
- Passing score is 10 out of 15.
- Q1–Q5 difficulty: medium.
- Q6–Q10 difficulty: easy.
- Q11–Q15 difficulty: moderately_tough.
- Questions must stay strictly within the selected module content only.
- No trick questions; avoid "all of the above" unless unavoidable.

Return ONLY a JSON array. Each item must have:
- question (string)
- type ("MULTIPLE_CHOICE")
- options (string array of 4 choices OR object {"A":"","B":"","C":"","D":""})
- correctAnswer (string — full option text OR letter A|B|C|D)
- points (number, always 1)
- difficulty (optional: medium|easy|moderately_tough)

Do not wrap in extra keys unless returning a single module exam array inside moduleExams.`;

/**
 * User prompt template for module quiz generation.
 */
export const MODULE_QUIZ_USER_PROMPT_TEMPLATE = `Generate exactly {{questionCount}} MCQ questions for module "{{moduleTitle}}" in course "{{courseTitle}}".

Module syllabus:
{{syllabusJson}}

Follow difficulty distribution: Q1-5 medium, Q6-10 easy, Q11-15 moderately_tough.
Passing score: {{passingCount}} out of {{questionCount}}.
Stay within this module only.`;

/**
 * System prompt for final / coding round (Udemy guide §9.2).
 */
export const CODING_ROUND_SYSTEM_PROMPT = `You are an expert assessment designer for a corporate onboarding portal final course exam.

Generate exactly 25 questions covering all modules fairly.

Rules:
- Total marks: 25 (1 mark each).
- Passing score: 17 out of 25.
- Q1–Q8 difficulty: easy.
- Q9–Q17 difficulty: medium.
- Q18–Q25 difficulty: hard.
- Cover every module; stay within full course content only.
- For technical courses include coding_task, output_prediction, debugging_task where appropriate.
- MCQ: four options A–D, one correct answer.
- Coding questions: include codeTemplate starter code and expected output/behavior in correctAnswer.

Return ONLY a JSON array. Each item:
- question (string)
- type ("MULTIPLE_CHOICE" | "CODE" | "SHORT_ANSWER")
- options (string array, required for MULTIPLE_CHOICE)
- correctAnswer (string)
- codeTemplate (string, for CODE)
- points (number, 1 for MCQ, 2-5 for CODE)
- difficulty (easy|medium|hard)`;

export const CODING_ROUND_USER_PROMPT_TEMPLATE = `Generate exactly {{questionCount}} questions for the "{{courseTitle}}" final exam.

Modules covered:
{{modulesSummary}}

Passing score: {{passingCount}} out of {{questionCount}}.
Difficulty: Q1-8 easy, Q9-17 medium, Q18-25 hard.`;

export function fillPromptTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
    template
  );
}
