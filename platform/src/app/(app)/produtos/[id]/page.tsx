import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProductDetailClient } from "./detail-client";

export const metadata = { title: "Produto" };

function safeParseJson(s: string): string[] {
  try { return JSON.parse(s) as string[]; } catch { return []; }
}

export default async function ProdutoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user.profile) redirect("/login");

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
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) notFound();

  const parsedAnalysis = product.analysis
    ? {
        id: product.analysis.id,
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
        detectedCategory:  product.analysis.detectedCategory,
        categoryLabel:     product.analysis.categoryLabel,
        confidence:        product.analysis.confidence,
        analysisVersion:   product.analysis.analysisVersion,
        updatedAt:         product.analysis.updatedAt.toISOString(),
      }
    : null;

  return (
    <ProductDetailClient
      product={{
        id: product.id,
        name: product.name,
        marketplace: product.marketplace,
        category: product.category,
        subcategory: product.subcategory,
        imageUrl: product.imageUrl,
        price: product.price,
        promotionalPrice: product.promotionalPrice,
        commission: product.commission,
        commissionPct: product.commissionPct,
        rating: product.rating,
        soldCount: product.soldCount,
        shopName: product.shopName,
        originalUrl: product.originalUrl,
        affiliateUrl: product.affiliateUrl,
        description: product.description,
        dataSource: product.dataSource,
        analysisStatus: product.analysisStatus,
        lastSyncedAt: product.lastSyncedAt?.toISOString() ?? null,
        createdAt: product.createdAt.toISOString(),
      }}
      analysis={parsedAnalysis}
      campaigns={product.campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        narrativesCount: c._count.trends,
        trends: c.trends.map((t) => ({
          id: t.id,
          hook: t.hook,
          productStrategy: t.productStrategy ?? "",
          totalClicks: t.totalClicks,
          totalImpressions: t.totalImpressions,
          totalConversions: t.totalConversions,
          totalRevenueBrl: t.totalRevenueBrl,
          createdAt: t.createdAt.toISOString(),
        })),
      }))}
    />
  );
}
