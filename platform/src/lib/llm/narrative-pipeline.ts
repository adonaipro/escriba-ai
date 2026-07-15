// ─── Multi-stage narrative pipeline for Groq/Llama 3.3 70B ──────────────────
//
// Architecture: 3 mandatory stages + 2 conditional refinement stages.
//
// Stage 1 — ExplorationStage
//   Input:  ProductUniverse + NarratorData + Strategy
//   Output: 3-5 real product situations → chosen opportunity → 3 hooks
//   Why:    Product determines conflict BEFORE story is written. Inverts old flow.
//
// Stage 2 — BeatPlanStage
//   Input:  StoryOpportunity + best hook
//   Output: Post-by-post plan with events, optional dialogue, reveals, withholds
//   Why:    Planning and writing are separate cognitive modes. Separating them
//           improves quality of both.
//
// Stage 3 — DraftWriterStage
//   Input:  BeatPlan + selected hook
//   Output: Raw post array
//   Why:    Writer follows a concrete plan with a single job: write compelling prose.
//
// Stage 4 — SpecificityFixStage (conditional: if banned phrases detected)
//   Input:  Draft + list of detected vague phrases
//   Output: Same posts with concrete replacements
//
// Stage 5 — ProductFixStage (conditional: if product integration is artificial)
//   Input:  The specific product post
//   Output: Revised product post with causal integration

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import type {
  ExplorationResult,
  BeatPlanResult,
  PlannedBeat,
  DraftResult,
  PipelineDraftPost,
  NarrativeScore,
  PipelineNarratorData,
  PipelineDebugData,
  PipelineResult,
  StoryOpportunity,
} from "./pipeline-types";

export type { PipelineNarratorData, PipelineDebugData, PipelineResult };

type ProductStrategy = "clickbait" | "contextual" | "hybrid";

// ─── Internal utilities ───────────────────────────────────────────────────────

// Returns wait time in ms, or null if the wait is too long / unknown.
// Groq formats: "35.4s" or "9m35.4s"
function parseRetryAfterMs(errorBody: string): number | null {
  // "Xm Y.Zs" — minutes + seconds
  const minsec = errorBody.match(/try again in (\d+)m(\d+(?:\.\d+)?)s/i);
  if (minsec) {
    const ms = (parseInt(minsec[1]) * 60 + parseFloat(minsec[2])) * 1000 + 2000;
    return ms;
  }
  // "X.Zs" — seconds only
  const sec = errorBody.match(/try again in (\d+(?:\.\d+)?)s/i);
  if (sec) return Math.ceil(parseFloat(sec[1])) * 1000 + 2000;
  return null;
}

function isTokensPerDayError(errText: string): boolean {
  return /tokens per day|TPD/i.test(errText);
}

function isTokensPerMinuteError(errText: string): boolean {
  return /tokens per minute|TPM/i.test(errText);
}

function extractJSON<T>(raw: string): T {
  let s = raw.trim()
    .replace(/^```(?:json)?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();

  const start = s.indexOf("{");
  const end   = s.lastIndexOf("}");
  if (start !== -1 && end > start) s = s.slice(start, end + 1);

  return JSON.parse(s) as T;
}

async function callStage<T>(
  config: LlmProviderConfig,
  system: string,
  user: string,
  temperature: number,
  maxTokens: number,
  retriesLeft = 3,
): Promise<{ result: T; tokens: number }> {
  const defaultBaseUrl =
    config.provider === "openai"      ? "https://api.openai.com/v1" :
    config.provider === "openrouter"  ? "https://openrouter.ai/api/v1" :
    config.provider === "anthropic"   ? "https://api.anthropic.com/v1" :
                                        "https://api.groq.com/openai/v1";

  const defaultModel =
    config.provider === "openai"     ? "gpt-4o-mini" :
    config.provider === "anthropic"  ? "claude-haiku-4-5-20251001" :
                                       "llama-3.3-70b-versatile";

  const baseUrl = config.baseUrl?.replace(/\/$/, "") || defaultBaseUrl;
  const model   = config.model || defaultModel;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user   },
        ],
      }),
    });
  } catch (networkErr) {
    if (retriesLeft > 0) {
      await new Promise(r => setTimeout(r, 5000));
      return callStage(config, system, user, temperature, maxTokens, retriesLeft - 1);
    }
    throw networkErr;
  }

  if (!response.ok) {
    const errText = await response.text();

    if (response.status === 429 || response.status === 400) {
      // OpenAI: saldo insuficiente (não resolve com retry)
      if (errText.includes("insufficient_quota") || errText.includes("exceeded your current quota") || errText.includes("billing")) {
        throw new Error("Créditos OpenAI insuficientes. Verifique seu saldo em platform.openai.com/usage.");
      }
    }

    if (response.status === 429) {
      // Limite diário (TPD) — não adianta esperar segundos, falhar com mensagem clara
      if (isTokensPerDayError(errText)) {
        const waitMatch = errText.match(/try again in ([\d]+)m([\d.]+)s/i);
        const waitMinutes = waitMatch ? Math.ceil(parseInt(waitMatch[1]) + parseFloat(waitMatch[2]) / 60) : "alguns";
        throw new Error(
          `Limite diário de tokens do Groq atingido. Aguarde ${waitMinutes} minutos para o limite resetar, ou faça upgrade para o Dev Tier em console.groq.com.`
        );
      }

      // Limite por minuto (TPM) — aguardar e retentar é válido
      if (isTokensPerMinuteError(errText) && retriesLeft > 0) {
        const waitMs = parseRetryAfterMs(errText) ?? 22000;
        // Se a espera for > 3 minutos, desiste (algo errado)
        if (waitMs > 180_000) {
          throw new Error(`Rate limit do Groq: espera de ${Math.round(waitMs / 60000)} minutos. Tente novamente mais tarde.`);
        }
        await new Promise(r => setTimeout(r, waitMs));
        return callStage(config, system, user, temperature, maxTokens, retriesLeft - 1);
      }

      // 429 genérico — tenta aguardar se houver retries disponíveis
      if (retriesLeft > 0) {
        const waitMs = parseRetryAfterMs(errText) ?? 22000;
        if (waitMs <= 180_000) {
          await new Promise(r => setTimeout(r, waitMs));
          return callStage(config, system, user, temperature, maxTokens, retriesLeft - 1);
        }
      }
    }

    throw new Error(`Pipeline API ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { total_tokens: number };
  };

  const content = data.choices[0]?.message?.content ?? "";
  const tokens  = data.usage?.total_tokens ?? 0;

  let result: T;
  try {
    result = extractJSON<T>(content);
  } catch {
    // Model returned non-JSON — retry with reminder
    if (retriesLeft > 0) {
      const systemWithReminder = system + "\n\nIMPORTANTE: Responda SOMENTE com JSON válido. Sem texto antes ou depois.";
      return callStage(config, systemWithReminder, user, temperature, maxTokens, retriesLeft - 1);
    }
    throw new Error(`Pipeline: JSON parse failed. Raw: ${content.slice(0, 200)}`);
  }

  return { result, tokens };
}

// ─── Stage 1: Exploration (product → opportunity → hooks) ────────────────────

async function explorationStage(
  universe: ProductUniverse,
  productName: string,
  narrator: PipelineNarratorData,
  strategy: ProductStrategy,
  seed: number,
  config: LlmProviderConfig,
): Promise<{ result: ExplorationResult; tokens: number }> {
  const system = "Você analisa produtos e cria oportunidades de história viral. Responda APENAS em JSON válido.";

  const strategyHint =
    strategy === "clickbait"
      ? "O produto aparece APENAS no último post — como descoberta inesperada, sem anúncio prévio."
      : strategy === "contextual"
      ? "O produto aparece no penúltimo post, como consequência direta do conflito."
      : "O produto pode aparecer no penúltimo ou último post — escolha o que for mais natural à história.";

  const conflictStyleLabel = {
    avoids:      "evita confronto, guarda pra si",
    confronts:   "confronta na hora, mesmo que saia errado",
    deflects:    "desvia o assunto, muda de tema",
    internalizes:"não fala, processa sozinha por dentro",
  }[narrator.conflictStyle];

  const user = `PRODUTO: ${productName}
CATEGORIA: ${universe.categoryLabel ?? "produto"}
DORES QUE RESOLVE: ${(universe.pains ?? []).slice(0, 5).join(", ")}
CENÁRIOS DE USO REAIS: ${(universe.scenarios ?? []).slice(0, 5).join(", ")}
PONTES TEMÁTICAS: ${(universe.bridgeTopics ?? []).slice(0, 4).join(", ")}

NARRADORA: mulher, ${narrator.ageRange}, ${narrator.maritalStatus}
COMO REAGE A CONFLITO: ${conflictStyleLabel}
ESTRATÉGIA DO PRODUTO: ${strategyHint}

PASSO 1 — Liste 4 situações CONCRETAS onde "${productName}" existe naturalmente.
Cada situação: cena específica (com detalhe: não "trabalhar em casa" mas "editar vídeo por 8h com a cadeira afundando de um lado"), personagem (ex: "meu marido"), como o produto aparece, tipo de conflito.
Conflito deve ser UM DE: invasão_de_espaço, decided_for_me, desgaste_silencioso, combinados_quebrados, surpresa_de_gratidão

PASSO 2 — Escolha a situação com mais potencial dramático para o perfil desta narradora.
Desenvolva em detalhe: O CONFLITO DEVE SER CAUSADO PELO PRODUTO ou diretamente relacionado a ele.
Sem metáforas ("o produto simboliza X"). Sem conexão forçada.

PASSO 3 — Escreva 3 hooks (primeira frase) para essa história.
Cada hook DEVE: começar com o personagem, ter ação concreta observável, mencionar detalhe físico ou número, abrir 2+ perguntas sem responder nenhuma.
PROIBIDO: "Eu percebi", descrever ambiente, palavras vagas (estranho, diferente, mudou).

Retorne JSON (exato, sem texto extra):
{
  "situations": [
    {"scene":"...","character":"...","conflictFamily":"...","productEntry":"..."}
  ],
  "chosenOpportunity": {
    "character":"minha/meu [relação]",
    "specificSituation":"uma frase — o que EXATAMENTE aconteceu, com detalhes concretos",
    "conflictFamily":"...",
    "conflictObject":"nome concreto do objeto",
    "productEntry":"como e quando ${productName} aparece — deve ser causal",
    "productCausality":"direct|contextual|received"
  },
  "hooks": ["hook1","hook2","hook3"]
}`;

  return callStage<ExplorationResult>(config, system, user, 0.82, 700, 3);
}

// ─── Hook selection (programmatic — no LLM call) ─────────────────────────────

export function selectBestHook(hooks: string[]): string {
  if (hooks.length === 0) return "";

  const score = (h: string): number => {
    let s = 0;
    const lower = h.toLowerCase();
    // Starts with person word
    if (/^(minha|meu|nossa|nosso)/i.test(h.trim())) s += 4;
    // Has action verb
    if (/\b(entrou|desligou|mandou|disse|fez|chegou|apareceu|comprou|pegou|tirou|abriu|ligou|decidiu|gastou|mostrou|contou|falou)\b/i.test(h)) s += 3;
    // Has specific concrete detail (number, object, brand)
    if (/\d|R\$|pix|whatsapp|ar-condicionado|cadeira|chave|áudio|conta|bolsa|notebook|celular/.test(lower)) s += 3;
    // Has judgment or consequence (additional curiosity loop)
    if (/disse que|falou que|respondeu que|e ainda|sem avisar|sem perguntar/.test(lower)) s += 2;
    // Length — longer hooks tend to pack more curiosity loops
    if (h.length > 80) s += 1;
    if (h.length > 120) s += 1;
    return s;
  };

  return [...hooks].sort((a, b) => score(b) - score(a))[0]!;
}

// ─── Product post index ───────────────────────────────────────────────────────

export function selectProductPost(strategy: ProductStrategy, postCount: number, seed: number): number {
  if (strategy === "clickbait") return postCount;
  if (strategy === "contextual") return postCount - 1;
  // hybrid: alternate between last and penultimate
  return Math.abs(seed + 5) % 2 === 0 ? postCount - 1 : postCount;
}

// ─── Stage 2: Beat Plan ───────────────────────────────────────────────────────

function formatConflictStyleHint(style: PipelineNarratorData["conflictStyle"]): string {
  return {
    avoids:      "A narradora evita confronto — fica calada, sai do ambiente, não responde diretamente.",
    confronts:   "A narradora confronta na hora — fala o que pensa, mesmo que saia errado ou cause tensão.",
    deflects:    "A narradora desvia — muda de assunto, ri sem graça, age como se não tivesse acontecido.",
    internalizes:"A narradora processa por dentro — não fala nada externamente mas o leitor vê o peso nos detalhes.",
  }[style];
}

async function beatPlanStage(
  opportunity: StoryOpportunity,
  selectedHook: string,
  narrator: PipelineNarratorData,
  strategy: ProductStrategy,
  productPost: number,
  postCount: number,
  productUrl: string,
  productName: string,
  config: LlmProviderConfig,
): Promise<{ result: BeatPlanResult; tokens: number }> {
  const system = "Você é um diretor de narrativas virais. Responda APENAS em JSON válido.";

  const user = `HOOK DEFINIDO (primeira frase obrigatória do post 1):
"${selectedHook}"

SITUAÇÃO: ${opportunity.specificSituation}
PERSONAGEM: ${opportunity.character}
OBJETO DO CONFLITO: ${opportunity.conflictObject}
COMO O PRODUTO ENTRA: ${opportunity.productEntry}
PRODUTO NO POST: ${productPost} de ${postCount}
LINK: ${productUrl}

COMO A NARRADORA AGE: ${formatConflictStyleHint(narrator.conflictStyle)}

Planeje exatamente ${postCount} posts. Para cada post defina:

- event: o que ACONTECE — uma ação concreta observável (não emoção, não estado mental)
- dialogue: array com 4-8 linhas de diálogo SE o post deve ter conversa (null se não).
  Formato: "— frase curta." Máximo 6-8 palavras por linha. Respostas interrompidas, naturais.
  Exemplo: ["— Eu precisava do espaço.", "— Você podia ter avisado.", "— Avisei.", "— Não avisou."]
- reveal: qual informação concreta o leitor descobre neste post
- withhold: qual informação fica em aberto para o próximo (null no último post)
- isProductPost: true apenas para o post ${productPost}

REGRAS DO PLANO:
• Post 1: mostra o acontecimento logo após o hook. Sem descrever ambiente ou rotina.
• Posts 2-${postCount - 2}: avanço por ação, diálogo ou revelação — NUNCA por repetição de emoção.
• Post ${productPost}: ${opportunity.character} traz/manda/menciona ${productName} por razão diretamente ligada ao conflito. Link: ${productUrl}
• Post ${postCount}: fechamento. Pode ser aberto. Máximo 1 pergunta ao leitor — e só se for natural.

Retorne JSON:
{
  "beats": [
    {
      "postIndex": 1,
      "event": "...",
      "dialogue": ["— ...","— ..."] ou null,
      "reveal": "...",
      "withhold": "..." ou null,
      "isProductPost": false
    }
  ]
}`;

  return callStage<BeatPlanResult>(config, system, user, 0.65, 900, 3);
}

// ─── Stage 3: Draft Writer ────────────────────────────────────────────────────

function formatBeatForWriter(beat: PlannedBeat, productUrl: string): string {
  const lines = [
    `POST ${beat.postIndex}:`,
    `  ACONTECIMENTO: ${beat.event}`,
  ];
  if (beat.dialogue && beat.dialogue.length > 0) {
    lines.push(`  DIÁLOGO (escreva exatamente estas linhas ou melhore — curto e natural):\n${beat.dialogue.map(l => `    ${l}`).join("\n")}`);
  }
  lines.push(`  REVELA AO LEITOR: ${beat.reveal}`);
  if (beat.withhold) {
    lines.push(`  MANTÉM EM ABERTO: ${beat.withhold}`);
  }
  if (beat.isProductPost) {
    lines.push(`  ← PRODUTO ENTRA AQUI. Link: ${productUrl}`);
    lines.push(`     Produto surge por causalidade direta. Não descreva. Não use metáfora. Não justifique.`);
  }
  return lines.join("\n");
}

async function draftWriterStage(
  beats: PlannedBeat[],
  selectedHook: string,
  narrator: PipelineNarratorData,
  opportunity: StoryOpportunity,
  productPost: number,
  productUrl: string,
  productName: string,
  config: LlmProviderConfig,
): Promise<{ result: DraftResult; tokens: number }> {
  const beatsPlan = beats.map(b => formatBeatForWriter(b, productUrl)).join("\n\n");
  const postCount = beats.length;

  const system = `Você é uma mulher escrevendo no Threads. Você não é uma IA. Você é a própria pessoa vivendo isso.

PROIBIDO ABSOLUTAMENTE — se qualquer uma aparecer, o post falhou:
• Frases vagas: "achei estranho" / "algo mudou" / "tudo fez sentido" / "não sabia o que sentir" / "fiquei processando" / "aquilo mexeu comigo" / "me fez refletir" / "aprendi que" / "no fundo" / "me dei conta" / "comecei a perceber" / "percebi que" / "nunca mais foi igual" / "minha vida mudou"
• Metáforas para justificar produto: "assim como X, o produto Y" / "X virou símbolo de" / "X me lembrou de"
• Palavras em inglês no texto (feeling, really, lost, ok, okay, vibe)
• Abrir com: sol, janela, silêncio, luz, cheiro, ambiente, cotidiano, rotina
• Quebrar a quarta parede: "não entendi por que ela mandou isso"

OBRIGATÓRIO em cada post:
• Pelo menos 1 ação concreta com verbo específico (entrou, disse, mandou, fez, pegou, desligou, comprou, saiu, respondeu)
• Se tem diálogo: múltiplos turnos curtos, linguagem cotidiana, respostas imperfeitas e interrompidas

PRODUTO no post ${productPost}: entra por razão causal, não decorativa. Uma linha é suficiente. Não descreva o produto.

Retorne JSON sem markdown, sem texto antes ou depois:
{"posts":[{"position":1,"content":"texto completo do post"},{"position":2,"content":"..."},...]}`;

  const user = `PRIMEIRA FRASE DO POST 1 (use literalmente, não mude nada):
"${selectedHook}"

SIGA ESTE PLANO:

${beatsPlan}

Escreva os ${postCount} posts. Post 1 começa com: "${selectedHook}"
Produto no post ${productPost}: ${productName} — link: ${productUrl}`;

  return callStage<DraftResult>(config, system, user, 0.85, 3800, 3);
}

// ─── Scoring (programmatic — no LLM call) ────────────────────────────────────

const BANNED_PHRASES = [
  "achei estranho",
  "algo mudou",
  "tudo fez sentido",
  "nunca mais foi igual",
  "minha vida nunca mais",
  "não sabia o que sentir",
  "fiquei processando",
  "aquilo mexeu comigo",
  "me fez refletir",
  "aprendi que",
  "no fundo",
  "o importante é",
  "comecei a perceber",
  "percebi que",
  "entendi que",
  "me dei conta",
  "não sei explicar",
  "senti que faltava",
  "fiquei pensando muito",
  "foi aí que entendi",
  "algo dentro de mim",
];

export function scoreNarrative(posts: PipelineDraftPost[]): NarrativeScore {
  const issues: string[] = [];
  const fullText = posts.map(p => p.content).join("\n").toLowerCase();

  // Hook density (0-20)
  const firstPost   = posts[0]?.content ?? "";
  const firstLines  = firstPost.split(/\n/);
  const firstSentence = (firstLines[0] ?? "").trim();
  let hookDensity = 0;
  if (/^(minha|meu|nossa|nosso)/i.test(firstSentence)) {
    hookDensity += 8;
  } else {
    issues.push("Hook não começa com personagem");
  }
  if (/\b(entrou|desligou|mandou|disse|fez|chegou|apareceu|comprou|pegou|abriu|ligou|decidiu|gastou|mostrou|contou|falou|saiu|voltou)\b/i.test(firstSentence)) {
    hookDensity += 6;
  } else {
    issues.push("Hook sem verbo de ação concreto");
  }
  if (firstSentence.length > 70 || /\d|R\$|pix|ar-condicionado|cadeira|chave|áudio|conta|celular|notebook/.test(firstSentence.toLowerCase())) {
    hookDensity += 6;
  }

  // Event progression (0-20)
  const actionMatches = (fullText.match(/\b(entrou|disse|mandou|chegou|fez|pegou|abriu|ligou|desligou|comprou|enviou|respondeu|perguntou|apareceu|foi|veio|trouxe|mostrou|contou|falou|saiu|voltou|fechou|abriu|jogou|colocou|tirou|deixou)\b/g) ?? []).length;
  const vagueMatches  = (fullText.match(/\b(processando|percebendo|refletindo|sentindo|percebeu que|achei que talvez|sentia que|parecia que algo)\b/g) ?? []).length;
  const actionRatio   = actionMatches / Math.max(actionMatches + vagueMatches, 1);
  const eventProgression = Math.min(20, Math.round(actionRatio * 20));
  if (actionRatio < 0.6) issues.push("Pouca progressão por ação — muitos estados emocionais");

  // Specificity (0-20)
  const bannedFound = BANNED_PHRASES.filter(p => fullText.includes(p));
  const specificity = Math.max(0, 20 - bannedFound.length * 4);
  if (bannedFound.length > 0) {
    issues.push(`Frases genéricas: ${bannedFound.slice(0, 3).join(", ")}`);
  }

  // Dialogue quality (0-20)
  const dialogueLines = posts.flatMap(p =>
    p.content.split("\n").filter(l => l.trim().startsWith("—"))
  ).length;
  const dialogueQuality =
    dialogueLines >= 6 ? 20 :
    dialogueLines >= 4 ? 16 :
    dialogueLines >= 2 ? 10 :
    dialogueLines >= 1 ? 5  : 0;
  if (dialogueLines === 0) issues.push("Sem diálogo detectado");

  // Product integration (0-20)
  const productPost = posts.find(p => /https?:\/\//.test(p.content));
  let productIntegration = 0;
  if (productPost) {
    const artificial = /não entendi por que|achei estranho|era apenas|assim como a|virou um símbolo|representa|me lembrou de/.test(productPost.content.toLowerCase());
    productIntegration = artificial ? 4 : 20;
    if (artificial) issues.push("Produto com integração artificial ou metafórica");
  } else {
    issues.push("Link do produto não encontrado nos posts");
  }

  const total = hookDensity + eventProgression + specificity + dialogueQuality + productIntegration;

  return {
    hookDensity,
    eventProgression,
    specificity,
    dialogueQuality,
    productIntegration,
    total,
    issues,
    bannedFound,
  };
}

// ─── Stage 4: Specificity Fix (conditional) ──────────────────────────────────

async function specificityFixStage(
  posts: PipelineDraftPost[],
  bannedFound: string[],
  config: LlmProviderConfig,
): Promise<{ result: DraftResult; tokens: number }> {
  const system = "Você é um editor de especificidade. Responda APENAS em JSON válido.";

  const examples = [
    '"achei estranho" → detalhe concreto: "ela mandou mensagem às 02h17" ou "o Pix caiu antes de ela aparecer"',
    '"algo mudou" → ação específica: "ela parou de me marcar nas fotos depois disso"',
    '"tudo fez sentido" → observação concreta: "o recibo tinha a data de quando ela disse que estava em casa"',
    '"não sabia o que sentir" → substitua por ação que mostra a emoção: "fui lavar a louça que já estava limpa"',
  ];

  const user = `Revise estes posts. Substitua SOMENTE as frases vagas listadas — não altere nada mais.

FRASES A SUBSTITUIR: ${bannedFound.join(" / ")}

COMO SUBSTITUIR (exemplos):
${examples.join("\n")}

REGRAS:
• Invente um detalhe concreto que poderia ser verdade nessa história
• Não adicione metáforas
• Não mude o tamanho geral dos posts
• Os posts devem continuar coerentes entre si

POSTS:
${JSON.stringify(posts)}

Retorne JSON: {"posts":[{"position":1,"content":"..."},...]}`;

  return callStage<DraftResult>(config, system, user, 0.6, 2200, 3);
}

// ─── Stage 5: Product Fix (conditional) ──────────────────────────────────────

async function productFixStage(
  posts: PipelineDraftPost[],
  productPostIndex: number,
  opportunity: StoryOpportunity,
  productUrl: string,
  productName: string,
  config: LlmProviderConfig,
): Promise<{ post: PipelineDraftPost; tokens: number }> {
  const system = "Você é um editor de integração de produto. Responda APENAS em JSON válido.";
  const currentPost = posts.find(p => p.position === productPostIndex);

  const causalityHint = {
    received:   `${opportunity.character} enviou ou mencionou o produto — havia uma razão lógica: ${opportunity.productEntry}`,
    direct:     `O produto é o objeto central do conflito e aparece naturalmente: ${opportunity.productEntry}`,
    contextual: `O produto surge como consequência direta da situação: ${opportunity.productEntry}`,
  }[opportunity.productCausality] ?? opportunity.productEntry;

  const user = `O post ${productPostIndex} precisa de revisão na integração do produto.

COMO O PRODUTO DEVIA ENTRAR: ${causalityHint}
SITUAÇÃO ORIGINAL: ${opportunity.specificSituation}

POST ATUAL:
${currentPost?.content ?? ""}

Reescreva APENAS o post ${productPostIndex}.
${productName} entra de forma CAUSAL — alguém trouxe, mandou, ou está relacionado diretamente ao conflito.

ABSOLUTAMENTE PROIBIDO:
• "não entendi por que ela mandou isso" / "achei estranho"
• "assim como X, o produto Y" (metáforas comparativas)
• Descrever características do produto

O link ${productUrl} aparece uma vez, integrado naturalmente ao texto.

Retorne JSON: {"position":${productPostIndex},"content":"texto do post revisado"}`;

  const { result, tokens } = await callStage<{ position: number; content: string }>(
    config, system, user, 0.68, 700, 3,
  );

  return {
    post: { position: productPostIndex, content: result.content },
    tokens,
  };
}

// ─── Main pipeline orchestrator ───────────────────────────────────────────────

export async function runNarrativePipeline(
  universe: ProductUniverse,
  productName: string,
  productUrl: string,
  narrator: PipelineNarratorData,
  strategy: ProductStrategy,
  seed: number,
  config: LlmProviderConfig,
): Promise<PipelineResult> {
  const startMs = Date.now();
  let callCount   = 0;
  let totalTokens = 0;

  const provider = config.provider;
  const model    = config.model ?? "llama-3.3-70b-versatile";

  // ─── Stage 1: Exploration ─────────────────────────────────────────────────
  const { result: exploration, tokens: t1 } = await explorationStage(
    universe, productName, narrator, strategy, seed, config,
  );
  callCount++; totalTokens += t1;

  const selectedHook = selectBestHook(exploration.hooks ?? []);
  const opportunity  = exploration.chosenOpportunity;

  // ─── Stage 2: Beat Plan ───────────────────────────────────────────────────
  const postCount  = 5;
  const productPost = selectProductPost(strategy, postCount, seed);

  const { result: beatPlanResult, tokens: t2 } = await beatPlanStage(
    opportunity, selectedHook, narrator, strategy, productPost, postCount,
    productUrl, productName, config,
  );
  callCount++; totalTokens += t2;

  const beats: PlannedBeat[] = (beatPlanResult.beats ?? []).map((b, i) => ({
    ...b,
    postIndex:     b.postIndex ?? i + 1,
    dialogue:      b.dialogue ?? null,
    withhold:      b.withhold ?? null,
    isProductPost: b.isProductPost ?? (b.postIndex === productPost),
  }));

  // ─── Stage 3: Draft Writer ────────────────────────────────────────────────
  const { result: draftResult, tokens: t3 } = await draftWriterStage(
    beats, selectedHook, narrator, opportunity, productPost,
    productUrl, productName, config,
  );
  callCount++; totalTokens += t3;

  let posts: PipelineDraftPost[] = draftResult.posts ?? [];

  // Ensure posts are sorted by position
  posts = [...posts].sort((a, b) => a.position - b.position);

  // ─── Score initial draft ──────────────────────────────────────────────────
  const initialScore = scoreNarrative(posts);

  // ─── Stage 4: Specificity Fix (conditional) ───────────────────────────────
  let specificityFixed = false;
  if (initialScore.bannedFound.length > 0 || initialScore.specificity < 12) {
    const { result: fixedDraft, tokens: t4 } = await specificityFixStage(
      posts, initialScore.bannedFound, config,
    );
    callCount++; totalTokens += t4;
    if ((fixedDraft.posts ?? []).length > 0) {
      posts = [...fixedDraft.posts].sort((a, b) => a.position - b.position);
      specificityFixed = true;
    }
  }

  // ─── Stage 5: Product Fix (conditional) ──────────────────────────────────
  let productFixed = false;
  const scoreAfterSpecificity = scoreNarrative(posts);
  if (scoreAfterSpecificity.productIntegration < 20) {
    const { post: fixedPost, tokens: t5 } = await productFixStage(
      posts, productPost, opportunity, productUrl, productName, config,
    );
    callCount++; totalTokens += t5;
    posts = posts.map(p => p.position === productPost ? fixedPost : p);
    productFixed = true;
  }

  const finalScore = scoreNarrative(posts);

  const debug: PipelineDebugData = {
    stage:           "done",
    situations:      (exploration.situations ?? []).map(s => ({
      scene:          s.scene,
      character:      s.character,
      conflictFamily: s.conflictFamily,
    })),
    chosenOpportunity: opportunity,
    hooksConsidered:   exploration.hooks ?? [],
    selectedHook,
    beatPlan:          beats,
    draftPosts:        draftResult.posts ?? [],
    score:             finalScore,
    specificityFixed,
    productFixed,
    callCount,
    totalTokens,
    durationMs:        Date.now() - startMs,
    provider,
    model,
  };

  return {
    posts,
    opportunity,
    score:        finalScore,
    selectedHook,
    debug,
  };
}
