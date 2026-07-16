// Story Engine — RAG Architecture
//
// Intelligence comes from examples, not rules.
// Product info + story examples → single LLM call → story.
//
// No stages. No scene builder. No conflict bank. No banned phrase lists.
// The model learns style from examples. We provide context, not control.

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import type { PipelineNarratorData, StoryDebugData, StoryScore, VoiceToneExperiment, VoiceExperimentData, VoiceToneValue } from "./pipeline-types";
import { CONFLICT_BANK } from "./human-conflict-engine";
import type { HumanConflict } from "./human-conflict-engine";

// ─── Voice Experiment V0 ──────────────────────────────────────────────────────
// Feature flag — set false to revert instantly to pre-experiment behavior
const VOICE_EXPERIMENT_ENABLED = true;

const TONE_HINTS: Record<string, string> = {
  leve:      "Voz nesta geração: leve.",
  direta:    "Voz nesta geração: direta.",
  emocional: "Voz nesta geração: mais emocional.",
};

export type { StoryDebugData };

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoryPost {
  position: number;
  content: string;
}

// Minimal conflict stub — used by narrative-engine.ts for display fields only
interface MinimalConflictSelection {
  character: string;
  openingMoment: string;
  // Legacy fields required by narrative-engine.ts signature
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

// ─── RAG Examples ─────────────────────────────────────────────────────────────
//
// 8 high-quality example threads demonstrating the target style.
// Model learns rhythm, naturalness, dialogue proportion, link placement.
// These teach by example — no rules needed.

// Real competitor stories — transcribed from public Threads posts.
// URLs replaced with [LINK] placeholder.
// These teach style, rhythm, and product placement by example.
const STORY_EXAMPLES = [
  `Post 1:
Descobri que minha melhor amiga ficou com meu namorado quando vi uma foto deles juntos no Instagram. Deletei o app. Abri de novo. Ainda estava lá. Fui até o apartamento dela sem avisar.

Post 2:
Ela abriu a porta e já sabia que eu sabia. Perguntei direto: "O que foi aquilo?" Ela ficou me olhando. Depois disse: "A gente vai conversar?" Eu disse: "Não. Eu só vim buscar minhas coisas." Peguei a sacola e fui embora. Ela ficou falando no corredor.

Post 3:
Meu namorado me ligou catorze vezes. Atendi na décima quinta. Ele disse que ia explicar. Eu disse: "Não precisa." Desliguei. Fui pra casa da minha mãe e fiquei lá por três dias sem falar com ninguém.

Post 4:
No quarto dia minha prima veio me ver. Ficamos conversando até tarde. Antes de ir ela deixou isso aqui [LINK] em cima da mesa: "Comprei pensando em você. Abre quando estiver sozinha." Abri depois que ela foi. Você confrontaria os dois juntos ou separado?`,

  `Post 1:
Minha sogra ligou pro meu chefe e disse que eu era instável emocionalmente. Fiquei sabendo dois anos depois, quando minha cunhada me mostrou o print de uma conversa onde ela admitia pra uma amiga o que tinha feito.

Post 2:
Fui direto até a casa dela. Meu marido foi junto sem saber o que ia acontecer. Cheguei, coloquei o celular na mesa com o print aberto e falei: "Você quer explicar isso?" Ela ficou vermelha. Meu marido leu. Ficou em silêncio. Ela tentou falar. Ele ergueu a mão: "Não agora."

Post 3:
No carro de volta pra casa, meu marido ficou vinte minutos sem dizer nada. Depois falou: "Eu não sabia." Eu disse: "Eu sei." Ficamos em silêncio o resto do caminho. Aquela noite foi a mais estranha que a gente já teve juntos.

Post 4:
Uma semana depois minha irmã veio me visitar. Ficou me ajudando a organizar a cozinha — ela sempre faz isso quando algo vai mal. Antes de ir me mostrou isso aqui [LINK]: "Vi e pensei em você. Comprei pra te animar." Vocês perdoariam ou cortariam de vez?`,

  `Post 1:
Meu cunhado tentou me beijar na cozinha durante o aniversário do meu marido. Eu tinha ido buscar uma bebida. Ele apareceu do nada e falou: "Sempre gostei de você." Congelei. Voltei pra sala e fiquei sorrindo pro meu marido pelo resto da noite como se nada tivesse acontecido.

Post 2:
Em casa, contei tudo. Meu marido ouviu sem interromper. Quando terminei ele ficou quieto uns dois minutos. Então falou: "Você pode ter entendido diferente." Olhei pra ele. "Diferente como?" Ele se levantou e foi pro quarto.

Post 3:
Dormi no sofá. De madrugada meu marido veio me buscar. Disse que tinha processado e que ia falar com o irmão. Na manhã seguinte ele fez isso. Não sei o que foi dito. Meu cunhado me mandou mensagem pedindo desculpa. Não respondi.

Post 4:
Minha amiga ligou pra saber como eu estava. No final falou que ia passar em casa. Chegou com isso aqui [LINK]: "Vi e lembrei de você. Sem motivo nenhum." Ainda bem que tem gente assim. Eu fui ingênua em contar pro meu marido ou fiz certo?`,

  `Post 1:
Minha vizinha espalhou pelo prédio que eu estava tendo um caso com o marido dela. Soube porque minha outra vizinha veio até mim com pena. Bati na porta dela no mesmo dia.

Post 2:
Ela abriu e ficou me olhando. Perguntei: "Você foi falar isso de mim pro prédio?" Negou. Eu disse: "A moradora do 502 me contou palavra por palavra." Ela cruzou os braços: "Cada um entende do jeito que quer." Fechei a cara: "Isso não vai ficar assim."

Post 3:
Fui até o síndico, abri reclamação formal e mandei áudio no grupo do prédio contando o que estava acontecendo. Ela respondeu me chamando de dramática. Cinco pessoas me mandaram mensagem em particular dizendo que ela já tinha feito isso com outras moradoras.

Post 4:
A vizinha do 502 voltou no dia seguinte com um café. Antes de ir tirou isso aqui [LINK] da bolsa: "Vi numa loja e trouxe pra você. Você merecia um gesto bom essa semana." Às vezes a pessoa certa aparece na hora exata. Você teria ficado quieta ou feito igual a mim?`,

  `Post 1:
Minha irmã contou pro meu pai que eu tinha terminado meu casamento por causa de outro homem. Não era verdade. E mesmo se fosse, não era pra ela contar. Meu pai me ligou em dez minutos.

Post 2:
Liguei pra ela perguntando por que tinha feito isso. Ela disse: "Tô preocupada com você." Eu disse: "Preocupada você me liga. Não vai falar pro meu pai inventando história." Ela ficou em silêncio. Depois falou: "Eu não inventei tudo." Como se isso fosse melhor.

Post 3:
Fui até a casa dos meus pais naquele fim de semana só pra explicar tudo pessoalmente. Meu pai me ouviu. No final disse: "Eu devia ter perguntado pra você primeiro." Minha irmã não apareceu. Ainda bem.

Post 4:
Minha mãe veio me ver no apartamento dias depois. Não falou nada sobre a situação com minha irmã. Só entrou, olhou em volta e colocou isso aqui [LINK] em cima da bancada: "Vi e achei que ia combinar com você." Mãe sabe a hora certa de não falar nada. Você perdoava num mês ou precisava de mais tempo?`,

  `Post 1:
Minha amiga me indicou pra uma vaga e ficou me ajudando a preparar. Currículo, simulação de entrevista, feedback. Quando me chamaram ela disse que estava feliz por mim. Fiquei sabendo depois que ela mesma tinha ligado pra empresa falando mal de mim antes da entrevista.

Post 2:
Chamei ela pra tomar café. Sentei. Pedi o café. Esperei ela se acomodar. Então coloquei o celular na mesa com a mensagem aberta: "Você quer me explicar isso?" Ela ficou branca. Disse que foi mal entendido. Eu disse: "Não precisa. Eu só vim pra você saber que eu sei."

Post 3:
Paguei o meu café e fui embora. Ela ficou me ligando o dia inteiro. Não atendi. Uma semana depois ainda estava ligando. Em algum momento parei de sentir que precisava responder.

Post 4:
Minha colega do trabalho passou em casa na sexta. Ficamos conversando, ela trouxe pizza. Na hora de ir colocou isso aqui [LINK] na mesa: "Vi essa semana e comprei pra você. Não precisava de motivo." Às vezes a gente precisa de uma coisa boa depois de uma semana dessas. Você teria dado uma chance de explicação ou teria ido embora do café igual eu?`,

  `Post 1:
Meu ex publicou prints das minhas mensagens privadas num grupo com cinquenta pessoas. Mensagens de dois anos atrás, quando a gente ainda estava junto. Fiquei sabendo de manhã quando minha prima me encaminhou uma das capturas.

Post 2:
Liguei pra ele. Atendeu na segunda chamada. Perguntei: "Por que você fez isso?" Ele disse: "Você me deixou mal." Eu disse: "E você acha que isso resolve alguma coisa?" Ele ficou em silêncio. Desliguei.

Post 3:
Passei o dia todo respondendo mensagens de pessoas que tinham visto. Algumas com pena. Algumas com curiosidade. Uma perguntou se era verdade o que estava escrito. Respondi que não era assunto dela e bloqueei. À noite estava exausta e com raiva ao mesmo tempo.

Post 4:
Minha prima me buscou à noite. A gente saiu pra caminhar sem destino. Numa loja ela pegou isso aqui [LINK] e colocou na minha mão: "Compra. Você merece uma coisa boa hoje." Comprei. Você bloqueava ou enfrentava direto?`,
];

// ─── HTTP utilities ───────────────────────────────────────────────────────────

function resolveBaseUrl(config: LlmProviderConfig): string {
  if (config.baseUrl) return config.baseUrl.replace(/\/$/, "");
  switch (config.provider) {
    case "openai":     return "https://api.openai.com/v1";
    case "openrouter": return "https://openrouter.ai/api/v1";
    case "anthropic":  return "https://api.anthropic.com/v1";
    default:           return "https://api.groq.com/openai/v1";
  }
}

function resolveDefaultModel(config: LlmProviderConfig): string {
  switch (config.provider) {
    case "openai":    return "gpt-4o-mini";
    case "anthropic": return "claude-haiku-4-5-20251001";
    default:          return "llama-3.3-70b-versatile";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRetryAfterMs(body: string): number | null {
  const minsec = body.match(/try again in (\d+)m(\d+(?:\.\d+)?)s/i);
  if (minsec) return (parseInt(minsec[1]) * 60 + parseFloat(minsec[2])) * 1000 + 2000;
  const sec = body.match(/try again in (\d+(?:\.\d+)?)s/i);
  if (sec) return Math.ceil(parseFloat(sec[1])) * 1000 + 2000;
  return null;
}

function extractJson<T>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  const raw = fenceMatch ? fenceMatch[1] : text;
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
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.95,
      max_tokens: maxTokens,
      ...(apiSeed !== undefined && supportsSeed ? { seed: apiSeed } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();

    if (
      res.status === 429 &&
      (errText.includes("insufficient_quota") ||
        errText.includes("exceeded your current quota") ||
        errText.includes("billing"))
    ) {
      throw new Error(
        "Créditos OpenAI esgotados. Acesse platform.openai.com/billing para adicionar créditos."
      );
    }

    if (res.status === 429 && errText.toLowerCase().includes("tokens per day")) {
      const m = errText.match(/try again in ([^"}\]]+)/i);
      const when = m ? m[1].trim() : "algumas horas";
      throw new Error(`Limite diário do Groq atingido. Tente em ${when}. (${label})`);
    }

    if (res.status === 429 && retryNum < 3) {
      const waitMs = parseRetryAfterMs(errText) ?? 22_000;
      if (waitMs > 180_000) {
        throw new Error(
          `Rate limit longo demais. Tente em ${Math.ceil(waitMs / 60000)} min. (${label})`
        );
      }
      await sleep(Math.min(waitMs, 120_000));
      return callLLM(systemPrompt, userPrompt, config, maxTokens, ctx, label, retryNum + 1, apiSeed);
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

// ─── Example selection ────────────────────────────────────────────────────────

function pickExamples(seed: number, count: number): { examples: string[]; indices: number[] } {
  const indexed = STORY_EXAMPLES.map((ex, i) => ({ ex, i }));
  let s = seed >>> 0;
  for (let i = indexed.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223;
    const j = (s >>> 0) % (i + 1);
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  const chosen = indexed.slice(0, count);
  return { examples: chosen.map(c => c.ex), indices: chosen.map(c => c.i) };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreStory(posts: StoryPost[], productUrl: string): StoryScore {
  const allText = posts.map(p => p.content).join("\n\n");
  const issues: string[] = [];

  const AI_CLICHES = [
    "aprendi que", "entendi que", "percebi que", "tudo fez sentido",
    "nunca mais foi o mesmo", "aquilo me ensinou", "foi quando entendi",
    "e então percebi", "isso me fez refletir", "no final das contas",
  ];
  const found = AI_CLICHES.filter(c => allText.toLowerCase().includes(c));
  const humanness = Math.max(0, 25 - found.length * 5);
  if (found.length > 0) issues.push(`Clichês de IA: ${found.join(", ")}`);

  const hasDialogue =
    allText.includes("—") || /[""]/.test(allText) || allText.includes('"') || allText.includes("Eu:");
  const hasSubstance = posts.length >= 2 && allText.length > 200;
  const conflictClarity = (hasDialogue ? 13 : 6) + (hasSubstance ? 12 : 5);
  if (!hasDialogue) issues.push("Nenhum diálogo ou fala direta detectado");

  const safeUrl = productUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const urlCount = (allText.match(new RegExp(safeUrl, "g")) ?? []).length;
  const inFirstPost = (posts[0]?.content ?? "").includes(productUrl);
  let productNaturalness: number;
  if (urlCount === 0) {
    productNaturalness = 0;
    issues.push("URL do produto não aparece na história");
  } else if (inFirstPost) {
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
  const hasCall = ["vocês", "alguém mais", "é só eu", "você também", "me conta"].some(p =>
    lastContent.toLowerCase().includes(p)
  );
  const discussionPotential = (hasQuestion ? 15 : 8) + (hasCall ? 10 : 5);

  const total = humanness + conflictClarity + productNaturalness + discussionPotential;
  return { humanness, conflictClarity, productNaturalness, discussionPotential, total, issues };
}

// ─── Product link resolution ──────────────────────────────────────────────────

function resolveProductLink(posts: StoryPost[], productUrl: string, seed: number): StoryPost[] {
  if (!productUrl) return posts;
  if (posts.some(p => p.content.includes(productUrl))) return posts;

  // Replace [LINK] placeholder embedded in a story post
  if (posts.some(p => p.content.includes("[LINK]"))) {
    return posts.map(p => ({
      ...p,
      content: p.content.replace(/\[LINK\]/g, productUrl),
    }));
  }

  // Fallback: insert character-action template before the last post
  const fallbacks = [
    `Dias depois encontrei isso aqui:\n${productUrl}\nE lembrei na hora do que tinha acontecido.`,
    `Ela voltou com isso:\n${productUrl}\nSem dizer nada. Só deixou em cima da mesa.`,
    `Resolvi comprar isso aqui:\n${productUrl}\nPelo menos era uma decisão minha.`,
    `Quando vi isso:\n${productUrl}\nNão precisei nem pensar. Lembrei na hora.`,
    `Ela me mandou isso aqui:\n${productUrl}\nSem texto. Sem explicação.`,
  ];

  const content = fallbacks[seed % fallbacks.length];
  const maxPos = posts.reduce((m, p) => Math.max(m, p.position), 0);

  if (posts.length >= 2) {
    const lastPost = posts[posts.length - 1];
    const rest = posts.slice(0, -1);
    return [
      ...rest,
      { position: maxPos, content },
      { ...lastPost, position: maxPos + 1 },
    ];
  }

  return [...posts, { position: maxPos + 1, content }];
}

// ─── Incident validation ─────────────────────────────────────────────────────
// Did the Writer use the incident as the central event?
// Extracts person + content words from the incident and checks presence in output.

function validateIncidentFollowed(posts: StoryPost[], incident: string): boolean {
  const storyText = posts.map(p => p.content).join(" ").toLowerCase();
  const incidentLower = incident.toLowerCase();

  const RELATIONS = [
    "minha mãe", "meu pai", "minha irmã", "meu irmão", "minha amiga",
    "meu amigo", "minha colega", "meu colega", "minha vizinha", "meu vizinho",
    "minha prima", "meu primo", "minha sogra", "meu sogro", "meu ex", "minha ex",
    "meu namorado", "minha namorada", "meu marido", "minha filha", "meu filho",
    "minha cunhada", "meu cunhado",
  ];

  const STOPWORDS = new Set([
    "estava", "tinha", "para", "pelo", "pela", "sobre", "como", "quando",
    "muito", "mais", "também", "depois", "antes", "ainda", "desde", "então",
  ]);

  const relationWords = RELATIONS
    .filter(r => incidentLower.includes(r))
    .flatMap(r => r.split(" ").filter(w => w.length > 2));
  const personPresent = relationWords.some(w => storyText.includes(w));

  const contentWords = incidentLower
    .split(/\s+/)
    .filter(w => w.length > 4 && !STOPWORDS.has(w));
  const contentPresent = contentWords.some(w => storyText.includes(w));

  return personPresent && contentPresent;
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
  incidentSeed?: string,
): Promise<StoryResult> {
  const start = Date.now();
  const model = config.model ?? resolveDefaultModel(config);
  const ctx = { callCount: 0, totalTokens: 0 };

  // Pick 3 varied examples by seed — also track which indices were chosen
  const { examples, indices: ragExampleIndices } = pickExamples(seed, 3);

  // Voice Experiment V0 — resolve hint text (or null for control/disabled)
  const toneValue: VoiceToneValue = voiceExperiment?.value ?? "control";
  const experimentActive = VOICE_EXPERIMENT_ENABLED && !!voiceExperiment && toneValue !== "control";
  const hintText = experimentActive ? (TONE_HINTS[toneValue] ?? null) : null;
  const seedSentToApi = config.provider !== "anthropic";

  const system = `Escreva como alguém mandando uma sequência de mensagens para um amigo contando o que aconteceu.

Estas histórias são sobre fofoca: traição, mentira, humilhação, sabotagem. Alguém próximo fez algo grave contra a narradora.
A narradora descobre, confronta ou é confrontada — o drama acontece dentro da história, não é só relatado.
Exemplos do que escrever: marido traindo com a irmã. Melhor amiga ficando com o namorado. Sogra ligando pro chefe inventar mentiras. Cunhado dando em cima. Vizinha espalhando mentiras no prédio.
Nunca escreva sobre: jantares, receitas, visitas, compras, situações cotidianas sem traição ou conflito interpessoal grave.

Regras de escrita:
- não explique sentimentos
- não escreva reflexões
- faça alguém agir a cada 2 ou 3 frases
- sempre que possível use diálogo real (o que a pessoa disse, palavra por palavra)
- nunca escreva: "percebi", "entendi", "a sensação", "era mais do que", "naquele momento", "parecia"
- se um parágrafo não muda a situação, apague
- linguagem de conversa: "parecia cimento" — não "estava da forma mais inusitada possível"
- 4 posts é o ideal — não escreva mais de 5`;


  // Strip any URLs — prevents product URL from leaking into the story
  const stripUrls = (s: string) => s.replace(/https?:\/\/[^\s,)]+/g, "").trim();

  // Give the model the CONTEXT of the product, not the name.
  // Naming it upfront causes the model to drop it early and kill curiosity.
  const situationContext = universe.pains.length > 0
    ? universe.pains.slice(0, 2).map(stripUrls).filter(Boolean).join("; ")
    : stripUrls(productName);

  // Narrator context
  const genderHint = narrator.sex === "female" ? "narradora mulher" : "narrador homem";
  const childrenHint = narrator.hasChildren ? "tem filhos" : "";
  const narratorContext = [genderHint, childrenHint].filter(Boolean).join(", ");
  // Voice hint appended after narrator line (descritivo, nunca instrução)
  const narratorLine = hintText
    ? `Narrador: ${narratorContext}\n${hintText}`
    : `Narrador: ${narratorContext}`;

  const examplesBlock = examples
    .map((ex, i) => `=== EXEMPLO ${i + 1} ===\n${ex}`)
    .join("\n\n");

  const situacaoLine = incidentSeed
    ? `Acontecimento central desta história: ${incidentSeed}

Este acontecimento realmente aconteceu dentro da narrativa.
Não substitua por outro conflito.
Conte como ele foi descoberto, o que as pessoas fizeram e o que aconteceu depois.
Você é livre para decidir quando revelar tudo e como organizar os posts.`
    : `Situação: alguém próximo fez algo grave contra a narradora — traiu, mentiu, humilhou, expôs, sabotou, abandonou, fingiu.`;

  const user = `Leia os exemplos e aprenda o ritmo. Depois escreva algo completamente diferente.

${examplesBlock}

---

${situacaoLine}
Contexto em que o produto aparece: ${situationContext}
${narratorLine}

Posts 1 até o penúltimo: só acontecimentos e falas. Sem mencionar o produto.
Último post: crie uma cena de vida real onde o produto faz sentido aparecer depois do que aconteceu. Use o contexto (${situationContext}) para decidir QUAL cena seria essa. Nessa cena, outro personagem manda ou traz "isso aqui [LINK]" — nunca o narrador recomendando.
CERTO: "Minha mãe veio me ajudar a reorganizar o apartamento depois que ele saiu. Trouxe isso aqui [LINK]"
CERTO: "Dias depois minha prima me mandou isso aqui [LINK] dizendo que tinha comprado pra mim quando me viu assim"
ERRADO: "meu irmão me mandou isso aqui para me ajudar a superar" (vago, sem cena de vida real)
Pergunta final: específica da situação. CERTO: "Eu fui sincera demais?" ERRADO: "Você também já passou por isso?"
[LINK] = exatamente esses 6 caracteres. Não escreva URL. Não invente domínio.
Não copie os exemplos.

Responda APENAS com JSON válido:
{"posts": [{"position": 1, "content": "..."}, {"position": 2, "content": "..."}]}`;

  const text = await callLLM(system, user, config, 1400, ctx, "geração", 0, seed);

  let rawPosts: StoryPost[];
  try {
    const parsed = extractJson<{ posts: StoryPost[] }>(text);
    rawPosts = (parsed.posts ?? []).filter(p => p.content?.trim());
    if (rawPosts.length === 0) throw new Error("Nenhum post gerado.");
    rawPosts = rawPosts.slice(0, 5);
  } catch {
    throw new Error(`Falha ao parsear posts: ${text.slice(0, 200)}`);
  }

  // ── Incident validation and retry ─────────────────────────────────────────
  let incidentFollowed = !incidentSeed;
  let retryTriggered = false;

  if (incidentSeed) {
    incidentFollowed = validateIncidentFollowed(rawPosts, incidentSeed);
    if (!incidentFollowed) {
      retryTriggered = true;
      const retryUser = user + "\n\nA resposta anterior ignorou o acontecimento central. Refaça usando obrigatoriamente o incidente informado, sem mudar o estilo.";
      try {
        const retryText = await callLLM(system, retryUser, config, 1400, ctx, "retry-incident", 0, seed);
        const retryParsed = extractJson<{ posts: StoryPost[] }>(retryText);
        const retryPosts = (retryParsed.posts ?? []).filter(p => p.content?.trim()).slice(0, 5);
        if (retryPosts.length > 0) {
          rawPosts = retryPosts;
          incidentFollowed = validateIncidentFollowed(rawPosts, incidentSeed);
        }
      } catch {
        // Retry failed — use original rawPosts as fallback
      }
    }
  }

  const posts = withLink ? resolveProductLink(rawPosts, productUrl, seed) : rawPosts;
  const score = scoreStory(posts, productUrl);

  // Minimal stub for narrative-engine.ts compatibility
  const firstPostContent = posts[0]?.content ?? "";
  const conflictStub = CONFLICT_BANK[seed % CONFLICT_BANK.length];

  const voiceExperimentDebug: VoiceExperimentData | undefined = voiceExperiment
    ? {
        mode: "exploration",
        dimension: "tone",
        value: toneValue,
        selected: true,
        applied: hintText !== null,
        hintText,
        ragExampleIndices,
        seed,
        seedSentToApi,
        promptVersion: "voice-v0",
      }
    : undefined;

  const debug: StoryDebugData = {
    kind: "story",
    withLink,
    examplesUsed: examples.length,
    posts,
    score,
    callCount: ctx.callCount,
    totalTokens: ctx.totalTokens,
    durationMs: Date.now() - start,
    provider: config.provider,
    model,
    voiceExperiment: voiceExperimentDebug,
    ...(incidentSeed !== undefined ? { incidentFollowed, retryTriggered } : {}),
  };

  return {
    posts,
    conflictSelection: {
      character: "",
      openingMoment: firstPostContent.split("\n")[0] ?? "",
      conflictId: conflictStub.id,
      reasoning: "",
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
