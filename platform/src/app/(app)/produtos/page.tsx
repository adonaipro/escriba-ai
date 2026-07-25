import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProdutosClient } from "./produtos-client";
import { hasShopeeCredentials } from "@/lib/providers/shopee-client";
import {
  getShopeeCommissionByItemId,
  getShopeeMetricsSummary,
  syncShopeeConversions,
} from "@/lib/providers/shopee-conversions";

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

  // Prefer official Shopee conversionReport for commission / conversions when available.
  let shopeeByItem = new Map<string, { commission: number; qty: number; conversions: number }>();
  let shopeeTotals: Awaited<ReturnType<typeof getShopeeMetricsSummary>> | null = null;
  if (hasShopeeCredentials()) {
    try {
      shopeeTotals = await getShopeeMetricsSummary(profileId);
      const staleMs = 6 * 60 * 60 * 1000;
      const needsRefresh =
        !shopeeTotals.lastSyncedAt ||
        Date.now() - shopeeTotals.lastSyncedAt.getTime() > staleMs;
      if (needsRefresh) {
        await syncShopeeConversions(profileId, {
          purchaseTimeStart: new Date(Date.now() - 90 * 86400000),
          purchaseTimeEnd: new Date(),
          maxPages: 4,
        }).catch(() => null);
        shopeeTotals = await getShopeeMetricsSummary(profileId);
      }
      const itemIds = products
        .map((p) => p.externalId)
        .filter((id): id is string => Boolean(id));
      shopeeByItem = await getShopeeCommissionByItemId(profileId, itemIds);
    } catch {
      shopeeByItem = new Map();
      shopeeTotals = null;
    }
  }

  const enriched = products.map((p) => {
    let clicks = 0;
    let impressions = 0;
    p.campaigns.forEach((c) => {
      c.trends.forEach((t) => {
        clicks += t.totalClicks;
        impressions += t.totalImpressions;
      });
    });
    const shopee = p.externalId ? shopeeByItem.get(p.externalId) : undefined;
    const conversions = shopee?.conversions ?? 0;
    const revenue = shopee?.commission ?? 0;
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
        itemsSold: shopee?.qty ?? 0,
        ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
        source: shopee ? ("shopee" as const) : ("none" as const),
      },
    };
  });

  return (
    <ProdutosClient
      products={enriched}
      shopeeSummary={
        shopeeTotals
          ? {
              totalCommission: shopeeTotals.totalCommission,
              conversions: shopeeTotals.conversions,
              orders: shopeeTotals.orders,
              itemsSold: shopeeTotals.itemsSold,
              lastSyncedAt: shopeeTotals.lastSyncedAt?.toISOString() ?? null,
            }
          : null
      }
    />
  );
}
