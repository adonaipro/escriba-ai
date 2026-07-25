import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasShopeeCredentials } from "@/lib/providers/shopee-client";
import {
  getShopeeMetricsSummary,
  syncShopeeConversions,
} from "@/lib/providers/shopee-conversions";
import { resolveDateRange } from "@/lib/analytics/date-range";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const range = resolveDateRange(
    url.searchParams.get("period") ?? undefined,
    url.searchParams.get("from") ?? undefined,
    url.searchParams.get("to") ?? undefined,
  );

  const summary = await getShopeeMetricsSummary(
    session.user.profile.id,
    range.from,
    range.to,
  );

  return NextResponse.json({
    ...summary,
    lastSyncedAt: summary.lastSyncedAt?.toISOString() ?? null,
    period: range.period,
    label: range.label,
    credentialsConfigured: hasShopeeCredentials(),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasShopeeCredentials()) {
    return NextResponse.json({ error: "Credenciais da Shopee não configuradas" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    from?: string;
    to?: string;
    days?: number;
    maxPages?: number;
  };

  const end = body.to && /^\d{4}-\d{2}-\d{2}$/.test(body.to)
    ? new Date(`${body.to}T23:59:59.999-03:00`)
    : new Date();
  const days = Math.min(90, Math.max(1, Math.floor(body.days || 30)));
  const start = body.from && /^\d{4}-\d{2}-\d{2}$/.test(body.from)
    ? new Date(`${body.from}T00:00:00-03:00`)
    : new Date(end.getTime() - days * 86400000);

  try {
    const result = await syncShopeeConversions(session.user.profile.id, {
      purchaseTimeStart: start,
      purchaseTimeEnd: end,
      maxPages: body.maxPages ?? 10,
    });
    const summary = await getShopeeMetricsSummary(session.user.profile.id, start, end);
    return NextResponse.json({
      ...result,
      summary: {
        ...summary,
        lastSyncedAt: summary.lastSyncedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao sincronizar conversões Shopee" },
      { status: 502 },
    );
  }
}
