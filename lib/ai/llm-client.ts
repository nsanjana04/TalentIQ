import { getOpenAiClient, getOpenAiModel } from "@/lib/ai/openai-client";

export type LlmProvider = "gemini" | "openai";

function resolveProvider(): LlmProvider {
  const raw = (process.env.AI_LLM_PROVIDER ?? "gemini").toLowerCase();
  return raw === "openai" ? "openai" : "gemini";
}

export function getLlmProvider(): LlmProvider {
  return resolveProvider();
}

export function isLlmEnabled(): boolean {
  if (process.env.AI_COPILOT_LLM_ENABLED !== "true") return false;

  const provider = resolveProvider();
  if (provider === "openai") {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  }
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

async function queryGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      console.error("[llm-client] Gemini error", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return text.trim() || null;
  } catch (error) {
    console.error("[llm-client] Gemini request failed", error);
    return null;
  }
}

async function queryOpenAi(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const openai = getOpenAiClient();
  if (!openai) return null;

  const model = getOpenAiModel();

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    });

    return completion.choices[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error("[llm-client] OpenAI request failed", error);
    return null;
  }
}

export async function queryLlm(
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  if (!isLlmEnabled()) return null;

  const provider = resolveProvider();
  if (provider === "openai") {
    return queryOpenAi(systemPrompt, userPrompt);
  }
  return queryGemini(systemPrompt, userPrompt);
}
