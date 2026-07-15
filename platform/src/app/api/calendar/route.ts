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
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 86400000);
  const to = toStr ? new Date(toStr) : new Date(Date.now() + 30 * 86400000);
  const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value ?? null;

  const publications = await prisma.publication.findMany({
    where: {
      campaign: {
        profileId: session.user.profile.id,
        ...(accountId ? { socialAccountId: accountId } : {}),
      },
      scheduledAt: { gte: from, lte: to },
    },
    include: {
      campaign: { select: { id: true, name: true, productName: true } },
      trend: { select: { id: true, format: true, hook: true } },
      trendPost: { select: { position: true, content: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // Group by date (YYYY-MM-DD)
  const grouped: Record<string, typeof publications> = {};
  for (const pub of publications) {
    const date = pub.scheduledAt.toISOString().split("T")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(pub);
  }

  return NextResponse.json({ grouped, total: publications.length });
}
