export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { processGenerationJob } from "@/lib/generation-service";
import { ACCOUNT_COOKIE } from "@/lib/account";

const createSchema = z.object({
  name: z.string().min(3),
  productUrl: z.string().url(),
  productName: z.string().min(2),
  marketplace: z.string().default("shopee"),
  targetNetwork: z.string().min(1),
  objective: z.string().default("sales"),
  language: z.string().default("pt-BR"),
  aiModel: z.string().default("simulated"),
  approvalMode: z.string().default("manual"),
  trendsPerDay: z.number().int().min(1).max(10).default(2),
  postsPerDay: z.number().int().min(0).max(20).default(7),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value ?? null;

  const campaigns = await prisma.campaign.findMany({
    where: {
      profileId: session.user.profile.id,
      ...(status ? { status } : {}),
      ...(accountId ? { socialAccountId: accountId } : {}),
    },
    include: {
      _count: { select: { trends: true, publications: true } },
      publications: {
        where: { status: "published" },
        select: { clicks: true, impressions: true, revenueBrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = campaigns.map((c) => {
    const totalClicks = c.publications.reduce((s, p) => s + (p.clicks || 0), 0);
    const totalImpressions = c.publications.reduce((s, p) => s + (p.impressions || 0), 0);
    const totalRevenue = c.publications.reduce((s, p) => s + (p.revenueBrl || 0), 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    return {
      ...c,
      publications: undefined,
      metrics: {
        clicks: totalClicks,
        impressions: totalImpressions,
        revenue: totalRevenue,
        ctr,
        trendsCount: c._count.trends,
        publicationsCount: c._count.publications,
      },
    };
  });

  return NextResponse.json({ campaigns: enriched });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const accountId = request.cookies.get(ACCOUNT_COOKIE)?.value ?? null;

    const campaign = await prisma.campaign.create({
      data: {
        profileId: session.user.profile.id,
        ...(accountId ? { socialAccountId: accountId } : {}),
        name: data.name,
        productUrl: data.productUrl,
        productName: data.productName,
        marketplace: data.marketplace,
        targetNetwork: data.targetNetwork,
        objective: data.objective,
        language: data.language,
        aiModel: data.aiModel,
        approvalMode: data.approvalMode,
        trendsPerDay: data.trendsPerDay,
        postsPerDay: data.postsPerDay,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: "testing",
        mode: "test",
      },
    });

    // Record campaign creation event
    await prisma.campaignEvent.create({
      data: {
        campaignId: campaign.id,
        type: "created",
        title: "Campanha criada",
        description: `Produto: ${data.productName} · Rede: ${data.targetNetwork}`,
      },
    });

    // Create a generation job and fire immediately in background
    const job = await prisma.generationJob.create({
      data: { campaignId: campaign.id },
    });
    void processGenerationJob(job.id);

    return NextResponse.json({ campaign, jobId: job.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
