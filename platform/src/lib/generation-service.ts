import { prisma } from "./db";
import { getLlmProvider } from "./llm";
import type { LlmProviderConfig, NarrativeInput, NarratorContext } from "./llm/types";
import { selectHypothesisValue } from "./narrators/hypothesis-engine";

type HypothesisDimension = "tone" | "rhythm" | "productStrategy" | "questionType" | "conflictType" | "openingStyle" | "structureType";
const DIMENSIONS: HypothesisDimension[] = ["tone", "rhythm", "productStrategy", "questionType", "conflictType", "openingStyle", "structureType"];

function normalizeProductStrategy(value: string): "clickbait" | "contextual" | "hybrid" {
  if (value === "híbrida" || value === "hibrida" || value === "hybrid") return "hybrid";
  if (value === "clickbait") return "clickbait";
  if (value === "contextual") return "contextual";
  return "hybrid";
}

export async function updateNarrativePatternWins(
  trendId: string,
  profileId: string,
  ctr: number,
  avgCtr: number
): Promise<void> {
  if (ctr <= avgCtr) return;

  // Find the CampaignEvent with generation metadata for this trend
  const events = await prisma.campaignEvent.findMany({
    where: {
      campaign: { profileId },
      type: "generated",
      metadata: { contains: trendId },
    },
  });

  for (const ev of events) {
    try {
      if (!ev.metadata) continue;
      const m = JSON.parse(ev.metadata) as { trendId?: string; family?: string; emotion?: string; character?: string; narratorId?: string };
      if (m.trendId !== trendId) continue;

      const elements = [
        { type: "family", value: m.family },
        { type: "emotion", value: m.emotion },
        { type: "character", value: m.character },
      ].filter((e) => e.value);

      for (const el of elements) {
        await prisma.narrativePattern.updateMany({
          where: { profileId, type: el.type, value: el.value! },
          data: { winCount: { increment: 1 }, totalCtr: { increment: ctr } },
        });
      }

      // Also update narrator hypothesis win counts if there's a narrator
      if (m.narratorId) {
        const trend = await prisma.trend.findUnique({
          where: { id: trendId },
          select: { tone: true, rhythm: true, productStrategy: true, questionType: true, conflictType: true, openingStyle: true, structureType: true, narratorId: true },
        });
        if (trend?.narratorId) {
          const dimensionValues = [
            { dimension: "tone",            value: trend.tone },
            { dimension: "rhythm",          value: trend.rhythm },
            { dimension: "productStrategy", value: trend.productStrategy },
            { dimension: "questionType",    value: trend.questionType },
            { dimension: "conflictType",    value: trend.conflictType },
            { dimension: "openingStyle",    value: trend.openingStyle },
            { dimension: "structureType",   value: trend.structureType },
          ].filter((d) => d.value);

          for (const dv of dimensionValues) {
            await prisma.narratorHypothesis.updateMany({
              where: {
                narratorId: trend.narratorId,
                dimension: dv.dimension,
                value: dv.value!,
              },
              data: {
                winCount: { increment: 1 },
                totalCtr: { increment: ctr },
                confidence: { set: 0 }, // will be recomputed on next insight pass
              },
            });
          }

          await prisma.narrator.update({
            where: { id: trend.narratorId },
            data: { totalClicks: { increment: 1 } },
          });
        }
      }
    } catch { /* ignore malformed metadata */ }
  }
}

async function updateJob(
  id: string,
  data: {
    status: string;
    statusLabel: string;
    progress: number;
    trendId?: string;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  }
) {
  await prisma.generationJob.update({ where: { id }, data });
}

export async function processGenerationJob(jobId: string): Promise<void> {
  try {
    await updateJob(jobId, {
      status: "analyzing",
      statusLabel: "Analisando produto...",
      progress: 10,
      startedAt: new Date(),
    });

    const job = await prisma.generationJob.findUnique({
      where: { id: jobId },
      include: {
        campaign: {
          include: {
            profile: true,
            narrator: {
              include: {
                hypotheses: true,
              },
            },
          },
        },
      },
    });

    if (!job) throw new Error("Job não encontrado");

    const { campaign } = job;
    const profileId = campaign.profileId;

    // Fetch LLM config
    const llmConfigRow = await prisma.llmConfig.findUnique({ where: { profileId } });
    const llmConfig: LlmProviderConfig | null = llmConfigRow
      ? {
          provider: llmConfigRow.provider,
          apiKey: llmConfigRow.apiKey || undefined,
          model: llmConfigRow.model || undefined,
          baseUrl: llmConfigRow.baseUrl || undefined,
        }
      : null;

    // Fetch learnings for context
    const learnings = await prisma.learning.findMany({
      where: { profileId, state: "active" },
      orderBy: { recordedAt: "desc" },
      take: 10,
    });

    // Fetch top narrative patterns
    const patterns = await prisma.narrativePattern.findMany({
      where: { profileId },
      orderBy: [{ winCount: "desc" }, { usageCount: "desc" }],
      take: 15,
    });

    await updateJob(jobId, {
      status: "planning",
      statusLabel: "Planejando narrativa...",
      progress: 30,
    });

    // ─── Narrator context ───────────────────────────────────────────
    let narratorContext: NarratorContext | undefined;
    let activeHypotheses: Array<{ dimension: string; value: string }> | undefined;
    const narrator = campaign.narrator;

    if (narrator) {
      narratorContext = {
        id: narrator.id,
        name: narrator.name,
        sex: narrator.sex as "female" | "male",
        ageRange: narrator.ageRange,
        maritalStatus: narrator.maritalStatus,
        hasChildren: narrator.hasChildren,
        livesAlone: narrator.livesAlone,
      };

      // Filter hypotheses for this niche
      const niche = campaign.profile?.niche ?? "";
      const nicheHypotheses = narrator.hypotheses.filter((h) => h.niche === niche);
      const allHypotheses = nicheHypotheses.length > 0 ? nicheHypotheses : narrator.hypotheses;

      // Select one value per dimension (exploration-first)
      activeHypotheses = DIMENSIONS.map((dim) => ({
        dimension: dim,
        value: selectHypothesisValue(allHypotheses, dim),
      }));

      // Increment usage counts for selected hypotheses
      for (const h of activeHypotheses) {
        const normalizedValue = h.dimension === "productStrategy"
          ? normalizeProductStrategy(h.value)
          : h.value;

        await prisma.narratorHypothesis.updateMany({
          where: {
            narratorId: narrator.id,
            dimension: h.dimension,
            value: normalizedValue !== h.value ? { in: [h.value, normalizedValue] } : h.value,
          },
          data: { usageCount: { increment: 1 } },
        });
      }

      // Update narrator narrative count
      await prisma.narrator.update({
        where: { id: narrator.id },
        data: { totalNarratives: { increment: 1 } },
      });
    }
    // ────────────────────────────────────────────────────────────────

    const input: NarrativeInput = {
      productName: campaign.productName,
      productUrl: campaign.productUrl,
      marketplace: campaign.marketplace,
      targetNetwork: campaign.targetNetwork,
      niche: campaign.profile?.niche,
      campaignId: campaign.id,
      learnings: learnings.map((l) => l.summary),
      topPatterns: patterns.map((p) => ({
        type: p.type,
        value: p.value,
        winCount: p.winCount,
        usageCount: p.usageCount,
      })),
      narrator: narratorContext,
      activeHypotheses,
    };

    const provider = getLlmProvider(llmConfig);

    await updateJob(jobId, {
      status: "writing",
      statusLabel: `Gerando com ${provider.name === "simulated" ? "motor narrativo" : provider.name}...`,
      progress: 55,
    });

    const output = await provider.generateNarrative(input);

    await updateJob(jobId, {
      status: "writing",
      statusLabel: "Salvando narrativa...",
      progress: 75,
    });

    // Normalize product strategy from output
    const productStrategy = normalizeProductStrategy(output.productStrategy ?? "hybrid");

    // Save trend with experiment dimension data
    const trend = await prisma.trend.create({
      data: {
        campaignId: campaign.id,
        narratorId: narrator?.id ?? undefined,
        format: output.format,
        hook: output.hook,
        narrativeSummary: output.narrativeSummary,
        postsCount: output.posts.length,
        status: "draft",
        qualityScore: 0.8,
        // Experiment dimensions
        productStrategy,
        tone: output.tone ?? undefined,
        rhythm: output.rhythm ?? undefined,
        structureType: output.structureType ?? undefined,
        openingStyle: output.openingStyle ?? undefined,
        conflictType: output.conflictType ?? undefined,
        questionType: output.questionType ?? undefined,
      },
    });

    for (const p of output.posts) {
      await prisma.trendPost.create({
        data: {
          trendId: trend.id,
          position: p.position,
          content: p.content,
          hasMedia: p.hasMedia,
        },
      });
    }

    await updateJob(jobId, {
      status: "reviewing",
      statusLabel: "Registrando padrões narrativos...",
      progress: 90,
    });

    // Record narrative patterns used (cinematic fields take priority)
    const elements = [
      { type: "family", value: output.family },
      { type: "emotion", value: output.emotion },
      { type: "role", value: output.role ?? output.character },
      { type: "character", value: output.character },
      { type: "setting", value: output.setting },
      { type: "conflictObject", value: output.conflictObject ?? output.object },
      { type: "sceneMoment", value: output.sceneMoment },
      { type: "moralQuestion", value: output.moralQuestion },
      // Narrator experiment dimensions also go to global patterns library
      { type: "tone", value: output.tone },
      { type: "rhythm", value: output.rhythm },
      { type: "productStrategy", value: productStrategy },
      { type: "questionType", value: output.questionType },
      { type: "openingStyle", value: output.openingStyle },
      { type: "conflictType", value: output.conflictType },
      { type: "structureType", value: output.structureType },
    ].filter((e) => e.value && e.value !== "undefined");

    for (const el of elements) {
      await prisma.narrativePattern.upsert({
        where: { profileId_type_value: { profileId, type: el.type, value: el.value } },
        update: { usageCount: { increment: 1 }, updatedAt: new Date() },
        create: { profileId, type: el.type, value: el.value, usageCount: 1 },
      });
    }

    // Record campaign event
    await prisma.campaignEvent.create({
      data: {
        campaignId: campaign.id,
        type: "generated",
        title: "Nova história gerada",
        description: narrator
          ? `Narrador "${narrator.name}" · Papel "${output.role ?? output.character}" · Emoção "${output.emotion}" · Estratégia "${productStrategy}"`
          : `Papel "${output.role ?? output.character}" · Emoção "${output.emotion}" · Conflito com "${output.conflictObject ?? output.object}"`,
        metadata: JSON.stringify({
          trendId: trend.id,
          provider: provider.name,
          narratorId: narrator?.id,
          family: output.family,
          emotion: output.emotion,
          character: output.character,
          role: output.role,
          conflictObject: output.conflictObject,
          sceneMoment: output.sceneMoment,
          productStrategy,
          tone: output.tone,
          rhythm: output.rhythm,
        }),
      },
    });

    // Complete the job
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        statusLabel: "Narrativa gerada com sucesso",
        progress: 100,
        trendId: trend.id,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("processGenerationJob error:", message);
    await prisma.generationJob
      .update({
        where: { id: jobId },
        data: {
          status: "failed",
          statusLabel: "Falha na geração",
          error: message,
          completedAt: new Date(),
        },
      })
      .catch(() => undefined);
  }
}
