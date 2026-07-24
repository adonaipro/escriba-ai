export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSelectedAccountId } from "@/lib/account";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 86400000);
  const to = toStr ? new Date(toStr) : new Date(Date.now() + 30 * 86400000);
  const accountId = await getSelectedAccountId(session.user.profile.id);

  const publications = await prisma.publication.findMany({
    where: {
      campaign: {
        profileId: session.user.profile.id,
        ...(accountId ? { socialAccountId: accountId } : {}),
      },
      trendId: { not: null },
      trendPostId: { not: null },
      scheduledAt: { gte: from, lte: to },
    },
    include: {
      campaign: { select: { id: true, name: true, productName: true } },
      trend: { select: { id: true, format: true, hook: true } },
      trendPost: { select: { position: true, content: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // Calendar shows one event per narrative/thread, not one event for every reply post.
  const seenTrends = new Set<string>();
  const calendarEntries = publications.filter((publication) => {
    const key = publication.trendId ?? publication.id;
    if (seenTrends.has(key)) return false;
    seenTrends.add(key);
    return true;
  });

  // Group by date (YYYY-MM-DD)
  const grouped: Record<string, typeof publications> = {};
  for (const pub of calendarEntries) {
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(pub.scheduledAt);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(pub);
  }

  return NextResponse.json({ grouped, total: calendarEntries.length });
}
