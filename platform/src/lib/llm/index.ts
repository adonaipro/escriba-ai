import { LlmProvider, LlmProviderConfig } from "./types";
import { SimulatedProvider } from "./providers/simulated";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenRouterProvider } from "./providers/openrouter";

export { SimulatedProvider } from "./providers/simulated";
export { OpenAIProvider } from "./providers/openai";
export { AnthropicProvider } from "./providers/anthropic";
export { OpenRouterProvider } from "./providers/openrouter";
export type { NarrativeInput, NarrativeOutput, LlmProvider, LlmProviderConfig } from "./types";

/**
 * Resolve the effective LLM config for a profile:
 * 1. User's own BYOK key (if apiKey is set)
 * 2. Platform key from ESCRIBA_GROQ_API_KEY env var
 * 3. null → falls back to SimulatedProvider
 */
export function resolveEffectiveLlmConfig(
  userConfig: { provider: string; apiKey: string; model: string; baseUrl: string } | null,
): LlmProviderConfig | null {
  const hasByok = !!(userConfig?.apiKey && userConfig.provider && userConfig.provider !== "simulated");
  if (hasByok) {
    return {
      provider: userConfig!.provider as LlmProviderConfig["provider"],
      apiKey:   userConfig!.apiKey   || undefined,
      model:    userConfig!.model    || undefined,
      baseUrl:  userConfig!.baseUrl  || undefined,
    };
  }
  const platformKey = process.env.ESCRIBA_GROQ_API_KEY;
  if (platformKey) {
    return { provider: "groq", apiKey: platformKey, model: "llama-3.3-70b-versatile" };
  }
  return null;
}

export function getLlmProvider(config?: LlmProviderConfig | null): LlmProvider {
  if (!config || config.provider === "simulated" || !config.apiKey) {
    return new SimulatedProvider();
  }

  switch (config.provider) {
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "openrouter":
      return new OpenRouterProvider(config);
    case "groq":
      return new OpenAIProvider({
        ...config,
        baseUrl: config.baseUrl || "https://api.groq.com/openai/v1",
        model: config.model || "llama-3.3-70b-versatile",
      });
    default:
      return new SimulatedProvider();
  }
}

export const PROVIDER_META: Record<string, { label: string; models: string[]; placeholder: string; recommended?: boolean; helpUrl?: string }> = {
  groq: {
    label: "Groq — Llama 3.3 70B (Recomendado · Gratuito)",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "llama3-70b-8192",
      "mixtral-8x7b-32768",
    ],
    placeholder: "gsk_...",
    recommended: true,
    helpUrl: "https://console.groq.com/keys",
  },
  openai: {
    label: "OpenAI",
    models: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o", "gpt-4.1"],
    placeholder: "sk-...",
  },
  anthropic: {
    label: "Anthropic (Claude)",
    models: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-8"],
    placeholder: "sk-ant-...",
  },
  openrouter: {
    label: "OpenRouter",
    models: [
      "meta-llama/llama-3.1-8b-instruct:free",
      "meta-llama/llama-3.3-70b-instruct",
      "google/gemini-flash-1.5",
      "mistralai/mistral-7b-instruct:free",
    ],
    placeholder: "sk-or-...",
    helpUrl: "https://openrouter.ai/keys",
  },
};
