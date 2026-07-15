export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ACCOUNT_COOKIE } from "@/lib/account";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const days = parseInt(searchParams.get("days") ?? "7", 10);

  const now = new Date();
  const until = new Date(now.getTime() + days * 86400000);
  const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value ?? null;

  const publications = await prisma.publication.findMany({
    where: {
      campaign: {
        profileId: session.user.profile.id,
        ...(accountId ? { socialAccountId: accountId } : {}),
      },
      status: { in: ["scheduled", "pending"] },
      scheduledAt: { gte: now, lte: until },
    },
    include: {
      campaign: { select: { id: true, name: true, targetNetwork: true, status: true } },
      trend: { select: { id: true, format: true, hook: true, postsCount: true } },
      trendPost: { select: { position: true, content: true, hasMedia: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // Group by trendId → date
  const byTrend: Record<string, {
    trendId: string;
    format: string;
    hook: string;
    postsCount: number;
    campaignName: string;
    targetNetwork: string;
    campaignId: string;
    campaignStatus: string;
    posts: Array<{
      publicationId: string;
      position: number;
      content: string;
      hasMedia: boolean;
      scheduledAt: string;
    }>;
  }> = {};

  for (const pub of publications) {
    if (!pub.trendId || !pub.trend) continue;
    const key = pub.trendId;
    if (!byTrend[key]) {
      byTrend[key] = {
        trendId: pub.trendId,
        format: pub.trend.format,
        hook: pub.trend.hook,
        postsCount: pub.trend.postsCount,
        campaignName: pub.campaign.name,
        campaignId: pub.campaign.id,
        targetNetwork: pub.campaign.targetNetwork,
        campaignStatus: pub.campaign.status,
        posts: [],
      };
    }
    if (pub.trendPost) {
      byTrend[key].posts.push({
        publicationId: pub.id,
        position: pub.trendPost.position,
        content: pub.trendPost.content,
        hasMedia: pub.trendPost.hasMedia,
        scheduledAt: pub.scheduledAt.toISOString(),
      });
    }
  }

  // Sort posts within each trend by position
  for (const t of Object.values(byTrend)) {
    t.posts.sort((a, b) => a.position - b.position);
  }

  const queue = Object.values(byTrend).sort(
    (a, b) =>
      new Date(a.posts[0]?.scheduledAt ?? 0).getTime() -
      new Date(b.posts[0]?.scheduledAt ?? 0).getTime()
  );

  return NextResponse.json({ queue, total: queue.length });
}
