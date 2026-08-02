export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { processGenerationJob } from "@/lib/generation-service";
import { getPublishingAccountId, getSelectedAccountId } from "@/lib/account";
import { pickNarratorForProfile } from "@/lib/narrators/resolve-campaign-narrator";
import {
  allocateNextCampaignSlots,
  buildSmartScheduleTimes,
  formatSlotTimeSP,
  localDateKey,
  parseScheduleTimes,
} from "@/lib/scheduling/scheduler";
import { MAX_GENERATION_COUNT } from "@/lib/llm/resilient-generate";

const EDITORIAL_MODES = ["story-produto", "story-organico", "desabafo", "polemica", "pergunta"] as const;
const CONTENT_MODES = [...EDITORIAL_MODES, "mix-editorial"] as const;
type ContentModeValue = typeof CONTENT_MODES[number];

function requiresProduct(mode?: ContentModeValue | null, editorialModes?: readonly string[]): boolean {
  return !mode || mode === "story-produto" || (mode === "mix-editorial" && !!editorialModes?.includes("story-produto"));
}

/** Keep only valid HH:mm — never invent or truncate campaign schedule times. */
function resolveScheduleTimes(input: string[] | undefined): string[] {
  return [...new Set((input ?? []).filter((time) => /^\d{2}:\d{2}$/.test(time)))].sort();
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
  trendsPerDay: z.number().int().min(1).max(MAX_GENERATION_COUNT).default(2),
  postsPerDay: z.number().int().min(0).max(20).default(7),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  // New: schedule
  scheduleDays: z.array(z.number().int().min(0).max(6)).optional(),
  scheduleTimes: z.array(z.string()).optional(),
  /** When true, server builds human-like scheduleTimes; manual times optional. */
  smartDistribution: z.boolean().optional().default(false),
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

    // Narrator is required for Story Engine — resolve BEFORE insert so the
    // campaign row never exists without narratorId (avoids null on generation).
    const narrator = await pickNarratorForProfile(session.user.profile.id, {
      socialAccountId: accountId,
    });

    // Quantity drives smart distribution density; manual mode keeps exact user times.
    const count = Math.max(1, Math.min(MAX_GENERATION_COUNT, data.trendsPerDay));
    const smart = data.smartDistribution === true;
    let resolvedScheduleTimes = resolveScheduleTimes(data.scheduleTimes);
    if (smart || resolvedScheduleTimes.length === 0) {
      if (smart) {
        resolvedScheduleTimes = buildSmartScheduleTimes(count, Date.now());
      }
    }
    if (resolvedScheduleTimes.length === 0) {
      return NextResponse.json(
        { error: "Configure pelo menos um horário de publicação (ex.: 09:00, 12:00, 20:00)." },
        { status: 400 },
      );
    }
    const scheduleDays =
      data.scheduleDays && data.scheduleDays.length > 0
        ? data.scheduleDays
        : [0, 1, 2, 3, 4, 5, 6];
    const customSchedule = JSON.stringify({
      contentMode: data.contentMode,
      editorialModes: data.contentMode === "mix-editorial" ? data.editorialModes : [data.contentMode],
      products,
      targetNetworks,
      scheduleDays,
      scheduleTimes: resolvedScheduleTimes,
      smartDistribution: smart,
    });

    const startDate =
      data.startDate && String(data.startDate).trim()
        ? new Date(data.startDate)
        : undefined;
    const endDate =
      data.endDate && String(data.endDate).trim() ? new Date(data.endDate) : undefined;

    const campaign = await prisma.campaign.create({
      data: {
        profileId: session.user.profile.id,
        ...(accountId ? { socialAccountId: accountId } : {}),
        narratorId: narrator.id,
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
        startDate,
        endDate,
        customSchedule,
        status: "testing",
        mode: "test",
      },
    });

    await prisma.campaignEvent.create({
      data: {
        campaignId: campaign.id,
        type: "created",
        title: "Campanha criada",
        description: `Produto: ${productName} · Rede: ${targetNetworks.join(", ")} · Narrador: ${narrator.name}`,
      },
    });

    // Schedules distribute narratives across next free slots (multi-day when needed).
    const after =
      startDate && startDate.getTime() > Date.now() ? startDate : new Date();
    const slots = allocateNextCampaignSlots(customSchedule, count, after);
    if (slots.length < count) {
      return NextResponse.json(
        {
          error:
            "Não foi possível alocar todos os horários para o lote. Verifique os dias/horários da campanha.",
        },
        { status: 400 },
      );
    }

    // generationKey matches recurrence format (campaign:date:slotIndex) so daily
    // recurrence cannot spawn duplicate jobs for the same schedule slot.
    const scheduleTimes = parseScheduleTimes(customSchedule);
    const jobs = await prisma.$transaction(
      Array.from({ length: count }, (_, i) => {
        const targetSlot = slots[i]!;
        const dateKey = localDateKey(targetSlot);
        const time = formatSlotTimeSP(targetSlot);
        const slotIndex = Math.max(0, scheduleTimes.indexOf(time));
        return prisma.generationJob.upsert({
          where: { generationKey: `${campaign.id}:${dateKey}:${slotIndex}` },
          update: { targetSlot },
          create: {
            campaignId: campaign.id,
            generationKey: `${campaign.id}:${dateKey}:${slotIndex}`,
            targetSlot,
            targetDate: new Date(`${dateKey}T12:00:00-03:00`),
            slotIndex,
          },
        });
      }),
    );

    // Process sequentially; each job retries internally until a valid narrative is persisted.
    void (async () => {
      for (const generationJob of jobs) {
        await processGenerationJob(generationJob.id);
        // If still failed after internal retries, recreate and try once more (batch completeness)
        const fresh = await prisma.generationJob.findUnique({ where: { id: generationJob.id } });
        if (fresh?.status === "failed") {
          await prisma.generationJob.update({
            where: { id: generationJob.id },
            data: {
              status: "pending",
              statusLabel: "Gerando…",
              error: null,
              progress: 0,
              completedAt: null,
            },
          });
          await processGenerationJob(generationJob.id);
        }
      }
    })();

    return NextResponse.json(
      {
        campaign,
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
