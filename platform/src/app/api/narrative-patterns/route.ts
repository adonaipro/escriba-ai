export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patterns = await prisma.narrativePattern.findMany({
    where: { profileId: session.user.profile.id },
    orderBy: [{ winCount: "desc" }, { usageCount: "desc" }],
  });

  // Group by type
  const byType: Record<string, typeof patterns> = {};
  for (const p of patterns) {
    if (!byType[p.type]) byType[p.type] = [];
    byType[p.type].push(p);
  }

  const totalUsage = patterns.reduce((s, p) => s + p.usageCount, 0);
  const totalWins = patterns.reduce((s, p) => s + p.winCount, 0);

  return NextResponse.json({ patterns, byType, totalUsage, totalWins });
}
