import { prisma } from "@/lib/db";

export async function getShortLinkMetrics(where: { workspaceId: string; campaignId?: string; socialAccountId?: string }, from?: Date, to?: Date) {
  const clickedAt = from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined;
  const links = await prisma.shortLink.findMany({
    where,
    select: {
      id: true,
      trendId: true,
      campaignId: true,
      socialAccountId: true,
      productId: true,
      trend: { select: { hook: true, totalImpressions: true } },
      clicks: { where: { clickedAt }, select: { isUnique: true, clickedAt: true } },
    },
  });
  const totalClicks = links.reduce((sum, link) => sum + link.clicks.length, 0);
  const uniqueClicks = links.reduce((sum, link) => sum + link.clicks.filter((click) => click.isUnique).length, 0);
  const totalImpressions = links.reduce((sum, link) => sum + (link.trend?.totalImpressions ?? 0), 0);
  const byDay = new Map<string, number>();
  const byHour = new Map<number, number>();
  for (const link of links) for (const click of link.clicks) {
    const day = click.clickedAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    const hour = click.clickedAt.getUTCHours();
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
  }
  const narratives = links.map((link) => ({
    trendId: link.trendId,
    hook: link.trend?.hook ?? "Narrativa",
    clicks: link.clicks.length,
    uniqueClicks: link.clicks.filter((click) => click.isUnique).length,
    impressions: link.trend?.totalImpressions ?? 0,
    ctr: link.trend?.totalImpressions ? (link.clicks.length / link.trend.totalImpressions) * 100 : 0,
  })).sort((a, b) => b.clicks - a.clicks);
  const peakHour = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    totalClicks,
    uniqueClicks,
    totalImpressions,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    peakHour,
    topNarrative: narratives[0] ?? null,
    narratives,
    clicksByDay: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, clicks]) => ({ date, clicks })),
  };
}
