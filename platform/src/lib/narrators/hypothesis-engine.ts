/**
 * Hypothesis Engine
 *
 * When a Narrator is created, the AI auto-generates hypotheses across all
 * narrative dimensions. The engine then tests these hypotheses by selecting
 * one per dimension for each generation. Performance data updates the
 * hypothesis status (testing → winner | loser).
 *
 * Two learning levels:
 *   1. Narrator-level  → NarratorHypothesis (per narrator + niche)
 *   2. Global-level    → NarrativePattern   (per profile, cross-narrator)
 */

export type HypothesisDimension =
  | "tone"
  | "rhythm"
  | "productStrategy"
  | "questionType"
  | "conflictType"
  | "openingStyle"
  | "structureType";

export interface HypothesisSpec {
  dimension: HypothesisDimension;
  value: string;
  label: string;
}

// ─────────────────────────────────────────────────────────────────
// Dimension value pools
// ─────────────────────────────────────────────────────────────────

export const HYPOTHESIS_POOLS: Record<HypothesisDimension, string[]> = {
  tone: ["emocional", "objetivo", "reflexivo", "leve", "intenso"],
  rhythm: ["rápido", "médio", "lento"],
  productStrategy: ["clickbait", "contextual", "híbrida"],
  questionType: ["moral", "experiência", "decisão", "validação"],
  openingStyle: ["ação direta", "contexto primeiro", "emoção primeiro"],
  conflictType: ["familiar", "financeiro", "relacionamento", "trabalho", "cotidiano"],
  structureType: ["escadaria", "flash", "reflexão", "decisão"],
};

export const DIMENSION_LABELS: Record<HypothesisDimension, string> = {
  tone: "Tom",
  rhythm: "Ritmo",
  productStrategy: "Estratégia de Produto",
  questionType: "Tipo de Pergunta",
  openingStyle: "Abertura",
  conflictType: "Tipo de Conflito",
  structureType: "Estrutura",
};

// ─────────────────────────────────────────────────────────────────
// Generate all initial hypotheses for a new narrator
// ─────────────────────────────────────────────────────────────────

export function generateInitialHypotheses(
  narratorId: string,
  niche: string,
  narrator: {
    sex: string;
    ageRange: string;
    maritalStatus: string;
    hasChildren: boolean;
    livesAlone: boolean;
  }
): Array<{
  narratorId: string;
  niche: string;
  dimension: string;
  value: string;
  status: string;
}> {
  const specs: Array<{ dimension: string; value: string }> = [];

  // Add all values for every dimension
  for (const [dimension, values] of Object.entries(HYPOTHESIS_POOLS)) {
    for (const value of values) {
      specs.push({ dimension, value });
    }
  }

  return specs.map((s) => ({
    narratorId,
    niche,
    dimension: s.dimension,
    value: s.value,
    status: "testing",
  }));
}

// ─────────────────────────────────────────────────────────────────
// Select a hypothesis value for a given dimension during generation
// Prefers "testing" over "winner" (need fresh data)
// Never uses "loser"
// ─────────────────────────────────────────────────────────────────

export function selectHypothesisValue(
  hypotheses: Array<{
    dimension: string;
    value: string;
    status: string;
    usageCount: number;
    winCount: number;
    confidence: number;
  }>,
  dimension: HypothesisDimension
): string {
  const pool = hypotheses.filter(
    (h) => h.dimension === dimension && h.status !== "loser"
  );

  if (pool.length === 0) {
    return HYPOTHESIS_POOLS[dimension][0];
  }

  // Prioritise least-used hypothesis (exploration over exploitation)
  const testing = pool.filter((h) => h.status === "testing");
  const source = testing.length > 0 ? testing : pool;

  // Sort by usage count ascending (least tested first)
  const sorted = [...source].sort((a, b) => a.usageCount - b.usageCount);
  return sorted[0].value;
}

// ─────────────────────────────────────────────────────────────────
// Update hypothesis stats after a trend's performance is known
// ─────────────────────────────────────────────────────────────────

export interface HypothesisUpdate {
  dimension: string;
  value: string;
  ctr: number;
  isWin: boolean;
}

export function computeConfidence(winCount: number, usageCount: number): number {
  if (usageCount < 3) return 0;
  const rate = winCount / usageCount;
  // Simple Wilson lower bound approximation
  const z = 1.645; // 90% confidence
  const phat = rate;
  const n = usageCount;
  const score =
    (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n);
  return Math.max(0, Math.min(1, score));
}

// ─────────────────────────────────────────────────────────────────
// Build a human-readable hypothesis cluster description for a narrator
// Used on the narrator detail page
// ─────────────────────────────────────────────────────────────────

export function buildHypothesisSummary(
  hypotheses: Array<{
    dimension: string;
    value: string;
    status: string;
    usageCount: number;
    winCount: number;
    confidence: number;
  }>
): {
  winners: Array<{ dimension: string; value: string; confidence: number }>;
  losers: Array<{ dimension: string; value: string }>;
  testing: Array<{ dimension: string; value: string; usageCount: number }>;
} {
  return {
    winners: hypotheses
      .filter((h) => h.status === "winner")
      .map((h) => ({ dimension: h.dimension, value: h.value, confidence: h.confidence })),
    losers: hypotheses
      .filter((h) => h.status === "loser")
      .map((h) => ({ dimension: h.dimension, value: h.value })),
    testing: hypotheses
      .filter((h) => h.status === "testing")
      .sort((a, b) => a.usageCount - b.usageCount)
      .slice(0, 6)
      .map((h) => ({ dimension: h.dimension, value: h.value, usageCount: h.usageCount })),
  };
}
