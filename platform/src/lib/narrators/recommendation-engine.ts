import { prisma } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface RecommendationEvidence {
  avgCtr: number;
  avgRetention: number;
  avgConversions: number;
  winnerDimensions: Array<{ dimension: string; value: string; confidence: number; uplift: number }>;
  loserDimensions: Array<{ dimension: string; value: string; confidence: number }>;
  sampleSize: number;
  confidence: number;
  narratorFilter?: string;
}

export interface SuggestedProfile {
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
  rationale: string;
}

// ─────────────────────────────────────────────────────────────────
// Wilson lower bound for binomial confidence interval
// (same formula as in hypothesis-engine.ts)
// ─────────────────────────────────────────────────────────────────

function wilsonLower(wins: number, trials: number): number {
  if (trials === 0) return 0;
  const z = 1.96;
  const p = wins / trials;
  const denominator = 1 + (z * z) / trials;
  const centre = p + (z * z) / (2 * trials);
  const margin = z * Math.sqrt((p * (1 - p)) / trials + (z * z) / (4 * trials * trials));
  return (centre - margin) / denominator;
}

// ─────────────────────────────────────────────────────────────────
// Detect whether data suggests a new narrator profile would outperform
// ─────────────────────────────────────────────────────────────────

async function detectNewNarratorOpportunity(
  profileId: string,
  niche: string
): Promise<{ shouldRecommend: boolean; evidence: RecommendationEvidence; suggestedProfile: SuggestedProfile } | null> {
  // Get all narrators for this profile
  const narrators = await prisma.narrator.findMany({
    where: { profileId, status: "active" },
    include: {
      hypotheses: { where: { niche } },
      insights: { where: { niche } },
      trends: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { totalClicks: true, totalImpressions: true, totalConversions: true, tone: true, conflictType: true },
      },
    },
  });

  if (narrators.length === 0) return null;

  const bestNarrator = narrators.reduce((best, n) => {
    const bCtr = best.totalImpressions > 0 ? best.totalClicks / best.totalImpressions : 0;
    const nCtr = n.totalImpressions > 0 ? n.totalClicks / n.totalImpressions : 0;
    return nCtr > bCtr ? n : best;
  }, narrators[0]);

  const avgCtr =
    bestNarrator.totalImpressions > 0
      ? (bestNarrator.totalClicks / bestNarrator.totalImpressions) * 100
      : 0;

  const losers = bestNarrator.hypotheses.filter((h) => h.status === "loser");
  const winners = bestNarrator.hypotheses.filter((h) => h.status === "winner");

  // Require minimum sample size and at least one loser (signal of saturation)
  if (bestNarrator.totalNarratives < 20 || losers.length < 2) return null;

  // Confidence based on Wilson bound of win rate
  const confidence = wilsonLower(winners.length, bestNarrator.hypotheses.length);
  if (confidence < 0.6) return null;

  const evidence: RecommendationEvidence = {
    avgCtr,
    avgRetention: 0,
    avgConversions: bestNarrator.totalImpressions > 0
      ? (bestNarrator.totalConversions / bestNarrator.totalImpressions) * 100
      : 0,
    winnerDimensions: winners.map((h) => ({
      dimension: h.dimension,
      value: h.value,
      confidence: h.confidence,
      uplift: h.uplift,
    })),
    loserDimensions: losers.map((h) => ({
      dimension: h.dimension,
      value: h.value,
      confidence: h.confidence,
    })),
    sampleSize: bestNarrator.totalNarratives,
    confidence,
    narratorFilter: `${bestNarrator.sex}|${bestNarrator.ageRange}|${bestNarrator.maritalStatus}`,
  };

  // Suggest the opposite demographic as a contrast profile
  const suggestedProfile: SuggestedProfile = {
    sex: bestNarrator.sex === "female" ? "male" : "female",
    ageRange: bestNarrator.ageRange === "26-35" ? "36-45" : "26-35",
    maritalStatus: bestNarrator.maritalStatus === "married" ? "single" : "married",
    hasChildren: !bestNarrator.hasChildren,
    livesAlone: !bestNarrator.livesAlone,
    rationale: `Os dados de ${bestNarrator.name} (${losers.length} dimensões eliminadas, confiança ${(confidence * 100).toFixed(0)}%) sugerem que outro perfil demográfico pode gerar narrativas com tom e conflito diferentes — expandindo o alcance para um público ainda não testado.`,
  };

  return { shouldRecommend: true, evidence, suggestedProfile };
}

// ─────────────────────────────────────────────────────────────────
// Main: scan profile and create pending recommendations if warranted
// Called after generation jobs complete (async, fire-and-forget)
// ─────────────────────────────────────────────────────────────────

export async function scanAndGenerateRecommendations(
  profileId: string,
  niche: string
): Promise<void> {
  try {
    // Skip if a pending recommendation already exists for this profile+niche
    const existing = await prisma.narratorRecommendation.findFirst({
      where: { profileId, niche, status: "pending" },
    });
    if (existing) return;

    const result = await detectNewNarratorOpportunity(profileId, niche);
    if (!result) return;

    const { evidence, suggestedProfile } = result;

    await prisma.narratorRecommendation.create({
      data: {
        profileId,
        niche,
        type: "create_narrator",
        title: `Criar novo Narrador para expandir alcance no nicho "${niche}"`,
        reasoning: suggestedProfile.rationale,
        evidence: JSON.stringify(evidence),
        suggestedProfile: JSON.stringify(suggestedProfile),
        status: "pending",
        confidence: evidence.confidence,
        sampleSize: evidence.sampleSize,
      },
    });
  } catch {
    // Fire-and-forget: never block the generation pipeline
  }
}

// ─────────────────────────────────────────────────────────────────
// Utility: parse evidence JSON safely
// ─────────────────────────────────────────────────────────────────

export function parseEvidence(json: string): RecommendationEvidence | null {
  try {
    return JSON.parse(json) as RecommendationEvidence;
  } catch {
    return null;
  }
}

export function parseSuggestedProfile(json: string | null): SuggestedProfile | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as SuggestedProfile;
  } catch {
    return null;
  }
}
