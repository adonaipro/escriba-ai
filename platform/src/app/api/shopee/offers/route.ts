import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { shopeeRequest } from "@/lib/providers/shopee-client";
import { importProductByLink } from "@/lib/products/product-import";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 50;
const SYNC_PAGES_PER_REQUEST = 5;

const QUERY = `query Offers($keyword: String, $sortType: Int, $page: Int, $limit: Int, $isAMSOffer: Boolean, $productCatId: Int) {
  productOfferV2(keyword: $keyword, sortType: $sortType, page: $page, limit: $limit, isAMSOffer: $isAMSOffer, productCatId: $productCatId) {
    nodes { itemId productName commissionRate sellerCommissionRate shopeeCommissionRate commission priceMin priceMax sales ratingStar imageUrl productLink offerLink periodStartTime periodEndTime shopId shopName productCatIds }
    pageInfo { page limit hasNextPage }
  }
}`;

type ShopeeApiOffer = {
  itemId: number; productName: string; commissionRate: string; sellerCommissionRate: string;
  shopeeCommissionRate: string; commission: string; priceMin: string; priceMax?: string;
  sales: number; ratingStar: string; imageUrl: string; productLink?: string; offerLink: string;
  periodStartTime?: number; periodEndTime?: number; shopId: number; shopName: string;
  productCatIds?: number[];
};

type OffersResponse = {
  nodes: ShopeeApiOffer[];
  pageInfo: { page: number; limit: number; hasNextPage: boolean };
};

function numberParam(url: URL, name: string, fallback = 0) {
  const parsed = Number(url.searchParams.get(name));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const profileId = session.user.profile.id;
  const page = Math.max(1, Math.floor(numberParam(url, "page", 1)));
  const limit = Math.min(100, Math.max(12, Math.floor(numberParam(url, "limit", 48))));
  const query = (url.searchParams.get("q") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();
  const extraOnly = url.searchParams.get("extra") === "1";
  const sort = Math.min(5, Math.max(1, Math.floor(numberParam(url, "sort", 2))));
  const minPrice = Math.max(0, numberParam(url, "minPrice"));
  const maxPrice = Math.max(0, numberParam(url, "maxPrice"));
  const minCommission = Math.max(0, numberParam(url, "minCommission"));
  const minSales = Math.max(0, Math.floor(numberParam(url, "minSales")));
  const minRating = Math.max(0, numberParam(url, "minRating"));

  const where: Prisma.ShopeeOfferWhereInput = {
    profileId,
    ...(query ? { productName: { contains: query, mode: "insensitive" } } : {}),
    ...(category ? { productCatIds: { contains: `\"${category}\"` } } : {}),
    ...(extraOnly ? { sellerCommissionRate: { gt: 0 } } : {}),
    ...(minPrice || maxPrice ? { priceMin: { ...(minPrice ? { gte: minPrice } : {}), ...(maxPrice ? { lte: maxPrice } : {}) } } : {}),
    ...(minCommission ? { commissionRate: { gte: minCommission / 100 } } : {}),
    ...(minSales ? { sales: { gte: minSales } } : {}),
    ...(minRating ? { ratingStar: { gte: minRating } } : {}),
  };

  const orderBy: Prisma.ShopeeOfferOrderByWithRelationInput[] = sort === 5
    ? [{ commissionRate: "desc" }, { sales: "desc" }]
    : sort === 4 ? [{ priceMin: "asc" }]
      : sort === 3 ? [{ priceMin: "desc" }]
        : sort === 1 ? [{ updatedAt: "desc" }, { sales: "desc" }]
          : [{ sales: "desc" }, { ratingStar: "desc" }, { commissionRate: "desc" }];

  const [nodes, total, catalogTotal, latest] = await prisma.$transaction([
    prisma.shopeeOffer.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.shopeeOffer.count({ where }),
    prisma.shopeeOffer.count({ where: { profileId } }),
    prisma.shopeeOffer.findFirst({ where: { profileId }, orderBy: { lastSyncedAt: "desc" }, select: { lastSyncedAt: true } }),
  ]);

  return NextResponse.json({
    nodes: nodes.map((offer) => ({
      ...offer,
      itemId: Number(offer.itemId),
      shopId: Number(offer.shopId),
      productCatIds: JSON.parse(offer.productCatIds || "[]"),
    })),
    pageInfo: { page, limit, hasNextPage: page * limit < total },
    total,
    catalogTotal,
    lastSyncedAt: latest?.lastSyncedAt ?? null,
  });
}

async function syncCatalog(profileId: string, startPage: number) {
  let page = startPage;
  let hasNextPage = true;
  let synced = 0;

  for (let batchIndex = 0; batchIndex < SYNC_PAGES_PER_REQUEST && hasNextPage; batchIndex++, page++) {
    const data = await shopeeRequest<{ productOfferV2: OffersResponse }>(QUERY, {
      sortType: 2,
      page,
      limit: PAGE_SIZE,
      isAMSOffer: false,
    });
    const response = data.productOfferV2;
    const now = new Date();

    const databaseBatchSize = 20;
    for (let offset = 0; offset < response.nodes.length; offset += databaseBatchSize) {
      const operations = response.nodes.slice(offset, offset + databaseBatchSize).map((offer) => {
        const values = {
          productName: offer.productName || "Produto Shopee",
          commissionRate: Number(offer.commissionRate) || 0,
          sellerCommissionRate: Number(offer.sellerCommissionRate) || 0,
          shopeeCommissionRate: Number(offer.shopeeCommissionRate) || 0,
          commission: Number(offer.commission) || 0,
          priceMin: Number(offer.priceMin) || 0,
          priceMax: offer.priceMax ? Number(offer.priceMax) || null : null,
          sales: offer.sales || 0,
          ratingStar: Number(offer.ratingStar) || 0,
          imageUrl: offer.imageUrl || "",
          productLink: offer.productLink || "",
          offerLink: offer.offerLink || "",
          shopId: String(offer.shopId || ""),
          shopName: offer.shopName || "",
          productCatIds: JSON.stringify((offer.productCatIds || []).map(String)),
          periodStartTime: offer.periodStartTime == null ? null : String(offer.periodStartTime),
          periodEndTime: offer.periodEndTime == null ? null : String(offer.periodEndTime),
          lastSyncedAt: now,
        };
        return prisma.shopeeOffer.upsert({
          where: { profileId_itemId: { profileId, itemId: String(offer.itemId) } },
          create: { profileId, itemId: String(offer.itemId), ...values },
          update: values,
        });
      });
      if (operations.length) await prisma.$transaction(operations, { timeout: 20_000 });
    }

    synced += response.nodes.length;
    hasNextPage = response.pageInfo.hasNextPage;
    if (!response.nodes.length) hasNextPage = false;
  }

  return { synced, nextPage: hasNextPage ? page : null, complete: !hasNextPage };
}

type ImportedOffer = {
  itemId: number; productName: string; commissionRate: number | string; commission: number | string;
  priceMin: number | string; priceMax?: number | string | null; sales: number; ratingStar: number | string;
  imageUrl: string; productLink?: string; offerLink: string; shopId: number | string; shopName: string;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { action?: string; startPage?: number; offers?: ImportedOffer[] };

  if (body.action === "sync") {
    try {
      const startPage = Math.max(1, Math.floor(Number(body.startPage) || 1));
      return NextResponse.json(await syncCatalog(session.user.profile.id, startPage));
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao sincronizar a Shopee" }, { status: 502 });
    }
  }

  if (!Array.isArray(body.offers) || body.offers.length === 0 || body.offers.length > 100) {
    return NextResponse.json({ error: "Selecione entre 1 e 100 produtos" }, { status: 400 });
  }

  const ids: string[] = [];
  for (const offer of body.offers) {
    if (!offer.offerLink || !offer.productName || !offer.itemId) continue;
    const existing = await prisma.product.findFirst({ where: { profileId: session.user.profile.id, marketplace: "shopee", externalId: String(offer.itemId) } });
    const productId = existing?.id ?? (await importProductByLink(session.user.profile.id, offer.offerLink)).productId;
    const product = await prisma.product.update({ where: { id: productId }, data: {
      externalId: String(offer.itemId), shopId: String(offer.shopId), name: offer.productName,
      imageUrl: offer.imageUrl || "", price: Number(offer.priceMin) || 0,
      promotionalPrice: offer.priceMax && offer.priceMax !== offer.priceMin ? Number(offer.priceMin) : null,
      commission: Number(offer.commission) || 0, commissionPct: (Number(offer.commissionRate) || 0) * 100,
      rating: Number(offer.ratingStar) || null, soldCount: offer.sales || 0, shopName: offer.shopName || "",
      originalUrl: offer.productLink || offer.offerLink, affiliateUrl: offer.offerLink, dataSource: "shopee_api", lastSyncedAt: new Date(),
    }});
    ids.push(product.id);
  }
  return NextResponse.json({ imported: ids.length, ids });
}
