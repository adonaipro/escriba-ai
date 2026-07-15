/**
 * Insight Engine
 *
 * Analyses hypothesis data to generate human-readable insights.
 * Operates at two levels:
 *   1. Narrator-level  → what works for this narrator in this niche
 *   2. Global-level    → cross-narrator patterns across the platform
 *
 * Architecture note:
 *   - Insights are generated from hypothesis win rates
 *   - Minimum sample size of 5 to declare a winner/insight
 *   - Confidence is derived from Wilson lower bound
 *   - Niche context is always explicit (no cross-niche generalizations)
 */

export interface InsightInput {
  narratorId: string;
  narratorName: string;
  niche: string;
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  hypotheses: Array<{
    dimension: string;
    value: string;
    status: string;
    usageCount: number;
    winCount: number;
    confidence: number;
    uplift: number;
  }>;
}

export interface GeneratedInsight {
  narratorId: string;
  niche: string;
  title: string;
  body: string;
  dimension: string;
  confidence: number;
  sampleSize: number;
  impact: "positive" | "negative" | "neutral";
}

export function generateNarratorInsights(input: InsightInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  const winners = input.hypotheses.filter(
    (h) => h.status === "winner" && h.usageCount >= 5
  );

  for (const winner of winners) {
    const dimLabel: Record<string, string> = {
      tone: "Tom",
      rhythm: "Ritmo",
      productStrategy: "Estratégia de produto",
      questionType: "Pergunta final",
      conflictType: "Tipo de conflito",
      openingStyle: "Abertura",
      structureType: "Estrutura",
    };

    const dim = dimLabel[winner.dimension] ?? winner.dimension;

    insights.push({
      narratorId: input.narratorId,
      niche: input.niche,
      title: `${dim} "${winner.value}" vence`,
      body: `${input.narratorName} performa melhor com ${dim.toLowerCase()} "${winner.value}" no nicho ${input.niche}. Confiança baseada em ${winner.usageCount} histórias.${winner.uplift > 0 ? ` Uplift de ${(winner.uplift * 100).toFixed(0)}% vs. média.` : ""}`,
      dimension: winner.dimension,
      confidence: winner.confidence,
      sampleSize: winner.usageCount,
      impact: "positive",
    });
  }

  const losers = input.hypotheses.filter(
    (h) => h.status === "loser" && h.usageCount >= 5
  );

  for (const loser of losers) {
    const dimLabel: Record<string, string> = {
      tone: "tom",
      rhythm: "ritmo",
      productStrategy: "estratégia de produto",
      questionType: "pergunta final",
      conflictType: "tipo de conflito",
      openingStyle: "abertura",
      structureType: "estrutura",
    };
    const dim = dimLabel[loser.dimension] ?? loser.dimension;

    insights.push({
      narratorId: input.narratorId,
      niche: input.niche,
      title: `${dim} "${loser.value}" não funciona`,
      body: `Para ${input.narratorName} no nicho ${input.niche}, ${dim} "${loser.value}" apresenta baixa performance. Recomendado pausar testes com este valor.`,
      dimension: loser.dimension,
      confidence: loser.confidence,
      sampleSize: loser.usageCount,
      impact: "negative",
    });
  }

  return insights;
}

export interface GlobalInsightInput {
  profileId: string;
  niche: string;
  narrators: Array<{
    id: string;
    name: string;
    sex: string;
    ageRange: string;
    maritalStatus: string;
    hasChildren: boolean;
    hypotheses: Array<{
      dimension: string;
      value: string;
      status: string;
      usageCount: number;
      winCount: number;
      confidence: number;
    }>;
  }>;
}

export interface GeneratedGlobalInsight {
  profileId: string;
  niche: string;
  title: string;
  body: string;
  dimension: string;
  confidence: number;
  sampleSize: number;
  narratorFilter: string | null;
  impact: "positive" | "negative" | "neutral";
}

export function generateGlobalInsights(
  input: GlobalInsightInput
): GeneratedGlobalInsight[] {
  const insights: GeneratedGlobalInsight[] = [];
  const MIN_SAMPLE = 3;
  const MIN_NARRATORS = 2;

  // Group winning hypotheses by dimension+value across narrators
  const winsByDimValue: Record<
    string,
    { narratorIds: string[]; totalUsage: number; totalWins: number; confidence: number }
  > = {};

  for (const narrator of input.narrators) {
    for (const h of narrator.hypotheses) {
      if (h.status !== "winner" || h.usageCount < MIN_SAMPLE) continue;
      const key = `${h.dimension}::${h.value}`;
      if (!winsByDimValue[key]) {
        winsByDimValue[key] = { narratorIds: [], totalUsage: 0, totalWins: 0, confidence: 0 };
      }
      winsByDimValue[key].narratorIds.push(narrator.id);
      winsByDimValue[key].totalUsage += h.usageCount;
      winsByDimValue[key].totalWins += h.winCount;
      winsByDimValue[key].confidence = Math.max(winsByDimValue[key].confidence, h.confidence);
    }
  }

  for (const [key, data] of Object.entries(winsByDimValue)) {
    if (data.narratorIds.length < MIN_NARRATORS) continue;

    const [dimension, value] = key.split("::");
    const dimLabel: Record<string, string> = {
      tone: "tom",
      rhythm: "ritmo",
      productStrategy: "estratégia de produto",
      questionType: "tipo de pergunta",
      conflictType: "tipo de conflito",
      openingStyle: "abertura",
      structureType: "estrutura",
    };
    const dim = dimLabel[dimension] ?? dimension;

    insights.push({
      profileId: input.profileId,
      niche: input.niche,
      title: `${dim} "${value}" funciona para múltiplos narradores`,
      body: `No nicho ${input.niche}, ${data.narratorIds.length} narradores distintos obtiveram melhores resultados com ${dim} "${value}". Padrão confirmado em ${data.totalUsage} histórias.`,
      dimension,
      confidence: data.confidence,
      sampleSize: data.totalUsage,
      narratorFilter: null,
      impact: "positive",
    });
  }

  // Check for narrator-profile-specific patterns (e.g. "females with children")
  const profileGroups: Record<string, { narrators: typeof input.narrators[0][]; label: string }> = {};

  for (const narrator of input.narrators) {
    const key = `${narrator.sex}|${narrator.hasChildren ? "children" : "noChildren"}`;
    const label =
      narrator.sex === "female"
        ? narrator.hasChildren
          ? "Narradoras com filhos"
          : "Narradoras sem filhos"
        : narrator.hasChildren
        ? "Narradores com filhos"
        : "Narradores sem filhos";

    if (!profileGroups[key]) profileGroups[key] = { narrators: [], label };
    profileGroups[key].narrators.push(narrator);
  }

  for (const [filter, group] of Object.entries(profileGroups)) {
    if (group.narrators.length < MIN_NARRATORS) continue;

    const groupWins: Record<string, number> = {};
    const groupUsage: Record<string, number> = {};

    for (const narrator of group.narrators) {
      for (const h of narrator.hypotheses) {
        if (h.status !== "winner") continue;
        const key = `${h.dimension}::${h.value}`;
        groupWins[key] = (groupWins[key] ?? 0) + h.winCount;
        groupUsage[key] = (groupUsage[key] ?? 0) + h.usageCount;
      }
    }

    for (const [key, wins] of Object.entries(groupWins)) {
      const usage = groupUsage[key] ?? 0;
      if (usage < MIN_SAMPLE * group.narrators.length) continue;

      const [dimension, value] = key.split("::");
      const confidence = wins / usage;
      if (confidence < 0.6) continue;

      insights.push({
        profileId: input.profileId,
        niche: input.niche,
        title: `${group.label} convertem melhor com "${value}"`,
        body: `Padrão detectado: ${group.label} no nicho ${input.niche} obtêm resultados consistentemente superiores usando "${value}". Confiança: ${Math.round(confidence * 100)}%.`,
        dimension,
        confidence,
        sampleSize: usage,
        narratorFilter: filter,
        impact: "positive",
      });
    }
  }

  return insights;
}
