export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildNarrativeStaircase,
  buildNarrativeLLM,
  type BuiltNarrative,
  type NarratorFilter,
  type ProductStrategy,
  type StoredProductAnalysis,
  type StoryDebugData,
} from "@/lib/llm/narrative-engine";
import type { VoiceToneExperiment, VoiceToneValue } from "@/lib/llm/pipeline-types";
import type { LlmProviderConfig } from "@/lib/llm/types";
import { computeSimilarityMatrix, type BatchNarrative } from "@/lib/llm/narrative-batch";
import { validateCoherence } from "@/lib/products/coherence-validator";
import { buildUniverseFromStoredAnalysis } from "@/lib/llm/product-intelligence-engine";

type NarratorRow = Awaited<ReturnType<typeof fetchNarrator>>;

async function fetchNarrator(id: string, profileId: string) {
  return prisma.narrator.findFirst({
    where: { id, profileId },
    include: {
      hypotheses: { where: { status: { in: ["winner", "testing"] } } },
      insights: { orderBy: { confidence: "desc" }, take: 10 },
    },
  });
}

function safeParseJson(s: string): string[] {
  try { return JSON.parse(s) as string[]; } catch { return []; }
}

async function fetchStoredAnalysis(productId: string, profileId: string): Promise<{
  analysis: StoredProductAnalysis;
  productName: string;
  productUrl: string;
} | null> {
  const product = await prisma.product.findFirst({
    where: { id: productId, profileId },
    include: { analysis: true },
  });
  if (!product || !product.analysis) return null;
  return {
    analysis: {
      detectedCategory: product.analysis.detectedCategory,
      categoryLabel:    product.analysis.categoryLabel,
      confidence:       product.analysis.confidence,
      scenarios:        safeParseJson(product.analysis.scenarios),
      pains:            safeParseJson(product.analysis.pains),
      benefits:         safeParseJson(product.analysis.benefits),
      usageOccasions:   safeParseJson(product.analysis.usageOccasions),
      bridgeTopics:     safeParseJson(product.analysis.bridgeTopics),
      restrictions:     safeParseJson(product.analysis.restrictions),
    },
    productName: product.name,
    productUrl:  product.affiliateUrl || product.originalUrl,
  };
}

function buildFilter(narrator: NonNullable<NarratorRow>): NarratorFilter {
  return {
    sex: narrator.sex,
    ageRange: narrator.ageRange,
    maritalStatus: narrator.maritalStatus,
    hasChildren: narrator.hasChildren,
    livesAlone: narrator.livesAlone,
  };
}

function buildHypotheses(narrator: NonNullable<NarratorRow>) {
  return narrator.hypotheses
    .filter((h) => h.status === "winner")
    .map((h) => ({ dimension: h.dimension, value: h.value }));
}

function generateOne(
  narrator: NonNullable<NarratorRow>,
  productName: string,
  productUrl: string,
  strategy?: ProductStrategy,
  seed?: number,
  storedAnalysis?: StoredProductAnalysis,
): BuiltNarrative & { id: string; narratorId: string; narratorName: string } {
  const filter = buildFilter(narrator);
  const hypotheses = buildHypotheses(narrator);
  const s = seed ?? Date.now();
  return {
    ...buildNarrativeStaircase(
      productName,
      productUrl,
      s,
      undefined,
      undefined,
      undefined,
      filter,
      strategy,
      hypotheses,
      storedAnalysis,
    ),
    id: `lab-${s}`,
    narratorId: narrator.id,
    narratorName: narrator.name,
  };
}

/** Generate with coherence retry — up to 3 attempts for contextual/hybrid */
function generateWithCoherence(
  narrator: NonNullable<NarratorRow>,
  productName: string,
  productUrl: string,
  strategy?: ProductStrategy,
  seed?: number,
  storedAnalysis?: StoredProductAnalysis,
  idx = 0,
): BuiltNarrative & { id: string; narratorId: string; narratorName: string; coherenceViolations?: string[] } {
  const baseSeed = (seed ?? Date.now()) + idx * 137;
  let narrative = generateOne(narrator, productName, productUrl, strategy, baseSeed, storedAnalysis);

  if (storedAnalysis && strategy && strategy !== "clickbait") {
    const universe = buildUniverseFromStoredAnalysis(storedAnalysis);
    let coherence = validateCoherence(narrative.posts, universe, strategy);

    // Retry up to 2 more times with different seeds
    for (let attempt = 1; attempt < 3 && !coherence.valid; attempt++) {
      narrative = generateOne(narrator, productName, productUrl, strategy, baseSeed + attempt * 997, storedAnalysis);
      coherence = validateCoherence(narrative.posts, universe, strategy);
    }

    if (!coherence.valid) {
      return { ...narrative, id: `lab-${baseSeed}-${idx}`, coherenceViolations: coherence.violations };
    }
  }

  return { ...narrative, id: `lab-${baseSeed}-${idx}` };
}

function generateN(
  narrator: NonNullable<NarratorRow>,
  productName: string,
  productUrl: string,
  n: number,
  strategy?: ProductStrategy,
  baseSeed?: number,
  storedAnalysis?: StoredProductAnalysis,
) {
  const seed = baseSeed ?? Date.now();
  return Array.from({ length: n }, (_, i) =>
    generateWithCoherence(narrator, productName, productUrl, strategy, seed, storedAnalysis, i)
  );
}

type LabNarrative = BuiltNarrative & {
  id: string;
  narratorId: string;
  narratorName: string;
  isSimulated?: boolean;
  coherenceViolations?: string[];
  pipelineDebug?: StoryDebugData;
};

async function generateOneLLM(
  narrator: NonNullable<NarratorRow>,
  productName: string,
  productUrl: string,
  llmConfig: LlmProviderConfig | null,
  strategy?: ProductStrategy,
  seed?: number,
  storedAnalysis?: StoredProductAnalysis,
  voiceExperiment?: VoiceToneExperiment,
): Promise<LabNarrative> {
  const s = seed ?? Date.now();
  const filter = buildFilter(narrator);
  const narratorData = {
    name:          narrator.name,
    sex:           narrator.sex,
    ageRange:      narrator.ageRange,
    maritalStatus: narrator.maritalStatus,
    hasChildren:   narrator.hasChildren,
    livesAlone:    narrator.livesAlone,
  };
  const built = await buildNarrativeLLM(
    productName, productUrl, s, filter, strategy, storedAnalysis, llmConfig, narratorData, voiceExperiment,
  );
  return {
    ...built,
    id: `lab-llm-${s}`,
    narratorId: narrator.id,
    narratorName: narrator.name,
  };
}

async function generateNLLM(
  narrator: NonNullable<NarratorRow>,
  productName: string,
  productUrl: string,
  n: number,
  llmConfig: LlmProviderConfig | null,
  strategy?: ProductStrategy,
  baseSeed?: number,
  storedAnalysis?: StoredProductAnalysis,
): Promise<LabNarrative[]> {
  const seed = baseSeed ?? Date.now();
  const cap = Math.min(n, 5);

  // Groq free tier: 12k TPM — run sequentially to avoid rate limit
  if (llmConfig?.provider === "groq") {
    const results: LabNarrative[] = [];
    for (let i = 0; i < cap; i++) {
      results.push(
        await generateOneLLM(narrator, productName, productUrl, llmConfig, strategy, seed + i * 137, storedAnalysis),
      );
    }
    return results;
  }

  return Promise.all(
    Array.from({ length: cap }, (_, i) =>
      generateOneLLM(narrator, productName, productUrl, llmConfig, strategy, seed + i * 137, storedAnalysis),
    ),
  );
}

function toSimilarityShape(n: BuiltNarrative, idx: number): BatchNarrative {
  return {
    id: `lab-${idx}`,
    theme: n.family,
    role: n.role,
    emotion: n.emotion,
    conflictObject: n.conflictObject,
    sceneMoment: n.sceneMoment,
    moralQuestion: n.moralQuestion,
    family: n.family,
    setting: n.setting,
    twist: n.twist,
    hook: n.hook,
    narrativeSummary: n.narrativeSummary,
    posts: n.posts,
  };
}

function computeDiversity(narratives: BuiltNarrative[]) {
  const tally = <T extends string>(arr: T[]) =>
    arr.reduce((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {} as Record<string, number>);
  return {
    emotions:   tally(narratives.map((n) => n.emotion)),
    rhythms:    tally(narratives.map((n) => n.rhythm)),
    strategies: tally(narratives.map((n) => n.productStrategy)),
    structures: tally(narratives.map((n) => n.structureType)),
    openings:   tally(narratives.map((n) => n.openingStyle)),
    conflicts:  tally(narratives.map((n) => n.conflictType)),
  };
}

function buildEntityExplanation(
  narrator: NonNullable<NarratorRow>,
  narrative: BuiltNarrative,
  objective: string,
  productInfo?: { name: string; category?: string },
) {
  const winners = narrator.hypotheses.filter((h) => h.status === "winner");
  return {
    narrator: narrator.name,
    hypothesesActive: winners.map((h) => `${h.dimension}: ${h.value}`),
    structure: narrative.structureType,
    conflict: narrative.conflictType,
    strategy: narrative.productStrategy,
    tone: narrative.tone,
    rhythm: narrative.rhythm,
    objective,
    product: productInfo,
    reasoning:
      winners.length > 0
        ? `Aplicando ${winners.length} hipótese${winners.length > 1 ? "s" : ""} vencedora${winners.length > 1 ? "s" : ""}: ${winners.map((h) => h.value).join(", ")}. Nenhum resultado é registrado no sandbox.`
        : "Sem hipóteses vencedoras confirmadas ainda. Usando parâmetros padrão do motor narrativo. Nada gerado aqui é salvo.",
  };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profileId = session.user.profile.id;

  const body = (await req.json()) as {
    mode: "single" | "benchmark" | "compare" | "strategy" | "exploration";
    narratorId?: string;
    narratorIds?: string[];
    productName?: string;
    productUrl?: string;
    productId?: string;
    count?: number;
  };

  const { mode } = body;

  // Fetch LLM config — determines whether generation uses real LLM or staircase fallback
  const llmConfigRow = await prisma.llmConfig.findUnique({ where: { profileId } });
  const llmConfig: LlmProviderConfig | null =
    llmConfigRow && llmConfigRow.provider !== "simulated"
      ? {
          provider: llmConfigRow.provider as LlmProviderConfig["provider"],
          apiKey:   llmConfigRow.apiKey   ?? undefined,
          model:    llmConfigRow.model    ?? undefined,
          baseUrl:  llmConfigRow.baseUrl  ?? undefined,
        }
      : null;

  // Resolve product — DB analysis preferred over free text
  let productName = body.productName ?? "";
  let productUrl  = body.productUrl  ?? "";
  let storedAnalysis: StoredProductAnalysis | undefined;

  if (body.productId) {
    const stored = await fetchStoredAnalysis(body.productId, profileId);
    if (stored) {
      productName    = stored.productName;
      productUrl     = stored.productUrl;
      storedAnalysis = stored.analysis;
    }
  }

  if (!productName.trim() && !productUrl.trim()) {
    return NextResponse.json({ error: "Produto não informado" }, { status: 400 });
  }

  const productInfo = storedAnalysis
    ? { name: productName, category: storedAnalysis.categoryLabel }
    : undefined;

  try {
    // ── SINGLE ───────────────────────────────────────────────────────────────
    if (mode === "single") {
      const narrator = await fetchNarrator(body.narratorId ?? "", profileId);
      if (!narrator) return NextResponse.json({ error: "Narrador não encontrado" }, { status: 404 });
      const count = Math.max(1, Math.min(body.count ?? 1, 10));
      const narratives = llmConfig
        ? await generateNLLM(narrator, productName, productUrl, count, llmConfig, undefined, undefined, storedAnalysis)
        : generateN(narrator, productName, productUrl, count, undefined, undefined, storedAnalysis);
      return NextResponse.json({
        narratives,
        isLLM: !!llmConfig,
        entityExplanation: buildEntityExplanation(narrator, narratives[0], "explorar combinações livres", productInfo),
      });
    }

    // ── BENCHMARK ────────────────────────────────────────────────────────────
    if (mode === "benchmark") {
      const narrator = await fetchNarrator(body.narratorId ?? "", profileId);
      if (!narrator) return NextResponse.json({ error: "Narrador não encontrado" }, { status: 404 });
      const count = llmConfig
        ? 5
        : Math.max(10, Math.min(body.count ?? 10, 50));
      const narratives = llmConfig
        ? await generateNLLM(narrator, productName, productUrl, count, llmConfig, undefined, undefined, storedAnalysis)
        : generateN(narrator, productName, productUrl, count, undefined, undefined, storedAnalysis);
      const shapes = narratives.map((n, i) => toSimilarityShape(n, i));
      const matrix = computeSimilarityMatrix(shapes);
      const scores = matrix.flat().filter((v) => v > 0);
      const avgSim = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return NextResponse.json({
        narratives,
        isLLM: !!llmConfig,
        benchmark: {
          total: count,
          avgSimilarity: Math.round(avgSim * 100),
          diversity: computeDiversity(narratives),
          similarityMatrix: matrix,
        },
        entityExplanation: buildEntityExplanation(narrator, narratives[0], `analisar diversidade em ${count} narrativas`, productInfo),
      });
    }

    // ── COMPARE ──────────────────────────────────────────────────────────────
    if (mode === "compare") {
      const ids = (body.narratorIds ?? []).slice(0, 5);
      const seed = Date.now();
      const rows = await Promise.all(
        ids.map(async (id, i) => {
          const narrator = await fetchNarrator(id, profileId);
          if (!narrator) return null;
          if (llmConfig) {
            const [narrative] = await generateNLLM(narrator, productName, productUrl, 1, llmConfig, undefined, seed + i * 1000, storedAnalysis);
            return narrative;
          }
          const [narrative] = generateN(narrator, productName, productUrl, 1, undefined, seed + i * 1000, storedAnalysis);
          return narrative;
        })
      );
      return NextResponse.json({ narratives: rows.filter(Boolean), isLLM: !!llmConfig });
    }

    // ── STRATEGY ─────────────────────────────────────────────────────────────
    if (mode === "strategy") {
      const narrator = await fetchNarrator(body.narratorId ?? "", profileId);
      if (!narrator) return NextResponse.json({ error: "Narrador não encontrado" }, { status: 404 });
      const strategies: ProductStrategy[] = ["clickbait", "contextual", "hybrid"];
      const seed = Date.now();
      let narratives: LabNarrative[];
      if (llmConfig) {
        narratives = await Promise.all(
          strategies.map((s, i) =>
            generateOneLLM(narrator, productName, productUrl, llmConfig, s, seed + i * 1000, storedAnalysis)
              .then((n) => ({ ...n, id: `lab-${s}` })),
          ),
        );
      } else {
        narratives = strategies.map((s, i) => ({
          ...generateWithCoherence(narrator, productName, productUrl, s, seed + i * 1000, storedAnalysis),
          id: `lab-${s}`,
        }));
      }
      return NextResponse.json({
        narratives,
        isLLM: !!llmConfig,
        entityExplanation: buildEntityExplanation(narrator, narratives[0], "comparar estratégias de inserção de produto", productInfo),
      });
    }
    // ── EXPLORATION ──────────────────────────────────────────────────────────
    if (mode === "exploration") {
      if (!llmConfig) {
        return NextResponse.json({ error: "Modo exploração requer LLM configurado" }, { status: 400 });
      }
      const narrator = await fetchNarrator(body.narratorId ?? "", profileId);
      if (!narrator) return NextResponse.json({ error: "Narrador não encontrado" }, { status: 404 });

      const seed = Date.now();
      const toneValues: VoiceToneValue[] = ["control", "leve", "direta", "emocional"];

      let narratives: LabNarrative[];
      // Groq: sequential to avoid rate limits; others: parallel
      if (llmConfig.provider === "groq") {
        narratives = [];
        for (const toneValue of toneValues) {
          const experiment: VoiceToneExperiment = { dimension: "tone", value: toneValue };
          narratives.push(
            await generateOneLLM(narrator, productName, productUrl, llmConfig, undefined, seed, storedAnalysis, experiment)
              .then(n => ({ ...n, id: `lab-exploration-${toneValue}` })),
          );
        }
      } else {
        narratives = await Promise.all(
          toneValues.map(toneValue => {
            const experiment: VoiceToneExperiment = { dimension: "tone", value: toneValue };
            return generateOneLLM(narrator, productName, productUrl, llmConfig, undefined, seed, storedAnalysis, experiment)
              .then(n => ({ ...n, id: `lab-exploration-${toneValue}` }));
          }),
        );
      }

      return NextResponse.json({
        narratives,
        isLLM: true,
        experimentSeed: seed,
        entityExplanation: buildEntityExplanation(narrator, narratives[0], "comparar variantes de voz — tone V0", productInfo),
      });
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Laboratorio] LLM error:", message);
    return NextResponse.json(
      { error: `Erro ao gerar narrativa: ${message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
}
