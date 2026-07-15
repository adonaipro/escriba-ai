export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ACCOUNT_COOKIE } from "@/lib/account";
import { z } from "zod";

const promoteSchema = z.object({
  campaignName: z.string().min(3),
  marketplace: z.string().default("shopee"),
  targetNetwork: z.string().default("threads"),
  productName: z.string().min(2),
  productUrl: z.string().url(),
  narratorId: z.string().optional(),
  hook: z.string(),
  narrativeSummary: z.string(),
  productStrategy: z.string().optional(),
  tone: z.string().optional(),
  rhythm: z.string().optional(),
  structureType: z.string().optional(),
  openingStyle: z.string().optional(),
  conflictType: z.string().optional(),
  questionType: z.string().optional(),
  posts: z.array(
    z.object({
      position: z.number(),
      content: z.string(),
      hasMedia: z.boolean(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;
  const accountId = req.cookies.get(ACCOUNT_COOKIE)?.value ?? null;

  try {
    const body = await req.json();
    const data = promoteSchema.parse(body);

    const campaign = await prisma.campaign.create({
      data: {
        profileId,
        ...(accountId ? { socialAccountId: accountId } : {}),
        ...(data.narratorId ? { narratorId: data.narratorId } : {}),
        name: data.campaignName,
        productUrl: data.productUrl,
        productName: data.productName,
        marketplace: data.marketplace,
        targetNetwork: data.targetNetwork,
        objective: "sales",
        language: "pt-BR",
        aiModel: "simulated",
        approvalMode: "manual",
        trendsPerDay: 2,
        postsPerDay: 7,
        status: "testing",
        mode: "test",
      },
    });

    const trend = await prisma.trend.create({
      data: {
        campaignId: campaign.id,
        ...(data.narratorId ? { narratorId: data.narratorId } : {}),
        format: "staircase",
        hook: data.hook,
        narrativeSummary: data.narrativeSummary,
        status: "approved",
        postsCount: data.posts.length,
        productStrategy: data.productStrategy,
        tone: data.tone,
        rhythm: data.rhythm,
        structureType: data.structureType,
        openingStyle: data.openingStyle,
        conflictType: data.conflictType,
        questionType: data.questionType,
      },
    });

    await prisma.trendPost.createMany({
      data: data.posts.map((p) => ({
        trendId: trend.id,
        position: p.position,
        content: p.content,
        hasMedia: p.hasMedia,
      })),
    });

    await prisma.campaignEvent.create({
      data: {
        campaignId: campaign.id,
        type: "created",
        title: "Promovida do Laboratório",
        description: `Narrativa: ${data.narrativeSummary}`,
      },
    });

    return NextResponse.json({ campaignId: campaign.id, trendId: trend.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Lab promote error:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
