import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAiClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/** Models that support Structured Outputs via `response_format` / `.parse()`. */
export function supportsStructuredOutputs(model: string): boolean {
  return (
    model.includes("gpt-4o") ||
    model.includes("gpt-4.1") ||
    model.includes("gpt-5") ||
    model.includes("o1") ||
    model.includes("o3") ||
    model.includes("o4")
  );
}
