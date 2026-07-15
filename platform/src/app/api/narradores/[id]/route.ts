import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildHypothesisSummary, DIMENSION_LABELS } from "@/lib/narrators/hypothesis-engine";
import { describeNarrator } from "@/lib/narrators/names";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────
// GET /api/narradores/[id] — full narrator detail
// ─────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const profileId = session.user.profile.id;

  const narrator = await prisma.narrator.findFirst({
    where: { id, profileId },
    include: {
      hypotheses: { orderBy: [{ status: "asc" }, { usageCount: "desc" }] },
      insights: { orderBy: { createdAt: "desc" } },
      campaigns: {
        select: {
          id: true,
          name: true,
          productName: true,
          status: true,
          _count: { select: { trends: true } },
        },
      },
      trends: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          hook: true,
          productStrategy: true,
          tone: true,
          rhythm: true,
          conflictType: true,
          questionType: true,
          totalClicks: true,
          totalImpressions: true,
          totalConversions: true,
          createdAt: true,
        },
      },
      accountNarrators: {
        include: {
          socialAccount: {
            select: { id: true, network: true, username: true, status: true },
          },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!narrator) {
    return NextResponse.json({ error: "Narrador não encontrado" }, { status: 404 });
  }

  const hypothesisSummary = buildHypothesisSummary(narrator.hypotheses);
  const description = describeNarrator(narrator);

  // Compute per-dimension stats (for display)
  const dimensionStats: Record<string, { winners: string[]; testing: number; losers: number }> = {};
  for (const h of narrator.hypotheses) {
    if (!dimensionStats[h.dimension]) {
      dimensionStats[h.dimension] = { winners: [], testing: 0, losers: 0 };
    }
    if (h.status === "winner") dimensionStats[h.dimension].winners.push(h.value);
    else if (h.status === "testing") dimensionStats[h.dimension].testing++;
    else if (h.status === "loser") dimensionStats[h.dimension].losers++;
  }

  // Product strategy comparison
  const strategyStats = (["clickbait", "contextual", "hybrid"] as const).map((s) => {
    const trends = narrator.trends.filter((t) => t.productStrategy === s);
    const totalImpressions = trends.reduce((sum, t) => sum + t.totalImpressions, 0);
    const totalClicks = trends.reduce((sum, t) => sum + t.totalClicks, 0);
    const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    return { strategy: s, count: trends.length, ctr };
  });

  return NextResponse.json({
    narrator: {
      ...narrator,
      description,
      hypothesisSummary,
      dimensionStats,
      dimensionLabels: DIMENSION_LABELS,
      strategyStats,
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/narradores/[id] — update status
// ─────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const profileId = session.user.profile.id;
  const body = await req.json() as { status?: string };

  const narrator = await prisma.narrator.findFirst({ where: { id, profileId } });
  if (!narrator) {
    return NextResponse.json({ error: "Narrador não encontrado" }, { status: 404 });
  }

  const updated = await prisma.narrator.update({
    where: { id },
    data: { status: body.status ?? narrator.status },
  });

  return NextResponse.json({ narrator: updated });
}
