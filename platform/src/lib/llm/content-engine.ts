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
      ? `Modo: ABRIR UMA CONVERSA
(Não trate como "fazer uma pergunta" ou interrogatório. Trate como puxar papo no Threads.)

Antes de escrever, entre no personagem:
Uma pessoa entre 20 e 35 anos abriu o app porque quis conversar — não porque quer descrever um probleminha do dia.
Ela não está tentando viralizar nem escrever bonito.
Ela digita em ~15 segundos, pensando em voz alta.

Antes de gerar, pense:
"O que faria alguém parar de rolar o feed e responder sem pensar muito?"

Em geral isso envolve algo que a pessoa TEM para contar ou defender:
hábito, opinião, confissão, escolha difícil, compra, arrependimento, mania, experiência curiosa, coisa que divide opinião.
NÃO invente "pequenos problemas do cotidiano" / inconveniências aleatórias só para parecer realista.
Não descreva situação bança. O objetivo não é narrar um momento — é ABRIR UMA CONVERSA.

Escreva como essa pessoa: informal, espontâneo, coloquial, como se fala.
Contrações, interjeições, português falado — não precisa ser perfeito.
Não escreva como escritor, redator ou IA.

Tamanho: até ${limits.max} caracteres.

Diversidade de construção:
Cada post nasce de um pensamento diferente e de uma forma diferente de começar.
Às vezes começa com opinião, confissão, observação, surpresa, dúvida, uma frase de história — e só vira convite a responder se fizer sentido.
Às vezes é só o convite direto. Não use sempre a mesma estrutura.
Imagine que ainda vai escrever mais 100: nenhuma com a mesma forma.

Priorize: "eu teria vontade de responder isso" + "eu escreveria exatamente isso".
Não priorize "parece cotidiano" se for só um probleminha sem conversa.

Depois de escrever, valide:
1) Se eu lesse no Threads, eu pararia para responder ou só continuaria rolando?
2) Parece pessoa comum, não engajamento fabricado?
Se a resposta for "eu continuaria rolando" ou soar IA, reescreva do zero com outro ângulo (opinião, hábito, confissão, escolha, compra, mania, experiência que puxa história).`
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
      ? "Você é uma pessoa comum no Threads abrindo uma conversa (não um modelo fazendo perguntas)."
      : "Você escreve UM único post para o Threads, em português do Brasil, 1ª pessoa.";

  const generalRules =
    mode === "pergunta"
      ? `Formato técnico: sem hashtag, sem emoji, sem link. Até ${limits.max} caracteres.
O post deve convidar resposta real — não só descrever o dia.`
      : `Regras gerais:
- Natural, conversacional, plausível.
- Sem hashtag, sem emoji, sem link, sem CTA.
- Sem copiar frases prontas de autoajuda.
- Escolha uma situação específica (evite mercado/fila/trânsito genéricos).`;

  return `${voiceLine}

Objetivo: ${mode === "pergunta" ? 'alguém parar o feed e responder sem pensar muito — e pensar "eu escreveria exatamente isso".' : 'identificação. Quem lê pensa "isso sou eu" ou "já ouvi isso".'}

${modeBlock}

${generalRules}

Responda APENAS com JSON válido no formato exato:
{"post":"texto do post aqui"}
O valor de "post" deve ser só o texto legível — nunca meta-JSON.`;
}

function buildUser(mode: SingleContentMode, audienceHint: string): string {
  const limits = MODE_LIMITS[mode];
  if (mode === "pergunta") {
    return `Abra uma conversa no Threads agora (não faça um interrogatório).
Contexto leve (não force produto): ${audienceHint}
Até ${limits.max} caracteres.
Pense: o que faria alguém parar de rolar e responder na hora?
Fale de algo que as pessoas têm opinião, hábito, confissão, escolha, compra, arrependimento, mania ou história — não de inconveniente aleatório do dia.
Escreva como fala. Construção diferente desta vez.
Confira: eu responderia ou só rolava o feed? Se só rolava, reescreva.
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

  // Retry if empty, looks like JSON, or out of size band
  const needsRetry =
    !post ||
    post.includes('{"post"') ||
    /^\s*\{/.test(post) ||
    !lengthOk(contentMode, post);

  if (needsRetry) {
    const len = measureThreadsTextLength(post || "");
    const retryUser =
      contentMode === "pergunta"
        ? `${baseUser}

Isso não passou (${len} chars): ou não convida resposta, ou parece probleminha cotidiano sem conversa, ou soou engajamento/IA.
Reescreva do zero para ABRIR UMA CONVERSA — algo que as pessoas queiram responder (opinião, hábito, confissão, escolha, compra, mania, experiência).
Outro ângulo e outra forma de começar. Informal, 15s no celular.
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
