export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;

  const events = await prisma.campaignEvent.findMany({
    where: { campaign: { profileId } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      campaign: { select: { id: true, name: true, productName: true } },
    },
  });

  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentCount = events.filter((e) => e.createdAt > cutoff).length;

  return NextResponse.json({ events, recentCount });
}
