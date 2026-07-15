import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function safeParseJson(s: string): string[] {
  try { return JSON.parse(s) as string[]; } catch { return []; }
}

export const runtime = "nodejs";

// GET /api/produtos/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profileId = session.user.profile.id;
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, profileId },
    include: {
      analysis: true,
      campaigns: {
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          _count: { select: { trends: true } },
          trends: {
            select: {
              id: true,
              hook: true,
              productStrategy: true,
              totalClicks: true,
              totalImpressions: true,
              totalConversions: true,
              totalRevenueBrl: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  // Parse JSON fields from analysis
  const parsedAnalysis = product.analysis
    ? {
        ...product.analysis,
        confirmedFacts:    safeParseJson(product.analysis.confirmedFacts),
        aiInferences:      safeParseJson(product.analysis.aiInferences),
        targetAudience:    safeParseJson(product.analysis.targetAudience),
        usageOccasions:    safeParseJson(product.analysis.usageOccasions),
        pains:             safeParseJson(product.analysis.pains),
        benefits:          safeParseJson(product.analysis.benefits),
        scenarios:         safeParseJson(product.analysis.scenarios),
        characters:        safeParseJson(product.analysis.characters),
        conflicts:         safeParseJson(product.analysis.conflicts),
        compatibleObjects: safeParseJson(product.analysis.compatibleObjects),
        bridgeTopics:      safeParseJson(product.analysis.bridgeTopics),
        restrictions:      safeParseJson(product.analysis.restrictions),
      }
    : null;

  return NextResponse.json({ ...product, analysis: parsedAnalysis });
}

// PATCH /api/produtos/[id] — manual field updates
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profileId = session.user.profile.id;
  const { id } = await params;

  const existing = await prisma.product.findFirst({ where: { id, profileId } });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const body = await req.json() as Partial<{
    name: string;
    description: string;
    affiliateUrl: string;
    category: string;
    subcategory: string;
    price: number;
    promotionalPrice: number | null;
    commission: number;
    commissionPct: number;
  }>;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name:             body.name             ?? undefined,
      description:      body.description      ?? undefined,
      affiliateUrl:     body.affiliateUrl      ?? undefined,
      category:         body.category         ?? undefined,
      subcategory:      body.subcategory       ?? undefined,
      price:            body.price             ?? undefined,
      promotionalPrice: body.promotionalPrice  !== undefined ? body.promotionalPrice : undefined,
      commission:       body.commission        ?? undefined,
      commissionPct:    body.commissionPct     ?? undefined,
    },
  });

  return NextResponse.json(updated);
}
