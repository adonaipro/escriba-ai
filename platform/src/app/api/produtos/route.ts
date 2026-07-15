import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { importProductByLink } from "@/lib/products/product-import";

export const runtime = "nodejs";

// GET /api/produtos — list all products for the profile
export async function GET() {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profileId = session.user.profile.id;

  const products = await prisma.product.findMany({
    where: { profileId },
    include: {
      analysis: {
        select: {
          detectedCategory: true,
          categoryLabel: true,
          confidence: true,
          analysisVersion: true,
          updatedAt: true,
        },
      },
      campaigns: {
        select: {
          id: true,
          name: true,
          status: true,
          _count: { select: { trends: true } },
          trends: {
            select: {
              totalClicks: true,
              totalImpressions: true,
              totalConversions: true,
              totalRevenueBrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute aggregated metrics per product
  const enriched = products.map((p) => {
    let totalClicks = 0, totalImpressions = 0, totalConversions = 0, totalRevenue = 0;
    p.campaigns.forEach((c) => {
      c.trends.forEach((t) => {
        totalClicks += t.totalClicks;
        totalImpressions += t.totalImpressions;
        totalConversions += t.totalConversions;
        totalRevenue += t.totalRevenueBrl;
      });
    });
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    return {
      ...p,
      metrics: {
        campaigns: p.campaigns.length,
        narratives: p.campaigns.reduce((s, c) => s + c._count.trends, 0),
        clicks: totalClicks,
        impressions: totalImpressions,
        conversions: totalConversions,
        revenueBrl: totalRevenue,
        ctr: parseFloat(ctr.toFixed(2)),
      },
    };
  });

  return NextResponse.json({ products: enriched });
}

// POST /api/produtos — import product by link
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profileId = session.user.profile.id;

  const body = await req.json() as { url?: string; affiliateUrl?: string };
  const rawUrl = body.url ?? body.affiliateUrl ?? "";

  if (!rawUrl || !rawUrl.startsWith("http")) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  try {
    const result = await importProductByLink(profileId, rawUrl);
    return NextResponse.json(result, { status: result.isNew ? 201 : 200 });
  } catch (e) {
    console.error("[produtos/import]", e);
    return NextResponse.json(
      { error: "Falha ao importar produto. Verifique o link e tente novamente." },
      { status: 500 },
    );
  }
}
