import { zodResponseFormat } from "openai/helpers/zod";
import {
  generatedAssessmentBatchSchema,
  type GeneratedAssessmentQuestion,
} from "@/lib/ai/assessment-question-schema";
import { getLlmProvider, isLlmEnabled, queryLlm } from "@/lib/ai/llm-client";
import {
  getOpenAiClient,
  getOpenAiModel,
  supportsStructuredOutputs,
} from "@/lib/ai/openai-client";

export type GenerateAssessmentQuestionsResult = {
  questions: GeneratedAssessmentQuestion[];
  aiPowered: boolean;
  provider: "openai" | "gemini" | "fallback";
};

function parseQuestionsFromRawLlm(raw: string): GeneratedAssessmentQuestion[] {
  const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { questions?: unknown }).questions)
        ? (parsed as { questions: unknown[] }).questions
        : [];

    const result = generatedAssessmentBatchSchema.safeParse({ questions: rows });
    return result.success ? result.data.questions : [];
  } catch {
    return [];
  }
}

async function generateWithOpenAiStructured(
  systemPrompt: string,
  userPrompt: string
): Promise<GeneratedAssessmentQuestion[] | null> {
  const openai = getOpenAiClient();
  if (!openai) return null;

  const model = getOpenAiModel();

  try {
    if (supportsStructuredOutputs(model)) {
      const completion = await openai.chat.completions.parse({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: zodResponseFormat(generatedAssessmentBatchSchema, "assessment_questions"),
      });

      const parsed = completion.choices[0]?.message?.parsed;
      if (parsed?.questions?.length) {
        return parsed.questions;
      }
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return null;
    return parseQuestionsFromRawLlm(content);
  } catch (error) {
    console.error("[generate-assessment-questions] OpenAI error", error);
    return null;
  }
}

/**
 * Generate assessment questions from syllabus prompts.
 * Uses OpenAI Structured Outputs when `AI_LLM_PROVIDER=openai`, else Gemini/raw LLM.
 */
export async function generateAssessmentQuestions(
  systemPrompt: string,
  userPrompt: string
): Promise<GenerateAssessmentQuestionsResult> {
  if (!isLlmEnabled()) {
    return { questions: [], aiPowered: false, provider: "fallback" };
  }

  const provider = getLlmProvider();

  if (provider === "openai") {
    const structured = await generateWithOpenAiStructured(systemPrompt, userPrompt);
    if (structured?.length) {
      return { questions: structured, aiPowered: true, provider: "openai" };
    }
  }

  const raw = await queryLlm(systemPrompt, userPrompt);
  if (raw) {
    const parsed = parseQuestionsFromRawLlm(raw);
    if (parsed.length) {
      return {
        questions: parsed,
        aiPowered: true,
        provider: provider === "openai" ? "openai" : "gemini",
      };
    }
  }

  return { questions: [], aiPowered: false, provider: "fallback" };
}
