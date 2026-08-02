// Content Engine V2 — Single-post modes (desabafo / polêmica / pergunta)
// Mode defines voice. No fixed "reflexivo", no tone hypothesis/learning.

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import {
  THREADS_TEXT_MAX_CHARS,
  assertThreadsPostsWithinLimit,
  measureThreadsTextLength,
} from "@/lib/publishing/threads-limits";

export type SingleContentMode = "desabafo" | "polemica" | "pergunta";

/** Character limits (Threads-aware length). */
const MODE_LIMITS: Record<
  SingleContentMode,
  { min: number; max: number; label: string }
> = {
  pergunta: { min: 20, max: 180, label: "1–2 frases, máximo 180 caracteres" },
  polemica: { min: 150, max: 350, label: "curta e direta, cerca de 150–350 caracteres" },
  desabafo: { min: 250, max: 500, label: "cerca de 250–500 caracteres" },
};

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
      max_tokens: 450,
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

/**
 * Extract plain post text. Never return raw JSON like {"post":"..."}.
 */
export function extractPost(raw: string): string {
  let text = (raw ?? "").trim();
  if (!text) return "";

  // Strip markdown fences
  const fence = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fence?.[1]) text = fence[1].trim();

  // Prefer JSON object with post field
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) {
    const slice = text.slice(s, e + 1);
    try {
      const parsed = JSON.parse(slice) as { post?: unknown; content?: unknown; text?: unknown };
      const candidate =
        (typeof parsed.post === "string" && parsed.post) ||
        (typeof parsed.content === "string" && parsed.content) ||
        (typeof parsed.text === "string" && parsed.text) ||
        "";
      if (candidate.trim()) return unwrapQuoted(candidate.trim());
    } catch {
      // try regex pull of "post":"..."
      const m =
        slice.match(/"post"\s*:\s*"((?:\\.|[^"\\])*)"/) ||
        slice.match(/"post"\s*:\s*'((?:\\.|[^'\\])*)'/);
      if (m?.[1]) {
        try {
          return unwrapQuoted(JSON.parse(`"${m[1]}"`) as string);
        } catch {
          return unwrapQuoted(m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'));
        }
      }
    }
  }

  // If the whole string still looks like JSON metadata, strip outer braces noise
  if (/^\s*\{\s*"post"\s*:/.test(text)) {
    const m = text.match(/"post"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (m?.[1]) {
      try {
        return unwrapQuoted(JSON.parse(`"${m[1]}"`) as string);
      } catch {
        return unwrapQuoted(m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'));
      }
    }
  }

  // Reject leftover JSON shells
  if (/^\s*\{[\s\S]*\}\s*$/.test(text) && text.includes('"post"')) {
    return "";
  }

  return unwrapQuoted(text);
}

function unwrapQuoted(s: string): string {
  let t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1);
  }
  return t.replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
}

/** Mode voice for metadata — not hypothesis learning. */
function toneForMode(mode: SingleContentMode, post: string): string {
  if (mode === "pergunta") return "casual";
  if (mode === "polemica") return "provocativo";
  // desabafo: infer from generated text
  const lower = post.toLowerCase();
  if (/indignad|absurdo|não acredito|que raiva|absurda/.test(lower)) return "indignado";
  if (/frustr|não aguento|cansei|já tentei|de novo/.test(lower)) return "frustrado";
  if (/decepcion|esperava|me deixou|que decepção/.test(lower)) return "decepcionado";
  if (/triste|chorei|apert|sozinho|sozinha/.test(lower)) return "emocional";
  return "emocional";
}

function emotionForMode(mode: SingleContentMode, post: string): string {
  if (mode === "pergunta") return "curiosidade";
  if (mode === "polemica") return "opinião";
  return toneForMode("desabafo", post);
}

function buildSystem(mode: SingleContentMode): string {
  const limits = MODE_LIMITS[mode];

  const modeBlock =
    mode === "pergunta"
      ? `Modo: PERGUNTA
Linguagem: conversa de celular em 15 segundos. Português NATURAL, não "bonito", não de redação, não de pesquisa.
Como se a pessoa tivesse acabado de pensar em voz alta e digitasse no Threads.

Tamanho: ${limits.label} (máx. ${limits.max} caracteres).
Pode ser SÓ a pergunta. Não obrigue mini-história nem setup antes.

O post deve parecer um pensamento espontâneo — não uma enquete, não um formulário, não um título de blog.

Antes de finalizar, pergunte internamente: "Uma pessoa real escreveria isso no Threads?"
Se a resposta for não, reescreva com palavras do dia a dia.

Impulso em quem lê (pelo menos um): contar experiência, dar opinião, confessar hábito, lembrar de alguém, escolher entre duas posições.

Direção de SOM (não copie, não vire template):
- fala de boca, gíria leve, "vocês", "eu", "mais alguém", "sou só eu ou…"
- pergunta que puxa conversa de verdade

VOCABULÁRIO PROIBIDO (soa IA / formal demais — nunca use):
trivial, inconveniência, facilitar a vida, compartilhar, compartilhe, situação, enfrenta, enfrentam, rotina diária, no dia a dia (como jargão), de maneira, de forma que, qual situação, você enfrenta, impactar, otimizar, refletir, refletindo, questionar, questionamento, percepção, cotidianidade, absurdamente (forçado), imprescindível, de fato, no final das contas

MOLDES PROIBIDOS:
- "Você já…"
- "Qual foi a última vez…"
- "Alguém mais…?" / "Quem mais já passou…"
- "Por que sempre que você…"
- "Qual situação…"
- "Você enfrenta…"
- "Compartilhe!" / "Conta aí nos comentários"
- "É tão frustrante quando…"

Sem futilidade vazia (cabo, embalagem genérica) salvo observação muito específica e humana.
Sem moral, sem filosofia, sem CTA.
Invente pergunta nova; não recicle a mesma estrutura.`
      : mode === "polemica"
        ? `Modo: POLÊMICA
Tom: provocativa, opinativa e firme.
Tamanho: ${limits.label} (limite duro: ${limits.max} caracteres).
Defenda UMA opinião capaz de gerar discordância — lado claro, sem meias palavras.
PROIBIDO: "Você já…", "Qual foi a última vez…", reflexão genérica, moral da história, tom de blog.
Sem pedir desculpas pela opinião.`
        : `Modo: DESABAFO
Tom: emocional — indignado, frustrado ou decepcionado conforme o que você inventar na cena.
Tamanho: ${limits.label} (limite duro: ${limits.max} caracteres).
Precisa de emoção real + um incômodo CONCRETO (gesto, frase, detalhe do dia a dia).
PROIBIDO: filosofia vazia, "Você já…", "Qual foi a última vez…", conclusão moral, texto de blog.`;

  const voiceLine =
    mode === "pergunta"
      ? "Você escreve UM único post para o Threads, em português do Brasil — pode ser só a pergunta, sem mini-crônica."
      : "Você escreve UM único post para o Threads, em português do Brasil, 1ª pessoa.";

  const generalRules =
    mode === "pergunta"
      ? `Regras gerais:
- Escreva como fala: curto, coloquial, sem palavras de dicionário raro.
- Sem hashtag, sem emoji, sem link, sem "compartilhe".
- Sem mini-história obrigatória.
- Prefira palavras simples que qualquer um usa no WhatsApp.`
      : `Regras gerais:
- Natural, conversacional, plausível.
- Sem hashtag, sem emoji, sem link, sem CTA.
- Sem copiar frases prontas de autoajuda.
- Escolha uma situação específica (evite mercado/fila/trânsito genéricos).`;

  return `${voiceLine}

Objetivo: ${mode === "pergunta" ? "puxar resposta de gente real — experiência, opinião, mania, memória ou escolha. NÃO parecer pesquisa nem texto de IA." : 'identificação. Quem lê pensa "isso sou eu" ou "já ouvi isso".'}

${modeBlock}

${generalRules}

Responda APENAS com JSON válido no formato exato:
{"post":"texto do post aqui"}
O valor de "post" deve ser só o texto legível — nunca meta-JSON.`;
}

function buildUser(mode: SingleContentMode, audienceHint: string): string {
  const limits = MODE_LIMITS[mode];
  if (mode === "pergunta") {
    return `Escreva 1 pergunta de Threads, linguagem de conversa (15 segundos no celular).
Público (leve, não force produto): ${audienceHint}
Até ${limits.max} caracteres; ideal 1 frase.
Só a pergunta (ou observação minúscula + pergunta) — sem crônica.
Português falado: sem "trivial", "inconveniência", "compartilhe", "qual situação", "você enfrenta", "facilitar a vida".
Cheque: alguém real postaria isso? Se não, reescreva.
Sem moldes de engajamento. Sem pesquisa. Sem IA formal.
Responda só com {"post":"..."} — texto puro.`;
  }
  return `Escreva 1 ${mode} original.
Público (contexto leve, não force produto): ${audienceHint}
Tamanho alvo: ${limits.label}. Contagem aproximada entre ${limits.min} e ${limits.max} caracteres.
Seja diferente a cada vez.
Responda só com {"post":"..."} — o texto final deve ser legível sem chaves JSON.`;
}

function lengthOk(mode: SingleContentMode, post: string): boolean {
  const n = measureThreadsTextLength(post);
  const { min, max } = MODE_LIMITS[mode];
  // Soft min: allow slightly under for pergunta if still 1 sentence
  const softMin = mode === "pergunta" ? Math.min(min, 15) : Math.floor(min * 0.85);
  return n >= softMin && n <= max && n <= THREADS_TEXT_MAX_CHARS;
}

export interface ContentResult {
  post: string;
  tone: string;
  emotion: string;
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
  const limits = MODE_LIMITS[contentMode];

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

  const formulaicPergunta =
    contentMode === "pergunta" &&
    /você já|qual foi a última vez|alguém mais|quem mais já|por que sempre que você|aquela hora que você|é tão frustrante quando|qual situação|você enfrenta|inconveni[eê]ncia|trivial|compartilhe|facilitar a vida|de maneira que|de forma que|questionamento|cotidianidade|imprescindível/i.test(
      post || "",
    );

  // Retry if empty, looks like JSON, out of size band, or formulaic pergunta mold
  const needsRetry =
    !post ||
    post.includes('{"post"') ||
    /^\s*\{/.test(post) ||
    !lengthOk(contentMode, post) ||
    formulaicPergunta;

  if (needsRetry) {
    const len = measureThreadsTextLength(post || "");
    const retryUser =
      contentMode === "pergunta"
        ? `${baseUser}

A resposta anterior soou IA/formal ou usou molde/vocab proibido (${len} chars).
Reescreva do zero em português de conversa (WhatsApp/Threads), 1 frase se der.
Só pergunta espontânea. Sem trivial/inconveniência/compartilhe/qual situação/você enfrenta/facilitar a vida.
Sem "Você já / Quem mais / Alguém mais / Qual foi a última vez".
Cheque: pessoa real postaria isso em 15s? Se não, mais simples ainda.
Responda APENAS: {"post":"texto puro"}`
        : `${baseUser}

A resposta anterior foi inválida ou fora do tamanho (${len} caracteres; alvo ${limits.min}–${limits.max}).
Reescreva do zero o MESMO tipo de post (${contentMode}).
Tom correto do modo. Sem "Você já…", sem "Qual foi a última vez…", sem moral, sem blog.
Responda APENAS: {"post":"texto puro"}`;
    try {
      raw = await call(system, retryUser, config, ctx, seed + 1);
      post = extractPost(raw);
    } catch {
      // fall through
    }
  }

  // Last-chance cleanup
  post = extractPost(post);
  if (!post || post.includes('{"post"') || /^\s*\{[\s\S]*"post"/.test(post)) {
    throw new Error("Content Engine: não foi possível extrair texto legível do post");
  }

  // Hard cap Threads
  if (measureThreadsTextLength(post) > THREADS_TEXT_MAX_CHARS) {
    const retryUser = `${baseUser}

Encurte para no máximo ${Math.min(limits.max, THREADS_TEXT_MAX_CHARS)} caracteres. Mesma ideia. JSON: {"post":"..."}`;
    try {
      raw = await call(system, retryUser, config, ctx, seed + 2);
      post = extractPost(raw);
    } catch {
      // fall through
    }
  }

  assertThreadsPostsWithinLimit([{ position: 1, content: post }]);

  const tone = toneForMode(contentMode, post);
  const emotion = emotionForMode(contentMode, post);

  return {
    post,
    tone,
    emotion,
    callCount: ctx.callCount,
    totalTokens: ctx.totalTokens,
    durationMs: Date.now() - t0,
    provider: config.provider,
    model: config.model ?? resolveModel(config),
  };
}
