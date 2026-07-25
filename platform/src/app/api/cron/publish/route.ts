export const runtime = "nodejs";
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { runDueThreadsPublications } from "@/lib/publishing/runner";
import { runCampaignRecurrence } from "@/lib/scheduling/recurrence";
import { runThreadsInsightsSync } from "@/lib/publishing/insights-runner";
import { runShopeeConversionsSyncAll } from "@/lib/providers/shopee-conversions";

export async function GET(request: NextRequest) {
  const secret = process.env.PUBLISHER_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const generated = await runCampaignRecurrence();
  const results = await runDueThreadsPublications();
  const insights = await runThreadsInsightsSync();
  const shopee = await runShopeeConversionsSyncAll().catch(() => ({ profiles: 0, totalUpserted: 0 }));
  return NextResponse.json({
    generated: generated.length,
    processed: results.length,
    insights: insights.length,
    shopee,
    results,
  });
}
