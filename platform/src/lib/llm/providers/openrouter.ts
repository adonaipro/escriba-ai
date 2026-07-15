import { LlmProvider, LlmProviderConfig, NarrativeInput, NarrativeOutput } from "../types";
import { buildNarrativePrompt, parseNarrativeJson } from "../narrative-prompt";

// OpenRouter uses the OpenAI-compatible API format
export class OpenRouterProvider implements LlmProvider {
  name = "openrouter";
  private config: LlmProviderConfig;

  constructor(config: LlmProviderConfig) {
    this.config = config;
  }

  async generateNarrative(input: NarrativeInput): Promise<NarrativeOutput> {
    const prompt = buildNarrativePrompt(input);
    const model = this.config.model || "meta-llama/llama-3.1-8b-instruct:free";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        "HTTP-Referer": "https://narrative-engine.app",
        "X-Title": "Narrative Intelligence Platform",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${err}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const raw = data.choices[0]?.message?.content ?? "";
    const parsed = parseNarrativeJson(raw);
    return validated(parsed);
  }
}

function validated(obj: Record<string, unknown>): NarrativeOutput {
  const posts = (obj.posts as Array<{ position: number; content: string; hasMedia: boolean }>) ?? [];
  const role = String(obj.role ?? obj.character ?? "");
  return {
    hook: String(obj.hook ?? ""),
    narrativeSummary: String(obj.narrativeSummary ?? ""),
    format: String(obj.format ?? "narrative_staircase"),
    family: String(obj.family ?? ""),
    emotion: String(obj.emotion ?? ""),
    character: String(obj.character ?? role),
    setting: String(obj.setting ?? ""),
    object: String(obj.object ?? obj.conflictObject ?? ""),
    conflict: String(obj.conflict ?? ""),
    twist: String(obj.twist ?? ""),
    role,
    conflictObject: String(obj.conflictObject ?? obj.object ?? ""),
    sceneMoment: String(obj.sceneMoment ?? ""),
    moralQuestion: String(obj.moralQuestion ?? ""),
    productPosition: Number(obj.productPosition ?? 5),
    productStrategy: (String(obj.productStrategy ?? "hybrid")) as "clickbait" | "contextual" | "hybrid",
    tone: String(obj.tone ?? "emocional"),
    rhythm: String(obj.rhythm ?? "médio"),
    structureType: String(obj.structureType ?? "escadaria"),
    openingStyle: String(obj.openingStyle ?? "emoção primeiro"),
    conflictType: String(obj.conflictType ?? "cotidiano"),
    questionType: String(obj.questionType ?? "moral"),
    posts: posts.map((p) => ({
      position: Number(p.position),
      content: String(p.content ?? ""),
      hasMedia: Boolean(p.hasMedia),
    })),
  };
}
