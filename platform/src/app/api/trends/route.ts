export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { generateTrend } from "@/lib/engines/trend-engine";
import { ACCOUNT_COOKIE } from "@/lib/account";

const createSchema = z.object({
  campaignId: z.string().min(1),
  format: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const campaignId = searchParams.get("campaignId");
  const status = searchParams.get("status");
  const format = searchParams.get("format");
  const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value ?? null;

  const trends = await prisma.trend.findMany({
    where: {
      campaign: {
        profileId: session.user.profile.id,
        ...(accountId ? { socialAccountId: accountId } : {}),
      },
      ...(campaignId ? { campaignId } : {}),
      ...(status ? { status } : {}),
      ...(format ? { format } : {}),
    },
    include: {
      campaign: { select: { id: true, name: true, productName: true, targetNetwork: true } },
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ trends });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const campaign = await prisma.campaign.findFirst({
      where: { id: data.campaignId, profileId: session.user.profile.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    }

    const generated = generateTrend({
      productName: campaign.productName,
      productUrl: campaign.productUrl,
      marketplace: campaign.marketplace,
      targetNetwork: campaign.targetNetwork,
      niche: session.user.profile.niche,
      format: data.format as never,
      campaignId: campaign.id,
    });

    const trend = await prisma.trend.create({
      data: {
        campaignId: campaign.id,
        format: generated.format,
        hook: generated.hook,
        narrativeSummary: generated.narrativeSummary,
        qualityScore: generated.qualityScore,
        postsCount: generated.posts.length,
        status: campaign.approvalMode === "auto" ? "approved" : "draft",
      },
    });

    const posts = await Promise.all(
      generated.posts.map((p) =>
        prisma.trendPost.create({
          data: {
            trendId: trend.id,
            position: p.position,
            content: p.content,
            hasMedia: p.hasMedia,
            mediaType: p.mediaType,
          },
        })
      )
    );

    return NextResponse.json({ trend: { ...trend, posts } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create trend error:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
