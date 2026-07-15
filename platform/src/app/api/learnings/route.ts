export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const impact = searchParams.get("impact");

  const learnings = await prisma.learning.findMany({
    where: {
      profileId: session.user.profile.id,
      state: "active",
      ...(type ? { type } : {}),
      ...(impact ? { impact } : {}),
    },
    include: {
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { recordedAt: "desc" },
  });

  return NextResponse.json({ learnings });
}
