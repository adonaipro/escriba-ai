// Incident Engine V1 — Drama layer for Story Engine
//
// Generates high-curiosity incident candidates BEFORE the Writer runs.
// The Writer receives the winning incident as context — it doesn't invent
// a situation anymore, it narrates a specific human drama that already happened.
//
// Principle: "First the fofoca, then the product finds its place."

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import type { IncidentExperimentData, IncidentCandidate } from "./pipeline-types";

// Feature flag — set false to revert to old behavior instantly
export const INCIDENT_EXPERIMENT_ENABLED = true;

// ─── Scoring heuristics ───────────────────────────────────────────────────────

const BETRAYAL_VERBS = [
  // Traição / relacionamento
  "traiu", "ficou com", "deu em cima", "tentou ficar", "trocou",
  // Roubo / dinheiro
  "roubou", "pegou sem", "usou sem", "vendeu", "desviou", "estragou", "destruiu o meu",
  // Mentira / manipulação
  "mentiu", "enganou", "fingiu", "manipulou", "inventou", "armou",
  // Exposição / humilhação
  "humilhou", "expôs", "publicou", "espalhou", "denunciou", "contou",
  // Sabotagem / crédito / trabalho
  "sabotou", "destruiu", "acusou", "culpou", "prejudicou", "assumiu o crédito", "se aproveitou",
  // Expulsão / abandono
  "expulsou", "abandonou", "processou",
  // Outros graves
  "apagou", "quebrou", "colocou a culpa",
];

const NAMED_RELATIONSHIPS = [
  "minha mãe", "meu pai", "minha irmã", "meu irmão", "minha amiga",
  "meu amigo", "minha colega", "meu colega", "minha vizinha", "meu vizinho",
  "minha prima", "meu primo", "minha sogra", "meu sogro", "meu ex", "minha ex",
  "meu namorado", "minha namorada", "meu marido", "minha filha", "meu filho",
  "minha cunhada", "meu cunhado", "minha tia", "meu tio",
];

const ACTIVITY_START_PATTERN = /^(fui |estava |tinha |ia |saí |cheguei |quando |ontem |hoje |de manhã |à tarde |à noite |no dia )/i;

const HIGH_STAKES_WORDS = [
  "emprego", "promoção", "viralizou", "família inteira", "todo mundo",
  "perdi", "nunca soube", "até hoje", "dívida", "cartão de crédito",
  "segredo que", "prometeu guardar",
];

const PRODUCT_ADJACENT = [
  "comprou", "compra", "encomenda", "pacote", "produto", "presente",
  "vendeu", "quebrou", "estragou", "destruiu", "devolveu", "jogou fora",
  "dinheiro", "coisa minha", "armário", "roupa", "objeto",
];

function scoreCandidate(incident: string): Omit<IncidentCandidate, "incident"> {
  const text = incident.toLowerCase();

  const hasRelationship = NAMED_RELATIONSHIPS.some(r => text.includes(r));
  const hasBetrayalVerb = BETRAYAL_VERBS.some(v => text.includes(v));

  // Sem verbo de traição = não é fofoca. Eliminado.
  if (!hasBetrayalVerb) {
    return { curiosityScore: 0, storyDepth: 0, productFit: 0, totalScore: 0 };
  }

  // ── Curiosity (0-40): makes someone stop scrolling
  const notActivityStart = !ACTIVITY_START_PATTERN.test(incident);
  const isConcise = incident.length <= 200;

  const curiosityScore = Math.min(40,
    (hasRelationship ? 15 : 0) +
    15 + // hasBetrayalVerb guaranteed true here
    (notActivityStart ? 6 : 0) +
    (isConcise ? 4 : 0),
  );

  // ── Story Depth (0-30): can build 4-6 posts around it
  const hasHighStakes = HIGH_STAKES_WORDS.some(w => text.includes(w));

  const storyDepth = Math.min(30,
    (hasHighStakes ? 15 : 0) +
    (hasBetrayalVerb ? 10 : 0) +
    (hasRelationship ? 5 : 0),
  );

  // ── Product Fit (0-30): can a physical product appear naturally?
  const hasProductContext = PRODUCT_ADJACENT.some(w => text.includes(w));
  const hasBodyOrHome = ["casa", "cozinha", "quarto", "pé", "pés", "corpo", "pele", "cabelo"].some(w => text.includes(w));

  const productFit = Math.min(30,
    (hasProductContext ? 15 : 5) +
    (hasBodyOrHome ? 10 : 5) +
    5,
  );

  return { curiosityScore, storyDepth, productFit, totalScore: curiosityScore + storyDepth + productFit };
}

// ─── LLM call ────────────────────────────────────────────────────────────────

function buildSituationContext(universe: ProductUniverse, productName: string): string {
  const stripUrls = (s: string) => s.replace(/https?:\/\/[^\s,)]+/g, "").trim();
  return universe.pains.length > 0
    ? universe.pains.slice(0, 2).map(stripUrls).filter(Boolean).join("; ")
    : stripUrls(productName);
}

async function callIncidentLLM(
  situationContext: string,
  config: LlmProviderConfig,
  seed: number,
): Promise<string[]> {
  const baseUrl = config.baseUrl?.replace(/\/$/, "") ?? (
    config.provider === "openai"     ? "https://api.openai.com/v1"    :
    config.provider === "openrouter" ? "https://openrouter.ai/api/v1" :
    config.provider === "anthropic"  ? "https://api.anthropic.com/v1" :
                                       "https://api.groq.com/openai/v1"
  );
  const model = config.model ?? (
    config.provider === "openai"    ? "gpt-4o-mini"              :
    config.provider === "anthropic" ? "claude-haiku-4-5-20251001" :
                                      "llama-3.3-70b-versatile"
  );
  const supportsSeed = config.provider !== "anthropic";

  const system = `Você gera fofocas para histórias virais no Threads.

Uma fofoca: alguém fez algo ativo e grave contra outra pessoa.
O leitor deve parar e pensar: "Como assim? Não acredito."

Exemplos de fofoca — TIPOS DIFERENTES:
Infidelidade: "Meu marido estava me traindo com a minha irmã"
Sabotagem profissional: "Minha colega assumiu o crédito do meu projeto na frente do diretor"
Roubo/dinheiro: "Minha irmã vendeu minha herança sem me avisar enquanto eu estava viajando"
Exposição: "Meu ex publicou prints das minhas mensagens privadas num grupo de 50 pessoas"
Mentira/manipulação: "Minha sogra ligou para o meu chefe e inventou mentiras sobre mim"
Expulsão familiar: "Meu cunhado tentou me expulsar de casa depois que meu pai morreu"
Reputação: "Minha vizinha inventou uma história sobre mim e metade da rua acreditou"
Traição de confiança: "Minha melhor amiga usou um segredo que eu contei pra ela pra me prejudicar"
Abandono: "Meu pai me abandonou na rua quando eu tinha 16 anos e apareceu 10 anos depois pedindo dinheiro"

Proibido: visitas, refeições, arrumação, compras, ligações calorosas, conflito sem ação ativa.`;

  const user = `Contexto relacionado ao produto: ${situationContext}

Gere 9 fofocas VARIADAS — misture tipos diferentes obrigatoriamente:
- Infidelidade / romance (traiu, ficou com, deu em cima): máximo 2 das 9
- Dinheiro / trabalho (roubou, vendeu, desviou, sabotou, assumiu crédito, prejudicou): pelo menos 3
- Exposição / humilhação (expôs, publicou, espalhou mentira, humilhou, denunciou): pelo menos 2
- Família / casa / abandono (expulsou, inventou mentira sobre, acusou, fingiu, abandonou, manipulou): pelo menos 2

Cada fofoca:
- Começa com a relação: "Meu marido", "Minha irmã", "Minha amiga", "Minha sogra", "Meu colega", etc.
- Tem um verbo de ação grave e específico
- É uma frase curta e impactante (uma linha)

Responda APENAS com JSON válido:
{"candidates": ["...", "...", ...]}`;

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
        { role: "user",   content: user },
      ],
      temperature: 1.0,
      max_tokens: 700,
      ...(supportsSeed ? { seed } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Incident Engine API ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json() as { choices: Array<{ message: { content: string } }> };
  const content = json.choices[0]?.message?.content ?? "";

  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]+?)```/);
  const raw = fenceMatch ? fenceMatch[1] : content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Incident Engine: JSON não encontrado");

  const parsed = JSON.parse(raw.slice(start, end + 1)) as { candidates?: unknown[] };
  return (parsed.candidates ?? []).filter(
    (c): c is string => typeof c === "string" && c.trim().length > 10,
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateBestIncident(
  universe: ProductUniverse,
  productName: string,
  seed: number,
  config: LlmProviderConfig,
): Promise<{ selectedIncident: string; debug: IncidentExperimentData } | null> {
  if (!INCIDENT_EXPERIMENT_ENABLED) return null;

  const situationContext = buildSituationContext(universe, productName);

  let rawCandidates: string[];
  try {
    rawCandidates = await callIncidentLLM(situationContext, config, seed);
  } catch {
    // Graceful degradation — story engine runs with its default situation line
    return null;
  }

  if (rawCandidates.length < 2) return null;

  const scored: IncidentCandidate[] = rawCandidates.map(incident => ({
    incident,
    ...scoreCandidate(incident),
  }));

  scored.sort((a, b) => b.totalScore - a.totalScore);

  const winner = scored[0];
  // totalScore === 0 significa que nenhum candidato passou no filtro de fofoca
  if (!winner || winner.totalScore === 0) return null;

  return {
    selectedIncident: winner.incident,
    debug: {
      enabled: true,
      candidates: scored,
      selectedIncident: winner.incident,
      rejectedIncidents: scored.slice(1).map(c => c.incident),
      curiosityScore: winner.curiosityScore,
      storyDepth: winner.storyDepth,
      productFit: winner.productFit,
      totalScore: winner.totalScore,
      // Populated by narrative-engine after the Writer runs
      incidentInjected: false,
      incidentFollowed: false,
      retryTriggered: false,
    },
  };
}
