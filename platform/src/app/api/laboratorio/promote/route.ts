export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPublishingAccountId } from "@/lib/account";
import { assertThreadsPostsWithinLimit } from "@/lib/publishing/threads-limits";
import { z } from "zod";
import { createOrReuseNarrativeShortLink, publicShortUrl, replaceNarrativeLink } from "@/lib/short-links";

const postSchema = z.object({ position: z.number(), content: z.string(), hasMedia: z.boolean() });
const narrativeSchema = z.object({
  narratorId: z.string().optional(), hook: z.string(), narrativeSummary: z.string(),
  productStrategy: z.string().optional(), tone: z.string().optional(), rhythm: z.string().optional(),
  structureType: z.string().optional(), openingStyle: z.string().optional(),
  conflictType: z.string().optional(), questionType: z.string().optional(), posts: z.array(postSchema).min(1),
});
const promoteSchema = narrativeSchema.extend({
  campaignName: z.string().min(3), marketplace: z.string().default("shopee"),
  targetNetwork: z.string().default("threads"), productName: z.string().min(2), productUrl: z.string().url(),
  narratives: z.array(narrativeSchema).min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profileId = session.user.profile.id;

  try {
    const data = promoteSchema.parse(await req.json());
    const accountId = await getPublishingAccountId(profileId, data.targetNetwork);
    const narratives = data.narratives ?? [data];

    // Threads hard limit — refuse to persist oversized posts (no silent truncate)
    if (data.targetNetwork === "threads") {
      for (const narrative of narratives) {
        assertThreadsPostsWithinLimit(narrative.posts);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({ data: {
        profileId, ...(accountId ? { socialAccountId: accountId } : {}),
        ...(narratives[0]?.narratorId ? { narratorId: narratives[0].narratorId } : {}),
        name: data.campaignName, productUrl: data.productUrl, productName: data.productName,
        marketplace: data.marketplace, targetNetwork: data.targetNetwork, objective: "sales",
        language: "pt-BR", aiModel: "llm", approvalMode: "manual", trendsPerDay: 2,
        postsPerDay: 7, status: "testing", mode: "test",
      }});
      const trendIds: string[] = [];
      for (const narrative of narratives) {
        const trend = await tx.trend.create({ data: {
          campaignId: campaign.id, ...(narrative.narratorId ? { narratorId: narrative.narratorId } : {}),
          format: "staircase", hook: narrative.hook, narrativeSummary: narrative.narrativeSummary,
          status: "approved", postsCount: narrative.posts.length, productStrategy: narrative.productStrategy,
          tone: narrative.tone, rhythm: narrative.rhythm, structureType: narrative.structureType,
          openingStyle: narrative.openingStyle, conflictType: narrative.conflictType, questionType: narrative.questionType,
        }});
        trendIds.push(trend.id);
        await tx.trendPost.createMany({ data: narrative.posts.map((post) => ({ trendId: trend.id, ...post })) });
      }
      await tx.campaignEvent.create({ data: {
        campaignId: campaign.id, type: "created", title: "Promovida do Laboratório",
        description: `${narratives.length} narrativa(s) promovida(s) do Laboratório`,
      }});
      return { campaignId: campaign.id, trendIds, socialAccountId: campaign.socialAccountId };
    });
    for (let index = 0; index < result.trendIds.length; index += 1) {
      const trendId = result.trendIds[index];
      const shortLink = await createOrReuseNarrativeShortLink({
        destinationUrl: data.productUrl,
        workspaceId: profileId,
        socialAccountId: result.socialAccountId,
        campaignId: result.campaignId,
        trendId,
        marketplace: data.marketplace,
      });
      const shortUrl = publicShortUrl(shortLink.code);
      const posts = await prisma.trendPost.findMany({ where: { trendId }, select: { id: true, content: true } });
      await prisma.$transaction(posts.map((post) => prisma.trendPost.update({
        where: { id: post.id },
        data: { content: replaceNarrativeLink(post.content, data.productUrl, shortUrl) },
      })));
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    if (error instanceof Error && /limite de 500 caracteres/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Lab promote error:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
