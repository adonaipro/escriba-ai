// Incident Engine V2 — Theme-based drama layer for Story Engine
//
// Seed selects one of N themes → LLM creates a completely free incident within that theme.
// No keyword lists, no scoring, no anchoring.
// Principle: "Give the AI a direction, never a script."

import type { ProductUniverse } from "./product-intelligence-engine";
import type { LlmProviderConfig } from "./types";
import type { IncidentExperimentData, IncidentCandidate } from "./pipeline-types";

// Feature flag — set false to revert to old behavior instantly
export const INCIDENT_EXPERIMENT_ENABLED = true;

// ─── Theme list ───────────────────────────────────────────────────────────────
// Seed picks a theme. LLM is totally free within it.

const DRAMA_THEMES = [
  "traição romântica — alguém foi traído pelo parceiro ou parceira",
  "traição com pessoa próxima — traiu com amiga, cunhada, irmã, vizinha",
  "roubo ou fraude — dinheiro, herança, objeto, conta bancária",
  "mentira e manipulação — alguém fingiu, inventou, manipulou por longo tempo",
  "exposição pública — prints vazados, grupo com família, humilhação na frente de todos",
  "sabotagem — emprego, carreira, reputação destruída por alguém de confiança",
  "inveja disfarçada de amizade — amiga ou amigo que torcia para dar errado",
  "abandono ou rejeição — pai, mãe, parceiro que sumiu quando mais precisava",
  "segredo destruidor — algo guardado por anos que mudou tudo quando veio à tona",
  "vingança e descoberta — a pessoa descobriu e tomou uma atitude inesperada",
  "família que sabotou — sogra, cunhado, parente que tentou destruir o relacionamento",
  "golpe emocional — usou amor ou amizade para conseguir algo e desapareceu",
];

// Deterministic theme pick by seed
function pickTheme(seed: number): string {
  let s = (seed >>> 0) ^ 0x9e3779b9;
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
  s = (s ^ (s >>> 16)) >>> 0;
  return DRAMA_THEMES[s % DRAMA_THEMES.length]!;
}

// ─── LLM call ────────────────────────────────────────────────────────────────

async function callIncidentLLM(
  theme: string,
  config: LlmProviderConfig,
  seed: number,
): Promise<string> {
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

  const system = `Você cria a fofoca inicial para uma história viral no Threads.

Uma fofoca é uma frase que descreve o que aconteceu — quem fez o que, para quem.
Ela deve ser específica o suficiente para uma história se desenvolver a partir dela.
O leitor deve pensar: "Como assim? Não acredito. Quero saber mais."

Formato: começa com a relação ("Meu marido", "Minha irmã", "Minha amiga", "Meu colega", "Minha sogra", etc.) seguida do que aconteceu.
Uma frase, curta e impactante. Não explique, não justifique — só o fato.`;

  const user = `Tema: ${theme}

Crie UMA fofoca dentro desse tema. Seja completamente livre — crie a situação específica que você quiser, com os personagens que você quiser, no contexto que você quiser. Não precisa seguir nenhum exemplo. Só respeite o tema.

Responda APENAS com JSON válido:
{"incident": "..."}`;

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
      max_tokens: 150,
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

  const parsed = JSON.parse(raw.slice(start, end + 1)) as { incident?: unknown };
  const incident = typeof parsed.incident === "string" ? parsed.incident.trim() : "";
  if (incident.length < 10) throw new Error("Incident Engine: resposta vazia");
  return incident;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateBestIncident(
  _universe: ProductUniverse,
  _productName: string,
  seed: number,
  config: LlmProviderConfig,
): Promise<{ selectedIncident: string; debug: IncidentExperimentData } | null> {
  if (!INCIDENT_EXPERIMENT_ENABLED) return null;

  const theme = pickTheme(seed);

  let selectedIncident: string;
  try {
    selectedIncident = await callIncidentLLM(theme, config, seed);
  } catch {
    return null;
  }

  const candidates: IncidentCandidate[] = [{
    incident: selectedIncident,
    curiosityScore: 0,
    storyDepth: 0,
    productFit: 0,
    totalScore: 0,
  }];

  return {
    selectedIncident,
    debug: {
      enabled: true,
      candidates,
      selectedIncident,
      rejectedIncidents: [],
      curiosityScore: 0,
      storyDepth: 0,
      productFit: 0,
      totalScore: 0,
      incidentInjected: false,
      incidentFollowed: false,
      retryTriggered: false,
    },
  };
}
