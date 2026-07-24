export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { getLlmProvider, resolveEffectiveLlmConfig } from "@/lib/llm";
import { assertThreadsPostsWithinLimit } from "@/lib/publishing/threads-limits";
import { scheduleTrend } from "@/lib/scheduling/scheduler";

const updateSchema = z.object({
  status: z.enum(["draft", "approved", "scheduled", "published", "rejected"]).optional(),
  scheduledAt: z.string().optional(),
  action: z.enum(["regenerate", "approve", "schedule", "reject"]).optional(),
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
  const trend = await prisma.trend.findFirst({
    where: { id, campaign: { profileId: session.user.profile.id } },
    include: {
      posts: { orderBy: { position: "asc" } },
      campaign: { select: { id: true, name: true, productName: true, marketplace: true, targetNetwork: true } },
    },
  });

  if (!trend) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ trend });
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
  const trend = await prisma.trend.findFirst({
    where: { id, campaign: { profileId: session.user.profile.id } },
    include: { campaign: true },
  });

  if (!trend) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    if ((data.action === "schedule" || data.status === "scheduled") && data.scheduledAt) {
      if (trend.campaign.targetNetwork === "threads") {
        const existingPosts = await prisma.trendPost.findMany({
          where: { trendId: id },
          select: { position: true, content: true },
          orderBy: { position: "asc" },
        });
        assertThreadsPostsWithinLimit(existingPosts);
      }
      await scheduleTrend(id, new Date(data.scheduledAt));
      const scheduled = await prisma.trend.findUnique({ where: { id }, include: { posts: { orderBy: { position: "asc" } } } });
      return NextResponse.json({ trend: scheduled });
    }

    if (data.action === "regenerate") {
      const llmConfigRow = await prisma.llmConfig.findUnique({
        where: { profileId: session.user.profile.id },
      });
      const llmConfig = resolveEffectiveLlmConfig(llmConfigRow);

      const learnings = await prisma.learning.findMany({
        where: { profileId: session.user.profile.id, state: "active" },
        orderBy: { recordedAt: "desc" },
        take: 8,
      });

      const provider = getLlmProvider(llmConfig);
      const generated = await provider.generateNarrative({
        productName: trend.campaign.productName,
        productUrl: trend.campaign.productUrl,
        marketplace: trend.campaign.marketplace,
        targetNetwork: trend.campaign.targetNetwork,
        niche: session.user.profile.niche,
        campaignId: trend.campaignId,
        learnings: learnings.map((l) => l.summary),
        regenerationSeed: Math.floor(Math.random() * 1000000),
      });

      if (trend.campaign.targetNetwork === "threads") {
        assertThreadsPostsWithinLimit(generated.posts);
      }

      await prisma.trendPost.deleteMany({ where: { trendId: id } });

      const updated = await prisma.trend.update({
        where: { id },
        data: {
          format: generated.format,
          hook: generated.hook,
          narrativeSummary: generated.narrativeSummary,
          postsCount: generated.posts.length,
          status: "draft",
        },
      });

      const posts = await Promise.all(
        generated.posts.map((p) =>
          prisma.trendPost.create({
            data: { trendId: id, position: p.position, content: p.content, hasMedia: p.hasMedia },
          })
        )
      );

      // Record campaign event for regeneration
      await prisma.campaignEvent.create({
        data: {
          campaignId: trend.campaignId,
          type: "generated",
          title: "Narrativa regenerada",
          description: `Família "${generated.family}" · Emoção "${generated.emotion}"`,
          metadata: JSON.stringify({ trendId: id, provider: provider.name, family: generated.family, emotion: generated.emotion, character: generated.character }),
        },
      });

      // Update narrative patterns
      const profileId = session.user.profile.id;
      for (const el of [
        { type: "family", value: generated.family },
        { type: "emotion", value: generated.emotion },
        { type: "character", value: generated.character },
      ].filter((e) => e.value)) {
        if (!trend.campaign.socialAccountId) continue;
        await prisma.narrativePattern.upsert({
          where: { profileId_socialAccountId_type_value: { profileId, socialAccountId: trend.campaign.socialAccountId, type: el.type, value: el.value } },
          update: { usageCount: { increment: 1 } },
          create: { profileId, socialAccountId: trend.campaign.socialAccountId, type: el.type, value: el.value, usageCount: 1 },
        });
      }

      return NextResponse.json({ trend: { ...updated, posts } });
    }

    const updated = await prisma.trend.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.scheduledAt ? { scheduledAt: new Date(data.scheduledAt) } : {}),
        ...(data.status === "published" ? { publishedAt: new Date() } : {}),
      },
      include: { posts: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json({ trend: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Error && /limite de 500 caracteres/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
