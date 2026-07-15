export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { updateNarrativePatternWins } from "@/lib/generation-service";

const metricsSchema = z.object({
  clicks: z.number().int().min(0).optional(),
  impressions: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  revenueBrl: z.number().min(0).optional(),
  status: z.enum(["published", "failed"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pub = await prisma.publication.findFirst({
    where: { id, campaign: { profileId: session.user.profile.id } },
    include: { trend: { select: { id: true, totalClicks: true, totalImpressions: true } } },
  });

  if (!pub) {
    return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = metricsSchema.parse(body);

    const updated = await prisma.publication.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === "published" ? { publishedAt: new Date() } : {}),
      },
    });

    // If we have impressions and clicks, check if this trend's CTR warrants a narrative win
    if (data.clicks !== undefined && data.impressions !== undefined && data.impressions > 0 && pub.trendId) {
      const newCtr = (data.clicks / data.impressions) * 100;

      // Calculate average CTR across all publications for this profile
      const allPubs = await prisma.publication.aggregate({
        where: { campaign: { profileId: session.user.profile.id }, status: "published", impressions: { gt: 0 } },
        _avg: { clicks: true, impressions: true },
      });
      const avgImpressions = allPubs._avg.impressions ?? 0;
      const avgClicks = allPubs._avg.clicks ?? 0;
      const avgCtr = avgImpressions > 0 ? (avgClicks / avgImpressions) * 100 : 0;

      if (newCtr > avgCtr * 1.2) {
        await updateNarrativePatternWins(
          pub.trendId,
          session.user.profile.id,
          newCtr,
          avgCtr
        );
      }
    }

    return NextResponse.json({ publication: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
