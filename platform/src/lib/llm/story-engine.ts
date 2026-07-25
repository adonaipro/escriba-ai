// Story Engine V2 — Context provider, not a co-writer
//
// Philosophy:
//   The engine supplies product context, narrator sex, and Threads limits.
//   The LLM invents the human situation and writes freely.
//   Quality = identification ("isso aconteceu comigo"), not plot twists.
//
// Preserved technical constraints:
//   5–6 posts, max THREADS_TEXT_MAX_CHARS per post, JSON response shape,
//   optional product URL via [LINK], sex/pronoun coherence.

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import type {
  PipelineNarratorData,
  StoryDebugData,
  StoryScore,
  VoiceToneExperiment,
  VoiceExperimentData,
  VoiceToneValue,
} from "./pipeline-types";
import { CONFLICT_BANK } from "./human-conflict-engine";
import type { HumanConflict } from "./human-conflict-engine";
import {
  findGenderVoiceViolations,
  normalizeNarratorSex,
} from "@/lib/narrators/identity-guard";
import {
  THREADS_TEXT_MAX_CHARS,
  assertThreadsPostsWithinLimit,
  findOversizedThreadsPosts,
} from "@/lib/publishing/threads-limits";
import { isInsufficientQuotaError } from "./api-error";

export type { StoryDebugData };

const PROMPT_VERSION = "story-v2.2-product-in-life";

/** Everyday seed situations — pick one by seed. Avoid cliché hubs (mercado, trânsito, chuva, fila). */
const SITUATION_BANK: string[] = [
  "mensagem no grupo da família que muda o clima da conversa",
  "vizinho no elevador que comenta algo demais",
  "amigo que marca de se ver e chega com outra pessoa sem avisar",
  "ligação de um parente em horário estranho",
  "achado de uma foto antiga no celular",
  "comentário no espelho do elevador do prédio",
  "presente inesperado deixado na porta",
  "reunião online em que alguém entra sem querer com a câmera aberta",
  "troca de roupa às pressas antes de sair",
  "espera na sala de espera de consultório",
  "conversa no sofá depois que as crianças dormem",
  "barulho no apartamento de cima em horário absurdo",
  "mensagem vista e não respondida por dias",
  "encomenda que chega no nome de outra pessoa",
  "convite de última hora para um compromisso social",
  "achado de roupa que não é sua na lavanderia",
  "silêncio estranho no jantar com a família",
  "amigo pedindo dinheiro 'só desta vez'",
  "descoberta de um hábito secreto de alguém da casa",
  "mudança de móvel que ninguém combinou",
  "visita que se estende além do confortável",
  "comentário de um colega sobre sua aparência",
  "plano cancelado por mensagem seca",
  "arquivo antigo no computador que reabre um assunto",
  "criança repetindo em voz alta algo que ouviu em casa",
  "reviravolta num grupo de WhatsApp do condomínio",
  "pessoa que sempre atrasa e hoje chegou cedo",
  "roupa emprestada que volta diferente",
  "bilhete deixado na geladeira",
  "alguém usando seu carregador sem pedir",
  "foto em que você aparece e não sabia que tiraram",
  "pedido de desculpas que chega tarde demais",
  "conversa com o porteiro que revela boato do prédio",
  "plano de viagem cancelado por um dos dois",
  "objeto que some de casa e reaparece em lugar estranho",
  "comentário de uma sogra sobre como você 'costuma ser'",
  "amigo que conta um segredo e pede para não espalhar",
  "notificação de rede social de alguém que você evitaria",
  "mudança de horário de sono de quem mora junto",
  "presente de aniversário que veio com cartão genérico",
  "pessoa que pergunta 'tudo bem?' e não espera a resposta",
  "arrumação de uma gaveta que reabre uma memória",
  "barulho de discussão nos vizinhos que entra pela janela",
  "mensagem de voz longa demais para ouvir na hora",
  "troca de senha da TV/streaming sem avisar",
  "alguém sentado no 'seu' lugar de sempre",
  "lembrete de consulta médica que você tinha esquecido",
  "roupa que não fecha mais e ninguém comenta",
  "pedido para 'só segurar um minuto' que vira uma hora",
  "silêncio no carro depois de uma frase mal colocada",
  "achado de um ingresso/recibo antigo no fundo da bolsa ou casaco",
  "pessoa que te chama pelo nome do meio só quando está brava",
  "plano de almoço que vira cobrança emocional",
  "amigo que some do grupo e volta como se nada tivesse acontecido",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoryPost {
  position: number;
  content: string;
}

interface MinimalConflictSelection {
  character: string;
  openingMoment: string;
  conflictId: string;
  reasoning: string;
  productLocation: string;
  validCast: string[];
  incident: string;
  incidentReason: string;
  gossipHook: string;
  protagonist: string;
  environment: string;
  beforeContext: string;
  trigger: string;
  firstWords: string;
  reactionAndSequence: string;
  emotionalClimate: string;
  concreteDetails: string[];
  productNaturalContext: string;
  productMoment: string;
}

export interface StoryResult {
  posts: StoryPost[];
  conflictSelection: MinimalConflictSelection;
  conflict: HumanConflict;
  score: StoryScore;
  debug: StoryDebugData;
}

// ─── HTTP utilities ───────────────────────────────────────────────────────────

function resolveBaseUrl(config: LlmProviderConfig): string {
  if (config.baseUrl) return config.baseUrl.replace(/\/$/, "");
  switch (config.provider) {
    case "openai":
      return "https://api.openai.com/v1";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "anthropic":
      return "https://api.anthropic.com/v1";
    default:
      return "https://api.groq.com/openai/v1";
  }
}

function resolveDefaultModel(config: LlmProviderConfig): string {
  switch (config.provider) {
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-haiku-4-5-20251001";
    default:
      return "llama-3.3-70b-versatile";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(body: string): number | null {
  const minsec = body.match(/try again in (\d+)m(\d+(?:\.\d+)?)s/i);
  if (minsec) return (parseInt(minsec[1]!) * 60 + parseFloat(minsec[2]!)) * 1000 + 2000;
  const sec = body.match(/try again in (\d+(?:\.\d+)?)s/i);
  if (sec) return Math.ceil(parseFloat(sec[1]!)) * 1000 + 2000;
  return null;
}

function extractJson<T>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  const raw = fenceMatch ? fenceMatch[1]! : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Nenhum JSON encontrado na resposta.");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  config: LlmProviderConfig,
  maxTokens: number,
  ctx: { callCount: number; totalTokens: number },
  label: string,
  retryNum = 0,
  apiSeed?: number,
): Promise<string> {
  ctx.callCount++;
  const baseUrl = resolveBaseUrl(config);
  const model = config.model ?? resolveDefaultModel(config);
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
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 1.0,
      max_tokens: maxTokens,
      ...(apiSeed !== undefined && supportsSeed ? { seed: apiSeed } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();

    if ((res.status === 429 || res.status === 400) && isInsufficientQuotaError(errText)) {
      throw new Error(
        "Créditos OpenAI esgotados. Acesse platform.openai.com/billing para adicionar créditos.",
      );
    }

    if (res.status === 429 && errText.toLowerCase().includes("tokens per day")) {
      const m = errText.match(/try again in ([^"}\]]+)/i);
      const when = m ? m[1]!.trim() : "algumas horas";
      throw new Error(`Limite diário do Groq atingido. Tente em ${when}. (${label})`);
    }

    if (res.status === 429 && retryNum < 3) {
      const waitMs = parseRetryAfterMs(errText) ?? 22_000;
      if (waitMs > 180_000) {
        throw new Error(
          `Rate limit longo demais. Tente em ${Math.ceil(waitMs / 60000)} min. (${label})`,
        );
      }
      await sleep(Math.min(waitMs, 120_000));
      return callLLM(systemPrompt, userPrompt, config, maxTokens, ctx, label, retryNum + 1, apiSeed);
    }

    if (res.status === 429) {
      throw new Error(
        `Limite momentâneo de requisições/tokens da ${config.provider === "openai" ? "OpenAI" : config.provider}. Aguarde um minuto e tente novamente. (${label})`,
      );
    }

    throw new Error(`Story Engine API ${res.status}: ${errText.slice(0, 200)} (${label})`);
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };
  ctx.totalTokens += json.usage?.total_tokens ?? 0;
  return json.choices[0]?.message?.content ?? "";
}

// ─── Scoring (local, non-prescriptive) ───────────────────────────────────────

function scoreStory(posts: StoryPost[], productUrl: string): StoryScore {
  const allText = posts.map((p) => p.content).join("\n\n");
  const issues: string[] = [];

  const AI_CLICHES = [
    "aprendi que",
    "entendi que",
    "percebi que",
    "tudo fez sentido",
    "nunca mais foi o mesmo",
    "aquilo me ensinou",
    "foi quando entendi",
    "e então percebi",
    "isso me fez refletir",
    "no final das contas",
  ];
  const found = AI_CLICHES.filter((c) => allText.toLowerCase().includes(c));
  const humanness = Math.max(0, 25 - found.length * 5);
  if (found.length > 0) issues.push(`Clichês de IA: ${found.join(", ")}`);

  const hasDialogue =
    allText.includes("—") || /[""]/.test(allText) || allText.includes('"') || allText.includes("Eu:");
  const hasSubstance = posts.length >= 2 && allText.length > 200;
  const conflictClarity = (hasDialogue ? 13 : 6) + (hasSubstance ? 12 : 5);
  if (!hasDialogue) issues.push("Nenhum diálogo ou fala direta detectado");

  const safeUrl = productUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const urlCount = productUrl
    ? (allText.match(new RegExp(safeUrl, "g")) ?? []).length
    : 0;
  let productNaturalness: number;
  if (!productUrl) {
    productNaturalness = 25;
  } else if (urlCount === 0) {
    productNaturalness = 0;
    issues.push("URL do produto não aparece na história");
  } else if ((posts[0]?.content ?? "").includes(productUrl)) {
    productNaturalness = 10;
    issues.push("Produto aparece no primeiro post (muito cedo)");
  } else if (urlCount === 1) {
    productNaturalness = 25;
  } else {
    productNaturalness = 12;
    issues.push("URL do produto aparece mais de uma vez");
  }

  const lastContent = posts[posts.length - 1]?.content ?? "";
  const hasQuestion = lastContent.includes("?");
  const discussionPotential = hasQuestion ? 25 : 15;

  const total = humanness + conflictClarity + productNaturalness + discussionPotential;
  return { humanness, conflictClarity, productNaturalness, discussionPotential, total, issues };
}

// ─── Product link resolution ──────────────────────────────────────────────────

function resolveProductLink(posts: StoryPost[], productUrl: string, seed: number): StoryPost[] {
  if (!productUrl) return posts;
  if (posts.some((p) => p.content.includes(productUrl))) return posts;

  if (posts.some((p) => p.content.includes("[LINK]"))) {
    return posts.map((p) => ({
      ...p,
      content: p.content.replace(/\[LINK\]/g, productUrl),
    }));
  }

  // Soft fallback: append URL to the last post only — never invent a narrative recipe
  // (no "alguém trouxe / deixou / comprou" templates that the model would learn from).
  void seed;
  if (posts.length === 0) return [{ position: 1, content: productUrl }];
  const last = posts[posts.length - 1]!;
  return [
    ...posts.slice(0, -1),
    {
      ...last,
      content: `${last.content.trim()}\n${productUrl}`,
    },
  ];
}

// ─── Prompt builders (V2) ─────────────────────────────────────────────────────

function stripUrls(s: string): string {
  return s.replace(/https?:\/\/[^\s,)]+/g, "").trim();
}

/**
 * Minimal product facts for accuracy only — never story drivers.
 * Pains / benefits / occasions are intentionally omitted: they induce product-themed plots.
 */
function buildProductContext(universe: ProductUniverse, productName: string): string {
  const parts: string[] = [];
  if (productName) parts.push(`Nome factual: ${stripUrls(productName)}`);
  if (universe.categoryLabel) parts.push(`Tipo de item (fato): ${stripUrls(universe.categoryLabel)}`);
  if (universe.restrictions?.length) {
    const bans = universe.restrictions
      .slice(0, 5)
      .map(stripUrls)
      .filter(Boolean);
    if (bans.length) {
      parts.push(`Não afirme sobre este item: ${bans.join("; ")}`);
    }
  }
  return parts.join("\n") || `Nome factual: ${stripUrls(productName)}`;
}

function sexPromptLine(sex: string): string {
  const n = normalizeNarratorSex(sex);
  if (n === "male") {
    return `Sexo da pessoa que narra: masculino.
Mantenha coerência de pronomes e relacionamentos na 1ª pessoa (voz masculina).
Parceiros românticos da pessoa narradora, se existirem na história, são mulheres (namorada, esposa, ex-namorada) — não use marido/namorado para si.`;
  }
  return `Sexo da pessoa que narra: feminino.
Mantenha coerência de pronomes e relacionamentos na 1ª pessoa (voz feminina).
Parceiros românticos da pessoa narradora, se existirem na história, são homens (namorado, marido, ex-namorado) — não use esposa/namorada para si.`;
}

function buildSystemPrompt(): string {
  return `Você escreve relatos em primeira pessoa para o Threads, como se estivesse contando algo real para amigos.

Objetivo único: identificação.
No final da leitura, a pessoa deve pensar: "isso aconteceu comigo", "conheço alguém assim", "já passei por isso".

Ordem mental obrigatória (não inverta):
1) Escolha e desenvolva UMA situação humana cotidiana (o user já aponta um ponto de partida — use-o ou desdobre algo igualmente específico e diferente).
   A história é sobre pessoas, tensão, escolha, constrangimento, alívio, rotina, relação.
2) Dentro dessa situação já viva, o item da vida real (se houver) participa da experiência do personagem:
   a personagem usa, manuseia, se apoia nele, ou o momento muda um pouco porque o item está ali.
   O item NÃO é o tema, NÃO é propaganda, e NÃO é só uma citação decorativa.

Produto na história (quando houver item):
- bom: o item entra no gesto, no deslocamento, no preparo, na espera, no encontro — altera ou facilita um instante da cena
- ruim: "peguei minha bolsa" / "olhei o produto" / menção solta sem função na cena
- proibido: descobrir o produto, mudar de vida por causa dele, lição de compra, review disfarçado

Diversidade (obrigatório):
- NÃO recicle o mesmo ambiente/contexto da história anterior
- EVITE cenários batidos e genéricos: mercado, supermercado, fila, trânsito, chuva na rua, "indo pro trabalho" genérico — a menos que o ponto de partida peça explicitamente outra coisa e ainda assim torne único
- prefira ângulos específicos e concretos (um detalhe que só aquela cena teria)

Como escrever:
- natural, cotidiana, espontânea, conversacional, plausível
- pequenos detalhes concretos da vida real
- emoção sem exagero
- sem dramatização forçada, sem plot twist artificial, sem frases de IA
- se a thread terminar em pergunta: a pergunta nasce do que foi vivido (curiosidade/identificação), nunca formulário do tipo "Você já…?" ou "Qual foi a última vez…?"

Formato técnico (obrigatório):
- escreva 5 a 6 posts em sequência (uma thread)
- CADA post com no máximo ${THREADS_TEXT_MAX_CHARS} caracteres (limite do Threads), contando espaços e links
- responda APENAS com JSON válido no formato:
{"posts":[{"position":1,"content":"..."},{"position":2,"content":"..."}]}`;
}

function pickSituationSeed(seed: number): string {
  const idx = Math.abs(seed) % SITUATION_BANK.length;
  return SITUATION_BANK[idx]!;
}

function buildUserPrompt(opts: {
  productContext: string;
  productUrl: string;
  withLink: boolean;
  sex: string;
  customTheme?: string;
  seed: number;
  avoidContexts?: string[];
}): string {
  const sexBlock = sexPromptLine(opts.sex);
  const situation = pickSituationSeed(opts.seed);

  const productBlock = opts.withLink
    ? `Item que participa da experiência (não é o tema da história):
${opts.productContext}

Regras do item:
1) Invente a situação humana primeiro.
2) O item entra naturalmente na vivência do personagem: uso, gesto, preparo, deslocamento, espera, encontro.
3) A presença do item deve alterar ou facilitar algum momento da cena (mesmo que de leve) — não basta citar.
4) Proibido: propaganda, review, "comprei e mudou minha vida", menção solta sem função ("peguei X").
5) Use o marcador [LINK] exatamente com esses 6 caracteres no lugar da URL (não invente domínio).
6) Se nomear, use o nome factual; sem benefícios milagrosos.`
    : `Nesta história não use link de produto nem menção comercial.
Foque só no relato humano identificável.`;

  const avoidBlock =
    opts.avoidContexts && opts.avoidContexts.length > 0
      ? `\nPENALIZAÇÃO FORTE — NÃO repita estes contextos/ambientes já usados nesta geração (mude cenário, relação e ângulo por completo):\n${opts.avoidContexts
          .map((c, i) => `${i + 1}. ${c}`)
          .join("\n")}`
      : "";

  const freeNote = opts.customTheme?.trim()
    ? `\nPedido livre do usuário (opcional; não substitui a situação humana): ${opts.customTheme.trim()}`
    : "";

  return `${sexBlock}

Ponto de partida (obrigatório usar como base ou desdobrar em algo igualmente específico; não troque por mercado/trânsito/fila genéricos):
→ ${situation}
${avoidBlock}

${productBlock}
${freeNote}

Gere a thread: situação humana viva; item como participante natural da experiência (quando houver), nunca citação artificial.`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runStoryEngine(
  universe: ProductUniverse,
  productName: string,
  productUrl: string,
  narrator: PipelineNarratorData,
  seed: number,
  config: LlmProviderConfig,
  withLink = true,
  voiceExperiment?: VoiceToneExperiment,
  /** @deprecated V2 ignores forced incidents — kept for call-site compatibility */
  _incidentSeed?: string,
  customTheme?: string,
  avoidContexts?: string[],
): Promise<StoryResult> {
  const start = Date.now();
  const model = config.model ?? resolveDefaultModel(config);
  const ctx = { callCount: 0, totalTokens: 0 };
  const seedSentToApi = config.provider !== "anthropic";

  const system = buildSystemPrompt();
  const productContext = buildProductContext(universe, productName);
  const user = buildUserPrompt({
    productContext,
    productUrl: withLink ? productUrl : "",
    withLink,
    sex: narrator.sex,
    customTheme,
    seed,
    avoidContexts,
  });

  const text = await callLLM(system, user, config, 1800, ctx, "geração", 0, seed);

  let rawPosts: StoryPost[];
  try {
    const parsed = extractJson<{ posts: StoryPost[] }>(text);
    rawPosts = (parsed.posts ?? []).filter((p) => p.content?.trim());
    if (rawPosts.length === 0) throw new Error("Nenhum post gerado.");
    rawPosts = rawPosts.slice(0, 6);
  } catch {
    throw new Error(`Falha ao parsear posts: ${text.slice(0, 200)}`);
  }

  // Sex / pronoun coherence only (V2 narrator = male | female)
  const genderViolations = findGenderVoiceViolations(
    rawPosts.map((post) => post.content).join("\n"),
    narrator,
  );
  if (genderViolations.length > 0) {
    const retryUser = `${user}

A resposta anterior quebrou a coerência de sexo/pronomes: ${genderViolations.join("; ")}.
Reescreva a história mantendo a mesma liberdade criativa, corrigindo apenas pronomes e relacionamentos da 1ª pessoa.`;
    const retryText = await callLLM(system, retryUser, config, 1800, ctx, "retry-sexo", 0, seed);
    const retryParsed = extractJson<{ posts: StoryPost[] }>(retryText);
    const retryPosts = (retryParsed.posts ?? []).filter((post) => post.content?.trim()).slice(0, 6);
    const retryViolations = findGenderVoiceViolations(
      retryPosts.map((post) => post.content).join("\n"),
      narrator,
    );
    if (retryPosts.length === 0 || retryViolations.length > 0) {
      throw new Error(
        `A narrativa contradiz o sexo do narrador: ${(retryViolations.length ? retryViolations : genderViolations).join("; ")}`,
      );
    }
    rawPosts = retryPosts;
  }

  let posts = withLink ? resolveProductLink(rawPosts, productUrl, seed) : rawPosts;

  // Threads hard limit — one rewrite, then hard-fail
  let oversized = findOversizedThreadsPosts(posts);
  if (oversized.length > 0) {
    const detail = oversized.map((p) => `post ${p.position}: ${p.length} caracteres`).join("; ");
    const lengthRetryUser = `${user}

A resposta anterior excedeu o limite de ${THREADS_TEXT_MAX_CHARS} caracteres por post (${detail}).
Reescreva a MESMA história com o mesmo tom, mas CADA post com no máximo ${THREADS_TEXT_MAX_CHARS} caracteres (incluindo link se houver).
Mantenha 5 a 6 posts.`;
    try {
      const retryText = await callLLM(system, lengthRetryUser, config, 1800, ctx, "retry-length", 0, seed);
      const retryParsed = extractJson<{ posts: StoryPost[] }>(retryText);
      const retryPosts = (retryParsed.posts ?? []).filter((p) => p.content?.trim()).slice(0, 6);
      if (retryPosts.length > 0) {
        rawPosts = retryPosts;
        posts = withLink ? resolveProductLink(rawPosts, productUrl, seed) : rawPosts;
      }
    } catch {
      // fall through
    }
    oversized = findOversizedThreadsPosts(posts);
    if (oversized.length > 0) {
      assertThreadsPostsWithinLimit(posts);
    }
  }

  const score = scoreStory(posts, productUrl);
  const firstPostContent = posts[0]?.content ?? "";
  const conflictStub = CONFLICT_BANK[seed % CONFLICT_BANK.length]!;

  const toneValue: VoiceToneValue = voiceExperiment?.value ?? "control";
  const voiceExperimentDebug: VoiceExperimentData | undefined = voiceExperiment
    ? {
        mode: "exploration",
        dimension: "tone",
        value: toneValue,
        selected: true,
        applied: false,
        hintText: null,
        ragExampleIndices: [],
        seed,
        seedSentToApi,
        promptVersion: PROMPT_VERSION,
      }
    : undefined;

  const debug: StoryDebugData = {
    kind: "story",
    withLink,
    examplesUsed: 0,
    posts,
    score,
    callCount: ctx.callCount,
    totalTokens: ctx.totalTokens,
    durationMs: Date.now() - start,
    provider: config.provider,
    model,
    voiceExperiment: voiceExperimentDebug,
  };

  return {
    posts,
    conflictSelection: {
      character: "",
      openingMoment: firstPostContent.split("\n")[0] ?? "",
      conflictId: conflictStub.id,
      reasoning: "story-v2-free",
      productLocation: "",
      validCast: [],
      incident: "",
      incidentReason: "",
      gossipHook: firstPostContent.split("\n")[0] ?? "",
      protagonist: "",
      environment: "",
      beforeContext: "",
      trigger: "",
      firstWords: "",
      reactionAndSequence: "",
      emotionalClimate: "",
      concreteDetails: [],
      productNaturalContext: "",
      productMoment: "",
    },
    conflict: conflictStub,
    score,
    debug,
  };
}
