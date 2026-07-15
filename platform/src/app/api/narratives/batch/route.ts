import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildBatchNarratives,
  checkSimilarity,
  computeSimilarityMatrix,
  type BatchNarrative,
} from "@/lib/llm/narrative-batch";

export const runtime = "nodejs";

const BATCH_CAMPAIGN_NAME = "Validação — Narrativa × 10";
const PRODUCT_URL = "https://shopee.com.br/product/mock/tenis-runner-pro";

// ─────────────────────────────────────────────────────────────────
// GET — returns the batch (existing or not-yet-generated marker)
// ─────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;
  const campaign = await prisma.campaign.findFirst({
    where: { profileId, name: BATCH_CAMPAIGN_NAME },
    include: {
      trends: {
        include: { posts: { orderBy: { position: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!campaign || campaign.trends.length < 10) {
    return NextResponse.json({ generated: false, narratives: [] });
  }

  const templates = buildBatchNarratives(PRODUCT_URL);
  const narratives = campaign.trends.map((trend, i) => {
    const tmpl = templates[i] ?? templates[0];
    return {
      trendId: trend.id,
      title: tmpl.theme.toUpperCase(),
      theme: tmpl.theme,
      hook: trend.hook,
      narrativeSummary: trend.narrativeSummary,
      postCount: trend.postsCount,
      elements: {
        role: tmpl.role,
        emotion: tmpl.emotion,
        conflictObject: tmpl.conflictObject,
        sceneMoment: tmpl.sceneMoment,
        moralQuestion: tmpl.moralQuestion,
        family: tmpl.family,
        setting: tmpl.setting,
        twist: tmpl.twist,
      },
      posts: trend.posts.map((p) => ({
        position: p.position,
        content: p.content,
        hasMedia: p.hasMedia,
      })),
    };
  });

  const templates2 = buildBatchNarratives(PRODUCT_URL);
  const matrix = computeSimilarityMatrix(
    narratives.map((n, i) => ({
      ...templates2[i],
      id: n.trendId,
    }))
  );

  const similarityCheck = checkSimilarity(
    narratives.map((n, i) => ({ ...templates2[i], id: n.trendId }))
  );

  return NextResponse.json({
    generated: true,
    campaignId: campaign.id,
    narratives,
    similarityMatrix: matrix,
    similarityCheck,
  });
}

// ─────────────────────────────────────────────────────────────────
// POST — generates (or regenerates) all 10 and saves to DB
// ─────────────────────────────────────────────────────────────────
export async function POST() {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;
  const templates = buildBatchNarratives(PRODUCT_URL);

  const similarityCheck = checkSimilarity(templates);
  if (!similarityCheck.passed) {
    return NextResponse.json(
      {
        error: "Similarity check failed before saving",
        violations: similarityCheck.violations,
      },
      { status: 422 }
    );
  }

  // Upsert validation campaign
  let campaign = await prisma.campaign.findFirst({
    where: { profileId, name: BATCH_CAMPAIGN_NAME },
  });

  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        profileId,
        name: BATCH_CAMPAIGN_NAME,
        productUrl: PRODUCT_URL,
        productName: "Tênis Runner Pro",
        marketplace: "shopee",
        targetNetwork: "threads",
        objective: "validation",
        language: "pt-BR",
        status: "testing",
        mode: "test",
        aiModel: "simulated",
        approvalMode: "manual",
        trendsPerDay: 0,
        postsPerDay: 0,
      },
    });
  } else {
    // Clear existing trends for a fresh run
    await prisma.trend.deleteMany({ where: { campaignId: campaign.id } });
  }

  // Save all 10 narratives
  const saved: ReturnType<typeof buildSavedShape>[] = [];
  for (const tmpl of templates) {
    const trend = await saveTrend(campaign.id, tmpl);
    saved.push(buildSavedShape(trend, tmpl));
  }

  // Log event
  await prisma.campaignEvent.create({
    data: {
      campaignId: campaign.id,
      type: "generated",
      title: "10 narrativas geradas para validação",
      description: `Motor variou: ${templates.map((t) => t.role).join(", ")}`,
      metadata: JSON.stringify({ count: 10, similarityPassed: true }),
    },
  });

  const matrix = computeSimilarityMatrix(templates);

  return NextResponse.json({
    generated: true,
    campaignId: campaign.id,
    narratives: saved,
    similarityMatrix: matrix,
    similarityCheck,
  });
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

async function saveTrend(
  campaignId: string,
  tmpl: BatchNarrative
) {
  const trend = await prisma.trend.create({
    data: {
      campaignId,
      format: "narrative_staircase",
      hook: tmpl.hook,
      narrativeSummary: `${tmpl.theme} · ${tmpl.role} · ${tmpl.emotion}`,
      status: "draft",
      qualityScore: 0.85,
      postsCount: tmpl.posts.length,
      posts: {
        create: tmpl.posts.map((p) => ({
          position: p.position,
          content: p.content,
          hasMedia: p.hasMedia,
        })),
      },
    },
    include: { posts: { orderBy: { position: "asc" } } },
  });
  return trend;
}

function buildSavedShape(
  trend: { id: string; hook: string; narrativeSummary: string; postsCount: number; posts: { position: number; content: string; hasMedia: boolean }[] },
  tmpl: BatchNarrative
) {
  return {
    trendId: trend.id,
    title: tmpl.theme.toUpperCase(),
    theme: tmpl.theme,
    hook: trend.hook,
    narrativeSummary: trend.narrativeSummary,
    postCount: trend.postsCount,
    elements: {
      role: tmpl.role,
      emotion: tmpl.emotion,
      conflictObject: tmpl.conflictObject,
      sceneMoment: tmpl.sceneMoment,
      moralQuestion: tmpl.moralQuestion,
      family: tmpl.family,
      setting: tmpl.setting,
      twist: tmpl.twist,
    },
    posts: trend.posts,
  };
}
