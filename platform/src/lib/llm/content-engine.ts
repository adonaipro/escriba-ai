// Content Engine V2 — Single-post modes (desabafo / polêmica / pergunta)
// Same philosophy as Story Engine V2: identification + creative freedom.
// No fixed betrayal lists, no forced cast. Technical limits only.

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import {
  THREADS_TEXT_MAX_CHARS,
  assertThreadsPostsWithinLimit,
  measureThreadsTextLength,
} from "@/lib/publishing/threads-limits";

export type SingleContentMode = "desabafo" | "polemica" | "pergunta";

interface Ctx {
  callCount: number;
  totalTokens: number;
}

function resolveBaseUrl(config: LlmProviderConfig): string {
  if (config.baseUrl) return config.baseUrl.replace(/\/$/, "");
  if (config.provider === "openai") return "https://api.openai.com/v1";
  if (config.provider === "openrouter") return "https://openrouter.ai/api/v1";
  if (config.provider === "anthropic") return "https://api.anthropic.com/v1";
  return "https://api.groq.com/openai/v1";
}

function resolveModel(config: LlmProviderConfig): string {
  if (config.model) return config.model;
  if (config.provider === "openai") return "gpt-4o-mini";
  if (config.provider === "anthropic") return "claude-haiku-4-5-20251001";
  return "llama-3.3-70b-versatile";
}

async function call(
  system: string,
  user: string,
  config: LlmProviderConfig,
  ctx: Ctx,
  seed: number,
): Promise<string> {
  ctx.callCount++;
  const baseUrl = resolveBaseUrl(config);
  const model = resolveModel(config);
  const supportsSeed = config.provider !== "anthropic";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 1.0,
      max_tokens: 300,
      ...(supportsSeed ? { seed } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Content Engine API ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };
  ctx.totalTokens += json.usage?.total_tokens ?? 0;
  return json.choices[0]?.message?.content ?? "";
}

function extractPost(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
  const clean = fence ? fence[1]! : raw;
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  if (s !== -1 && e !== -1) {
    try {
      const parsed = JSON.parse(clean.slice(s, e + 1)) as { post?: string };
      if (parsed.post) return parsed.post.trim();
    } catch {
      // fall through
    }
  }
  return raw.trim();
}

const MODE_HINT: Record<SingleContentMode, string> = {
  desabafo:
    "Formato: um desabafo curto em 1ª pessoa — pensamento espontâneo, como se a pessoa tivesse acabado de viver algo e abrisse o celular.",
  polemica:
    "Formato: uma opinião afiada em poucas frases — divide a sala sem ser gratuita; parece algo que alguém diria de verdade.",
  pergunta:
    "Formato: um mini-relato ou situação vivida que termina numa pergunta natural — a curiosidade nasce do que foi contado, não de um formulário.",
};

const PERGUNTA_RULES = `
Modo pergunta — regras:
- A pergunta deve nascer da história/situação (identificação ou curiosidade real).
- PROIBIDO estruturas de formulário: "Você já…", "Qual foi a última vez…", "Alguém mais…?", "Quem mais…?".
- Prefira perguntas que só façam sentido depois do que foi dito (ângulo, escolha, constrangimento, dúvida honesta).
- Não comece o post com a pergunta; conte o suficiente para a pergunta fechar com peso.`;

function buildSystem(mode: SingleContentMode): string {
  return `Você escreve um único post para o Threads.

Objetivo: identificação. Quem lê deve pensar "isso sou eu" ou "conheço alguém assim".

Antes de escrever, escolha uma situação cotidiana ESPECÍFICA e diferente das batidas (evite mercado, fila, trânsito, chuva genérica, "indo pro trabalho" genérico).
Você é livre para escolher o assunto, as pessoas e o ângulo.
Não force traição, ex, ou guerra dos sexos — use só se a situação real pedir.

${MODE_HINT[mode]}
${mode === "pergunta" ? PERGUNTA_RULES : ""}

Tom: natural, cotidiano, conversacional, plausível. Sem hashtag, sem emoji, sem filosofia vazia.
Limite: no máximo ${THREADS_TEXT_MAX_CHARS} caracteres.

Responda APENAS com JSON: {"post":"..."}`;
}

function buildUser(mode: SingleContentMode, audienceHint: string): string {
  return `Escreva 1 ${mode} original e identificável.
Contexto opcional de público (não force produto): ${audienceHint}
Seja diferente a cada vez. Não recicle a mesma ideia.${
    mode === "pergunta"
      ? "\nLembrete: sem 'Você já…' / 'Qual foi a última vez…'; a pergunta nasce do relato."
      : ""
  }`;
}

export interface ContentResult {
  post: string;
  callCount: number;
  totalTokens: number;
  durationMs: number;
  provider: string;
  model: string;
}

export async function generateContentPost(
  universe: ProductUniverse | null,
  contentMode: SingleContentMode,
  seed: number,
  config: LlmProviderConfig,
): Promise<ContentResult> {
  const t0 = Date.now();
  const ctx: Ctx = { callCount: 0, totalTokens: 0 };

  const pains = universe?.pains ?? [];
  const audienceHint =
    pains.length > 0
      ? pains
          .slice(0, 2)
          .filter(Boolean)
          .join("; ")
          .replace(/https?:\/\/[^\s,)]+/g, "")
          .trim()
      : "pessoas comuns no dia a dia";

  const system = buildSystem(contentMode);
  const baseUser = buildUser(contentMode, audienceHint || "pessoas comuns no dia a dia");

  let raw = await call(system, baseUser, config, ctx, seed);
  let post = extractPost(raw);

  if (measureThreadsTextLength(post) > THREADS_TEXT_MAX_CHARS) {
    const retryUser = `${baseUser}

A resposta anterior tinha ${measureThreadsTextLength(post)} caracteres (limite ${THREADS_TEXT_MAX_CHARS}).
Reescreva o MESMO post com no máximo ${THREADS_TEXT_MAX_CHARS} caracteres, sem perder a ideia.`;
    try {
      raw = await call(system, retryUser, config, ctx, seed + 1);
      post = extractPost(raw);
    } catch {
      // fall through
    }
  }

  assertThreadsPostsWithinLimit([{ position: 1, content: post }]);

  return {
    post,
    callCount: ctx.callCount,
    totalTokens: ctx.totalTokens,
    durationMs: Date.now() - t0,
    provider: config.provider,
    model: config.model ?? resolveModel(config),
  };
}
