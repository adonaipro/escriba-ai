export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const job = await prisma.generationJob.findFirst({
    where: {
      id,
      campaign: { profileId: session.user.profile.id },
    },
    select: {
      id: true,
      campaignId: true,
      trendId: true,
      status: true,
      statusLabel: true,
      progress: true,
      error: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
