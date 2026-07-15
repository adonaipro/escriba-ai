export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["testing", "scale_eligible", "scaling", "monitoring", "saturating", "paused", "ended"]).optional(),
  mode: z.enum(["test", "scale"]).optional(),
  trendsPerDay: z.number().int().min(1).max(10).optional(),
  postsPerDay: z.number().int().min(0).max(20).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, profileId: session.user.profile.id },
    include: {
      trends: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { posts: { orderBy: { position: "asc" } } },
      },
      publications: {
        orderBy: { scheduledAt: "desc" },
        take: 30,
        include: { trendPost: { select: { position: true, content: true } } },
      },
      learnings: { where: { state: "active" }, orderBy: { recordedAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 50 },
      generationJobs: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, status: true, statusLabel: true, progress: true, trendId: true, error: true, createdAt: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const publishedPubs = campaign.publications.filter((p) => p.status === "published");
  const metrics = {
    totalClicks: publishedPubs.reduce((s, p) => s + (p.clicks || 0), 0),
    totalImpressions: publishedPubs.reduce((s, p) => s + (p.impressions || 0), 0),
    totalRevenue: publishedPubs.reduce((s, p) => s + (p.revenueBrl || 0), 0),
    totalConversions: publishedPubs.reduce((s, p) => s + (p.conversions || 0), 0),
  };

  return NextResponse.json({ campaign: { ...campaign, metrics } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, profileId: session.user.profile.id },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === "scaling" ? { mode: "scale" } : {}),
        ...(data.status === "paused" ? { pausedAt: new Date() } : {}),
        ...(data.status === "ended" ? { endedAt: new Date() } : {}),
        ...(data.status === "testing" && campaign.status === "paused" ? { pausedAt: null } : {}),
      },
    });

    return NextResponse.json({ campaign: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
