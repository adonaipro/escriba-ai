import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProdutosClient } from "./produtos-client";

export const metadata = { title: "Produtos" };

export default async function ProdutosPage() {
  const session = await getSession();
  if (!session?.user.profile) redirect("/login");

  const profileId = session.user.profile.id;

  const products = await prisma.product.findMany({
    where: { profileId },
    include: {
      analysis: {
        select: {
          detectedCategory: true,
          categoryLabel: true,
          confidence: true,
          updatedAt: true,
        },
      },
      campaigns: {
        select: {
          id: true,
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

  const enriched = products.map((p) => {
    let clicks = 0, impressions = 0, conversions = 0, revenue = 0;
    p.campaigns.forEach((c) => {
      c.trends.forEach((t) => {
        clicks += t.totalClicks;
        impressions += t.totalImpressions;
        conversions += t.totalConversions;
        revenue += t.totalRevenueBrl;
      });
    });
    return {
      id: p.id,
      name: p.name,
      marketplace: p.marketplace,
      category: p.category || p.analysis?.categoryLabel || "—",
      imageUrl: p.imageUrl,
      price: p.price,
      promotionalPrice: p.promotionalPrice,
      commission: p.commission,
      commissionPct: p.commissionPct,
      rating: p.rating,
      analysisStatus: p.analysisStatus,
      lastSyncedAt: p.lastSyncedAt?.toISOString() ?? null,
      confidence: p.analysis?.confidence ?? null,
      metrics: {
        campaigns: p.campaigns.length,
        narratives: p.campaigns.reduce((s, c) => s + c._count.trends, 0),
        clicks,
        impressions,
        conversions,
        revenueBrl: revenue,
        ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
      },
    };
  });

  return <ProdutosClient products={enriched} />;
}
