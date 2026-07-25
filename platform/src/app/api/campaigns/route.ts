export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { processGenerationJob } from "@/lib/generation-service";
import { ensureCampaignDailyJobs } from "@/lib/scheduling/recurrence";
import { getPublishingAccountId, getSelectedAccountId } from "@/lib/account";
import { resolveAndLinkCampaignNarrator } from "@/lib/narrators/resolve-campaign-narrator";

const EDITORIAL_MODES = ["story-produto", "story-organico", "desabafo", "polemica", "pergunta"] as const;
const CONTENT_MODES = [...EDITORIAL_MODES, "mix-editorial"] as const;
type ContentModeValue = typeof CONTENT_MODES[number];

function requiresProduct(mode?: ContentModeValue | null, editorialModes?: readonly string[]): boolean {
  return !mode || mode === "story-produto" || (mode === "mix-editorial" && !!editorialModes?.includes("story-produto"));
}

function completeTimes(input: string[], count: number): string[] {
  const values = new Set(input.filter((time) => /^\d{2}:\d{2}$/.test(time)));
  for (let index = 0; values.size < count && index < count * 3; index++) {
    const minute = count === 1 ? 12 * 60 : Math.round((8 * 60 + (index % count) * (14 * 60) / (count - 1)) / 10) * 10;
    values.add(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
  }
  return [...values].sort().slice(0, count);
}

const productSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

const createSchema = z.object({
  name: z.string().min(3),
  // Legacy single-product fields (kept for backward compat, also sent by new form as first product)
  productUrl: z.string().optional().default(""),
  productName: z.string().optional().default(""),
  // New: multi-product list
  products: z.array(productSchema).optional(),
  marketplace: z.string().default("shopee"),
  // New: multi-network list
  targetNetworks: z.array(z.string()).optional(),
  targetNetwork: z.string().optional().default("threads"),
  language: z.string().default("pt-BR"),
  approvalMode: z.string().default("manual"),
  trendsPerDay: z.number().int().min(1).max(10).default(2),
  postsPerDay: z.number().int().min(0).max(20).default(7),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // New: schedule
  scheduleDays: z.array(z.number().int().min(0).max(6)).optional(),
  scheduleTimes: z.array(z.string()).optional(),
  contentMode: z.enum(CONTENT_MODES).optional().default("story-produto"),
  editorialModes: z.array(z.enum(EDITORIAL_MODES)).min(1).max(5).optional(),
}).superRefine((val, ctx) => {
  if (val.contentMode === "mix-editorial" && !val.editorialModes?.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione os formatos do Mix Editorial", path: ["editorialModes"] });
  }
  if (requiresProduct(val.contentMode, val.editorialModes)) {
    const products = val.products;
    if (products && products.length > 0) {
      // Validated by productSchema above
    } else {
      // Fall back to legacy fields
      if (!val.productUrl) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adicione pelo menos um produto com link e nome", path: ["products"] });
      }
      if (!val.productName || val.productName.trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nome do produto obrigatório", path: ["productName"] });
      }
    }
  }
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const accountId = await getSelectedAccountId(session.user.profile.id);

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

    // Resolve product fields — prefer multi-product array, fall back to legacy fields
    const products = data.products && data.products.length > 0
      ? data.products
      : data.productUrl
        ? [{ name: data.productName ?? "", url: data.productUrl }]
        : [];

    const firstProduct = products[0];
    const productUrl  = firstProduct?.url  ?? "";
    const productName = firstProduct?.name ?? "";

    // Resolve network — prefer multi-network array, fall back to legacy field
    const targetNetworks = data.targetNetworks && data.targetNetworks.length > 0
      ? data.targetNetworks
      : [data.targetNetwork ?? "threads"];
    const primaryNetwork = targetNetworks[0] ?? "threads";
    const accountId = await getPublishingAccountId(session.user.profile.id, primaryNetwork);

    const resolvedScheduleTimes = data.approvalMode === "auto"
      ? completeTimes(data.scheduleTimes ?? [], data.trendsPerDay)
      : data.scheduleTimes ?? [];
    const customSchedule = JSON.stringify({
      contentMode: data.contentMode,
      editorialModes: data.contentMode === "mix-editorial" ? data.editorialModes : [data.contentMode],
      products,
      targetNetworks,
      scheduleDays: data.scheduleDays ?? [1, 2, 3, 4, 5],
      scheduleTimes: resolvedScheduleTimes,
    });

    const campaign = await prisma.campaign.create({
      data: {
        profileId: session.user.profile.id,
        ...(accountId ? { socialAccountId: accountId } : {}),
        name: data.name,
        productUrl,
        productName,
        marketplace: data.marketplace,
        targetNetwork: primaryNetwork,
        objective: "sales",
        language: data.language,
        aiModel: "llm",
        approvalMode: data.approvalMode,
        trendsPerDay: data.trendsPerDay,
        postsPerDay: data.postsPerDay,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        customSchedule,
        status: "testing",
        mode: "test",
      },
    });

    // Auto-link narrator (same-sex as account, sole active, or create defaults)
    const linkedNarrator = await resolveAndLinkCampaignNarrator(
      campaign.id,
      session.user.profile.id,
      { socialAccountId: accountId },
    );

    await prisma.campaignEvent.create({
      data: {
        campaignId: campaign.id,
        type: "created",
        title: "Campanha criada",
        description: `Produto: ${productName} · Rede: ${targetNetworks.join(", ")}`,
      },
    });

    let jobs = await ensureCampaignDailyJobs(campaign.id);
    if (jobs.length === 0) {
      jobs = await prisma.$transaction(
        Array.from({ length: data.trendsPerDay }, () =>
          prisma.generationJob.create({ data: { campaignId: campaign.id } }),
        ),
      );
    }
    void (async () => {
      for (const generationJob of jobs) await processGenerationJob(generationJob.id);
    })();

    return NextResponse.json(
      {
        campaign: { ...campaign, narratorId: linkedNarrator.id },
        jobId: jobs[0]?.id,
        jobIds: jobs.map((generationJob) => generationJob.id),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
