import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { shopeeRequest } from "@/lib/providers/shopee-client";
import { importProductByLink } from "@/lib/products/product-import";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 50;
const SYNC_PAGES_PER_REQUEST = 5;

const QUERY = `query Offers($keyword: String, $sortType: Int, $page: Int, $limit: Int, $isAMSOffer: Boolean, $productCatId: Int, $listType: Int) {
  productOfferV2(keyword: $keyword, sortType: $sortType, page: $page, limit: $limit, isAMSOffer: $isAMSOffer, productCatId: $productCatId, listType: $listType) {
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

function mapOfferValues(offer: ShopeeApiOffer, now: Date) {
  return {
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
}

function toClientNode(offer: {
  itemId: string | number;
  shopId: string | number;
  productCatIds: string;
  [key: string]: unknown;
}) {
  return {
    ...offer,
    itemId: Number(offer.itemId),
    shopId: Number(offer.shopId),
    productCatIds: JSON.parse((offer.productCatIds as string) || "[]"),
  };
}

async function upsertOffers(profileId: string, nodes: ShopeeApiOffer[]) {
  const now = new Date();
  const databaseBatchSize = 20;
  for (let offset = 0; offset < nodes.length; offset += databaseBatchSize) {
    const operations = nodes.slice(offset, offset + databaseBatchSize).map((offer) => {
      const values = mapOfferValues(offer, now);
      return prisma.shopeeOffer.upsert({
        where: { profileId_itemId: { profileId, itemId: String(offer.itemId) } },
        create: { profileId, itemId: String(offer.itemId), ...values },
        update: values,
      });
    });
    if (operations.length) await prisma.$transaction(operations, { timeout: 20_000 });
  }
}

function applyLocalFilters<T extends {
  sellerCommissionRate: number;
  priceMin: number;
  commissionRate: number;
  sales: number;
  ratingStar: number;
}>(
  nodes: T[],
  filters: {
    extraOnly: boolean;
    minPrice: number;
    maxPrice: number;
    minCommission: number;
    minSales: number;
    minRating: number;
  },
): T[] {
  return nodes.filter((offer) => {
    if (filters.extraOnly && !(offer.sellerCommissionRate > 0)) return false;
    if (filters.minPrice && offer.priceMin < filters.minPrice) return false;
    if (filters.maxPrice && offer.priceMin > filters.maxPrice) return false;
    if (filters.minCommission && offer.commissionRate < filters.minCommission / 100) return false;
    if (filters.minSales && offer.sales < filters.minSales) return false;
    if (filters.minRating && offer.ratingStar < filters.minRating) return false;
    return true;
  });
}

/**
 * Live productOfferV2 search — used when the user provides a keyword so results
 * match the official Shopee affiliate catalog instead of only the local cache.
 */
async function liveSearch(
  profileId: string,
  opts: {
    query: string;
    page: number;
    limit: number;
    sort: number;
    category: string;
    extraOnly: boolean;
    minPrice: number;
    maxPrice: number;
    minCommission: number;
    minSales: number;
    minRating: number;
  },
) {
  const variables: Record<string, unknown> = {
    keyword: opts.query || undefined,
    sortType: opts.sort,
    page: opts.page,
    limit: Math.min(50, opts.limit),
    // listType 0 = recommended (broadest); omit isAMSOffer so AMS and non-AMS both return
    listType: 0,
  };
  if (opts.category) {
    const catId = Number(opts.category);
    if (Number.isFinite(catId) && catId > 0) variables.productCatId = catId;
  }
  if (opts.extraOnly) variables.isAMSOffer = true;

  const data = await shopeeRequest<{ productOfferV2: OffersResponse }>(QUERY, variables);
  const response = data.productOfferV2;
  await upsertOffers(profileId, response.nodes);

  const mapped = response.nodes.map((offer) => {
    const values = mapOfferValues(offer, new Date());
    return {
      id: `live-${offer.itemId}`,
      profileId,
      itemId: String(offer.itemId),
      ...values,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const filtered = applyLocalFilters(mapped, opts);
  const latest = await prisma.shopeeOffer.findFirst({
    where: { profileId },
    orderBy: { lastSyncedAt: "desc" },
    select: { lastSyncedAt: true },
  });
  const catalogTotal = await prisma.shopeeOffer.count({ where: { profileId } });

  return {
    nodes: filtered.map(toClientNode),
    pageInfo: {
      page: response.pageInfo.page || opts.page,
      limit: response.pageInfo.limit || opts.limit,
      hasNextPage: Boolean(response.pageInfo.hasNextPage),
    },
    total: filtered.length + (response.pageInfo.hasNextPage ? opts.limit : 0),
    catalogTotal,
    lastSyncedAt: latest?.lastSyncedAt ?? null,
    source: "live" as const,
  };
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
  const forceLive = url.searchParams.get("live") === "1";

  // Keyword search (or explicit live=1) hits the Shopee API so results match the official panel.
  if (query || forceLive) {
    try {
      return NextResponse.json(
        await liveSearch(profileId, {
          query,
          page,
          limit,
          sort,
          category,
          extraOnly,
          minPrice,
          maxPrice,
          minCommission,
          minSales,
          minRating,
        }),
      );
    } catch (error) {
      // Fall through to local cache if live API fails
      if (!query) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Falha na busca ao vivo da Shopee" },
          { status: 502 },
        );
      }
    }
  }

  const where: Prisma.ShopeeOfferWhereInput = {
    profileId,
    ...(query ? { productName: { contains: query, mode: "insensitive" } } : {}),
    ...(category ? { productCatIds: { contains: `"${category}"` } } : {}),
    ...(extraOnly ? { sellerCommissionRate: { gt: 0 } } : {}),
    ...(minPrice || maxPrice
      ? { priceMin: { ...(minPrice ? { gte: minPrice } : {}), ...(maxPrice ? { lte: maxPrice } : {}) } }
      : {}),
    ...(minCommission ? { commissionRate: { gte: minCommission / 100 } } : {}),
    ...(minSales ? { sales: { gte: minSales } } : {}),
    ...(minRating ? { ratingStar: { gte: minRating } } : {}),
  };

  const orderBy: Prisma.ShopeeOfferOrderByWithRelationInput[] =
    sort === 5
      ? [{ commissionRate: "desc" }, { sales: "desc" }]
      : sort === 4
        ? [{ priceMin: "asc" }]
        : sort === 3
          ? [{ priceMin: "desc" }]
          : sort === 1
            ? [{ updatedAt: "desc" }, { sales: "desc" }]
            : [{ sales: "desc" }, { ratingStar: "desc" }, { commissionRate: "desc" }];

  const [nodes, total, catalogTotal, latest] = await prisma.$transaction([
    prisma.shopeeOffer.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.shopeeOffer.count({ where }),
    prisma.shopeeOffer.count({ where: { profileId } }),
    prisma.shopeeOffer.findFirst({
      where: { profileId },
      orderBy: { lastSyncedAt: "desc" },
      select: { lastSyncedAt: true },
    }),
  ]);

  return NextResponse.json({
    nodes: nodes.map(toClientNode),
    pageInfo: { page, limit, hasNextPage: page * limit < total },
    total,
    catalogTotal,
    lastSyncedAt: latest?.lastSyncedAt ?? null,
    source: "cache" as const,
  });
}

async function syncCatalog(profileId: string, startPage: number) {
  let page = startPage;
  let hasNextPage = true;
  let synced = 0;

  for (let batchIndex = 0; batchIndex < SYNC_PAGES_PER_REQUEST && hasNextPage; batchIndex++, page++) {
    // Broadest catalog crawl: listType 0 (recommended), no isAMSOffer filter.
    const data = await shopeeRequest<{ productOfferV2: OffersResponse }>(QUERY, {
      sortType: 2,
      page,
      limit: PAGE_SIZE,
      listType: 0,
    });
    const response = data.productOfferV2;
    await upsertOffers(profileId, response.nodes);

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
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Falha ao sincronizar a Shopee" },
        { status: 502 },
      );
    }
  }

  if (!Array.isArray(body.offers) || body.offers.length === 0 || body.offers.length > 100) {
    return NextResponse.json({ error: "Selecione entre 1 e 100 produtos" }, { status: 400 });
  }

  const ids: string[] = [];
  for (const offer of body.offers) {
    if (!offer.offerLink || !offer.productName || !offer.itemId) continue;
    const existing = await prisma.product.findFirst({
      where: {
        profileId: session.user.profile.id,
        marketplace: "shopee",
        externalId: String(offer.itemId),
      },
    });
    const productId =
      existing?.id ??
      (await importProductByLink(session.user.profile.id, offer.offerLink)).productId;
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        externalId: String(offer.itemId),
        shopId: String(offer.shopId),
        name: offer.productName,
        imageUrl: offer.imageUrl || "",
        price: Number(offer.priceMin) || 0,
        promotionalPrice:
          offer.priceMax && offer.priceMax !== offer.priceMin ? Number(offer.priceMin) : null,
        commission: Number(offer.commission) || 0,
        commissionPct: (Number(offer.commissionRate) || 0) * 100,
        rating: Number(offer.ratingStar) || null,
        soldCount: offer.sales || 0,
        shopName: offer.shopName || "",
        originalUrl: offer.productLink || offer.offerLink,
        affiliateUrl: offer.offerLink,
        dataSource: "shopee_api",
        lastSyncedAt: new Date(),
      },
    });
    ids.push(product.id);
  }
  return NextResponse.json({ imported: ids.length, ids });
}
