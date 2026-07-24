import { prisma } from "@/lib/db";
import { decryptThreadsToken } from "@/lib/integrations/threads/crypto";
import { getThreadInsights } from "@/lib/integrations/threads/client";

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const INSIGHT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_EVALUATION_AGE_MS = 6 * 60 * 60 * 1000;
const MIN_VIEWS = 50;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function refreshTrendTotals(trendId: string) {
  const publications = await prisma.publication.findMany({
    where: { trendId, status: "published" },
    select: { impressions: true, clicks: true, conversions: true, revenueBrl: true },
  });
  await prisma.trend.update({
    where: { id: trendId },
    data: {
      totalImpressions: publications.reduce((sum, item) => sum + (item.impressions ?? 0), 0),
      totalClicks: publications.reduce((sum, item) => sum + (item.clicks ?? 0), 0),
      totalConversions: publications.reduce((sum, item) => sum + (item.conversions ?? 0), 0),
      totalRevenueBrl: publications.reduce((sum, item) => sum + (item.revenueBrl ?? 0), 0),
    },
  });
}

async function evaluateTrend(trendId: string, profileId: string) {
  const trend = await prisma.trend.findFirst({
    where: {
      id: trendId,
      metricsEvaluatedAt: null,
      publishedAt: { lte: new Date(Date.now() - MIN_EVALUATION_AGE_MS) },
      totalImpressions: { gte: MIN_VIEWS },
    },
    include: {
      campaign: { select: { socialAccountId: true } },
      publications: { select: { impressions: true, likes: true, replies: true, reposts: true, quotes: true, shares: true } },
    },
  });
  if (!trend) return;

  const comparison = await prisma.trend.findMany({
    where: {
      campaign: { profileId, socialAccountId: trend.campaign.socialAccountId },
      status: "published",
      totalImpressions: { gte: MIN_VIEWS },
    },
    include: {
      publications: { select: { impressions: true, likes: true, replies: true, reposts: true, quotes: true, shares: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
  if (comparison.length < 3) return;

  const engagementRate = (item: { publications: Array<{ impressions: number | null; likes: number | null; replies: number | null; reposts: number | null; quotes: number | null; shares: number | null }> }) => {
    const views = item.publications.reduce((sum, publication) => sum + (publication.impressions ?? 0), 0);
    const engagement = item.publications.reduce(
      (sum, publication) => sum + (publication.likes ?? 0) + (publication.replies ?? 0) +
        (publication.reposts ?? 0) + (publication.quotes ?? 0) + (publication.shares ?? 0),
      0,
    );
    return views > 0 ? engagement / views : 0;
  };

  const rate = engagementRate(trend);
  const benchmark = median(comparison.map(engagementRate));
  const isWin = rate > benchmark;
  const event = await prisma.campaignEvent.findFirst({
    where: { campaignId: trend.campaignId, type: "generated", metadata: { contains: trend.id } },
    orderBy: { createdAt: "desc" },
  });
  let metadata: Record<string, unknown> = {};
  try { metadata = event?.metadata ? JSON.parse(event.metadata) as Record<string, unknown> : {}; } catch { /* malformed legacy metadata */ }

  const elements = [
    ["family", metadata.family], ["emotion", metadata.emotion], ["role", metadata.role],
    ["character", metadata.character], ["conflictObject", metadata.conflictObject],
    ["sceneMoment", metadata.sceneMoment], ["tone", trend.tone], ["rhythm", trend.rhythm],
    ["productStrategy", trend.productStrategy], ["questionType", trend.questionType],
    ["openingStyle", trend.openingStyle], ["conflictType", trend.conflictType],
    ["structureType", trend.structureType],
  ].filter((item): item is [string, string] => typeof item[1] === "string" && item[1].length > 0);

  await prisma.$transaction([
    ...elements.map(([type, value]) => prisma.narrativePattern.updateMany({
      where: { profileId, socialAccountId: trend.campaign.socialAccountId, type, value },
      data: {
        evaluatedCount: { increment: 1 },
        ...(isWin ? { winCount: { increment: 1 } } : {}),
        totalCtr: { increment: rate * 100 },
      },
    })),
    prisma.trend.update({ where: { id: trend.id }, data: { metricsEvaluatedAt: new Date() } }),
  ]);
}

export async function runThreadsInsightsSync(take = 25) {
  const now = new Date();
  const publications = await prisma.publication.findMany({
    where: {
      status: "published",
      externalId: { not: null },
      publishedAt: { gte: new Date(now.getTime() - INSIGHT_WINDOW_MS) },
      OR: [{ metricsSyncedAt: null }, { metricsSyncedAt: { lte: new Date(now.getTime() - SYNC_INTERVAL_MS) } }],
      campaign: {
        targetNetwork: "threads",
        socialAccount: { isMock: false, status: "active", accessToken: { not: null } },
      },
    },
    include: { campaign: { include: { socialAccount: true } } },
    orderBy: [{ metricsSyncedAt: "asc" }, { publishedAt: "desc" }],
    take,
  });

  const touchedTrends = new Map<string, string>();
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const publication of publications) {
    const account = publication.campaign.socialAccount;
    if (!account?.accessToken || !publication.externalId) continue;
    try {
      const insights = await getThreadInsights(publication.externalId, decryptThreadsToken(account.accessToken));
      await prisma.publication.update({
        where: { id: publication.id },
        data: {
          impressions: insights.views,
          likes: insights.likes,
          replies: insights.replies,
          reposts: insights.reposts,
          quotes: insights.quotes,
          shares: insights.shares,
          metricsSyncedAt: now,
          metricsLastError: null,
        },
      });
      const capturedDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      await prisma.publicationMetricSnapshot.upsert({
        where: { publicationId_capturedDate: { publicationId: publication.id, capturedDate } },
        update: {
          capturedAt: now,
          impressions: insights.views,
          likes: insights.likes,
          replies: insights.replies,
          reposts: insights.reposts,
          quotes: insights.quotes,
          shares: insights.shares,
        },
        create: {
          publicationId: publication.id,
          capturedDate,
          capturedAt: now,
          impressions: insights.views,
          likes: insights.likes,
          replies: insights.replies,
          reposts: insights.reposts,
          quotes: insights.quotes,
          shares: insights.shares,
        },
      });
      if (publication.trendId) touchedTrends.set(publication.trendId, publication.campaign.profileId);
      results.push({ id: publication.id, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Falha ao sincronizar insights";
      await prisma.publication.update({
        where: { id: publication.id },
        data: { metricsSyncedAt: now, metricsLastError: message },
      });
      results.push({ id: publication.id, ok: false, error: message });
    }
  }

  for (const [trendId, profileId] of touchedTrends) {
    await refreshTrendTotals(trendId);
    await evaluateTrend(trendId, profileId);
  }
  return results;
}
