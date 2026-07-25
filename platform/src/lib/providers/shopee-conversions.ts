import "server-only";
import { prisma } from "@/lib/db";
import { hasShopeeCredentials, shopeeRequest } from "@/lib/providers/shopee-client";

// Shopee GraphQL: purchase times are Int64 (must be JSON strings).
// Never declare scrollId unless we have a real value — null scrollId returns "got null for non-null".
const CONVERSION_FIELDS = `
    nodes {
      purchaseTime
      clickTime
      conversionId
      totalCommission
      sellerCommission
      shopeeCommissionCapped
      buyerType
      device
      utmContent
      orders {
        orderId
        orderStatus
        items {
          itemId
          itemName
          shopName
          itemPrice
          qty
          itemTotalCommission
          attributionType
        }
      }
    }
    pageInfo {
      limit
      hasNextPage
      scrollId
    }`;

const CONVERSION_QUERY = `query ConversionReport(
  $purchaseTimeStart: Int64!,
  $purchaseTimeEnd: Int64!,
  $limit: Int
) {
  conversionReport(
    purchaseTimeStart: $purchaseTimeStart,
    purchaseTimeEnd: $purchaseTimeEnd,
    limit: $limit
  ) { ${CONVERSION_FIELDS} }
}`;

const CONVERSION_QUERY_SCROLL = `query ConversionReport(
  $purchaseTimeStart: Int64!,
  $purchaseTimeEnd: Int64!,
  $limit: Int,
  $scrollId: String!
) {
  conversionReport(
    purchaseTimeStart: $purchaseTimeStart,
    purchaseTimeEnd: $purchaseTimeEnd,
    limit: $limit,
    scrollId: $scrollId
  ) { ${CONVERSION_FIELDS} }
}`;

type ConversionItem = {
  itemId?: number | string;
  itemName?: string;
  shopName?: string;
  itemPrice?: string | number;
  qty?: number;
  itemTotalCommission?: string | number;
  attributionType?: string;
};

type ConversionOrder = {
  orderId?: string | number;
  orderStatus?: string;
  items?: ConversionItem[];
};

type ConversionNode = {
  purchaseTime?: number;
  clickTime?: number;
  conversionId?: string | number;
  totalCommission?: string | number;
  sellerCommission?: string | number;
  shopeeCommissionCapped?: string | number;
  buyerType?: string;
  device?: string;
  utmContent?: string;
  orders?: ConversionOrder[];
};

type ConversionReportResponse = {
  nodes: ConversionNode[];
  pageInfo: { limit?: number; hasNextPage?: boolean; scrollId?: string };
};

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

/** Statuses that count toward active sales (match typical affiliate panel defaults). */
const ACTIVE_STATUSES = new Set(["UNPAID", "PENDING", "COMPLETED"]);

export type SyncShopeeConversionsOptions = {
  purchaseTimeStart: Date;
  purchaseTimeEnd: Date;
  /** Max scroll pages per call (rate-limit safe). Default 5. */
  maxPages?: number;
};

export async function syncShopeeConversions(
  profileId: string,
  options: SyncShopeeConversionsOptions,
): Promise<{ upserted: number; pages: number; complete: boolean }> {
  if (!hasShopeeCredentials()) {
    throw new Error("Credenciais da Shopee não configuradas");
  }

  // Shopee GraphQL Int64 scalars require string-encoded values in the JSON body
  // (numeric JSON numbers are rejected with "wrong type").
  const purchaseTimeStart = String(Math.floor(options.purchaseTimeStart.getTime() / 1000));
  const purchaseTimeEnd = String(Math.floor(options.purchaseTimeEnd.getTime() / 1000));
  const maxPages = Math.max(1, Math.min(20, options.maxPages ?? 5));
  const limit = 50;

  let scrollId: string | undefined;
  let pages = 0;
  let upserted = 0;
  let hasNextPage = true;
  const now = new Date();

  while (hasNextPage && pages < maxPages) {
    const variables: Record<string, unknown> = {
      purchaseTimeStart,
      purchaseTimeEnd,
      limit,
    };
    const query = scrollId ? CONVERSION_QUERY_SCROLL : CONVERSION_QUERY;
    if (scrollId) variables.scrollId = scrollId;

    const data = await shopeeRequest<{ conversionReport: ConversionReportResponse }>(
      query,
      variables,
    );
    const report = data.conversionReport;
    pages += 1;

    const rows: Array<{
      profileId: string;
      conversionId: string;
      purchaseTime: Date;
      clickTime: Date | null;
      totalCommission: number;
      sellerCommission: number;
      shopeeCommissionCapped: number;
      buyerType: string | null;
      device: string | null;
      utmContent: string | null;
      orderId: string;
      orderStatus: string;
      itemId: string;
      lineIndex: number;
      itemName: string;
      shopName: string;
      itemPrice: number;
      qty: number;
      itemTotalCommission: number;
      attributionType: string | null;
      lastSyncedAt: Date;
    }> = [];

    for (const node of report.nodes ?? []) {
      const conversionId = str(node.conversionId);
      if (!conversionId) continue;
      const purchaseTime = node.purchaseTime
        ? new Date(node.purchaseTime * 1000)
        : now;
      const clickTime = node.clickTime ? new Date(node.clickTime * 1000) : null;
      const orders = node.orders?.length ? node.orders : [{ orderId: "", orderStatus: "", items: [{}] }];

      for (const order of orders) {
        const items = order.items?.length ? order.items : [{}];
        items.forEach((item, lineIndex) => {
          rows.push({
            profileId,
            conversionId,
            purchaseTime,
            clickTime,
            totalCommission: num(node.totalCommission),
            sellerCommission: num(node.sellerCommission),
            shopeeCommissionCapped: num(node.shopeeCommissionCapped),
            buyerType: node.buyerType ?? null,
            device: node.device ?? null,
            utmContent: node.utmContent ?? null,
            orderId: str(order.orderId),
            orderStatus: str(order.orderStatus).toUpperCase(),
            itemId: str(item.itemId),
            lineIndex,
            itemName: item.itemName ?? "",
            shopName: item.shopName ?? "",
            itemPrice: num(item.itemPrice),
            qty: Math.max(0, Math.floor(num(item.qty) || 0)),
            itemTotalCommission: num(item.itemTotalCommission),
            attributionType: item.attributionType ?? null,
            lastSyncedAt: now,
          });
        });
      }
    }

    // Upsert in batches
    for (let i = 0; i < rows.length; i += 25) {
      const batch = rows.slice(i, i + 25);
      await prisma.$transaction(
        batch.map((row) =>
          prisma.shopeeConversion.upsert({
            where: {
              profileId_conversionId_orderId_itemId_lineIndex: {
                profileId: row.profileId,
                conversionId: row.conversionId,
                orderId: row.orderId,
                itemId: row.itemId,
                lineIndex: row.lineIndex,
              },
            },
            create: row,
            update: {
              purchaseTime: row.purchaseTime,
              clickTime: row.clickTime,
              totalCommission: row.totalCommission,
              sellerCommission: row.sellerCommission,
              shopeeCommissionCapped: row.shopeeCommissionCapped,
              buyerType: row.buyerType,
              device: row.device,
              utmContent: row.utmContent,
              orderStatus: row.orderStatus,
              itemName: row.itemName,
              shopName: row.shopName,
              itemPrice: row.itemPrice,
              qty: row.qty,
              itemTotalCommission: row.itemTotalCommission,
              attributionType: row.attributionType,
              lastSyncedAt: row.lastSyncedAt,
            },
          }),
        ),
        { timeout: 30_000 },
      );
      upserted += batch.length;
    }

    hasNextPage = Boolean(report.pageInfo?.hasNextPage);
    scrollId = report.pageInfo?.scrollId;
    if (!report.nodes?.length) hasNextPage = false;
  }

  return { upserted, pages, complete: !hasNextPage };
}

export type ShopeeMetricsSummary = {
  totalCommission: number;
  revenueGmv: number;
  conversions: number;
  orders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  itemsSold: number;
  lastSyncedAt: Date | null;
  rowCount: number;
};

/**
 * Aggregate stored conversion rows for a profile + optional purchase-time window.
 * Excludes CANCELLED from commission / GMV / items / conversion counts (panel default).
 * Order status breakdown still includes cancelled for transparency.
 */
export async function getShopeeMetricsSummary(
  profileId: string,
  from?: Date | null,
  to?: Date | null,
): Promise<ShopeeMetricsSummary> {
  const purchaseTime =
    from || to
      ? {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        }
      : undefined;

  const rows = await prisma.shopeeConversion.findMany({
    where: {
      profileId,
      ...(purchaseTime ? { purchaseTime } : {}),
    },
    select: {
      conversionId: true,
      orderId: true,
      orderStatus: true,
      itemTotalCommission: true,
      totalCommission: true,
      itemPrice: true,
      qty: true,
      lastSyncedAt: true,
    },
  });

  const activeRows = rows.filter((r) => ACTIVE_STATUSES.has(r.orderStatus) || !r.orderStatus);
  const conversionIds = new Set(activeRows.map((r) => r.conversionId));
  const orderIds = new Set(
    activeRows.map((r) => r.orderId || r.conversionId).filter(Boolean),
  );
  const completedOrders = new Set(
    rows.filter((r) => r.orderStatus === "COMPLETED").map((r) => r.orderId || r.conversionId),
  );
  const pendingOrders = new Set(
    rows
      .filter((r) => r.orderStatus === "PENDING" || r.orderStatus === "UNPAID")
      .map((r) => r.orderId || r.conversionId),
  );
  const cancelledOrders = new Set(
    rows.filter((r) => r.orderStatus === "CANCELLED").map((r) => r.orderId || r.conversionId),
  );

  // Commission: prefer sum of item commissions; fall back to conversion-level total once per conversionId
  let totalCommission = activeRows.reduce((s, r) => s + (r.itemTotalCommission || 0), 0);
  if (totalCommission === 0) {
    const seen = new Set<string>();
    for (const r of activeRows) {
      if (seen.has(r.conversionId)) continue;
      seen.add(r.conversionId);
      totalCommission += r.totalCommission || 0;
    }
  }

  const revenueGmv = activeRows.reduce((s, r) => s + (r.itemPrice || 0) * (r.qty || 0), 0);
  const itemsSold = activeRows.reduce((s, r) => s + (r.qty || 0), 0);
  const lastSyncedAt = rows.reduce<Date | null>(
    (latest, r) => (!latest || r.lastSyncedAt > latest ? r.lastSyncedAt : latest),
    null,
  );

  return {
    totalCommission,
    revenueGmv,
    conversions: conversionIds.size,
    orders: orderIds.size,
    completedOrders: completedOrders.size,
    pendingOrders: pendingOrders.size,
    cancelledOrders: cancelledOrders.size,
    itemsSold,
    lastSyncedAt,
    rowCount: rows.length,
  };
}

/** Per-item commission totals keyed by Shopee itemId (string). */
export async function getShopeeCommissionByItemId(
  profileId: string,
  itemIds: string[],
  from?: Date | null,
  to?: Date | null,
): Promise<Map<string, { commission: number; qty: number; conversions: number }>> {
  const map = new Map<string, { commission: number; qty: number; conversions: number }>();
  if (!itemIds.length) return map;

  const purchaseTime =
    from || to
      ? {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        }
      : undefined;

  const rows = await prisma.shopeeConversion.findMany({
    where: {
      profileId,
      itemId: { in: itemIds },
      ...(purchaseTime ? { purchaseTime } : {}),
      orderStatus: { not: "CANCELLED" },
    },
    select: {
      itemId: true,
      itemTotalCommission: true,
      qty: true,
      conversionId: true,
    },
  });

  const conversionSets = new Map<string, Set<string>>();
  for (const row of rows) {
    const current = map.get(row.itemId) ?? { commission: 0, qty: 0, conversions: 0 };
    current.commission += row.itemTotalCommission || 0;
    current.qty += row.qty || 0;
    map.set(row.itemId, current);
    if (!conversionSets.has(row.itemId)) conversionSets.set(row.itemId, new Set());
    conversionSets.get(row.itemId)!.add(row.conversionId);
  }
  for (const [itemId, set] of conversionSets) {
    const current = map.get(itemId);
    if (current) current.conversions = set.size;
  }
  return map;
}

/** Background cron: refresh last 90 days for all profiles that have any ShopeeOffer cache (or all if few). */
export async function runShopeeConversionsSyncAll(maxProfiles = 5) {
  if (!hasShopeeCredentials()) return { profiles: 0, totalUpserted: 0 };

  // Prefer profiles that already use Shopee catalog/products.
  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { shopeeOffers: { some: {} } },
        { products: { some: { marketplace: "shopee" } } },
        { marketplaceAccounts: { some: { marketplace: "shopee" } } },
      ],
    },
    select: { id: true },
    take: maxProfiles,
  });

  const end = new Date();
  const start = new Date(end.getTime() - 90 * 86400000);
  let totalUpserted = 0;

  for (const profile of profiles) {
    try {
      const result = await syncShopeeConversions(profile.id, {
        purchaseTimeStart: start,
        purchaseTimeEnd: end,
        maxPages: 8,
      });
      totalUpserted += result.upserted;
    } catch {
      // Continue other profiles
    }
  }

  return { profiles: profiles.length, totalUpserted };
}
