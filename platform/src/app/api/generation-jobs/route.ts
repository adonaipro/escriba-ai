export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { processGenerationJob } from "@/lib/generation-service";

const createSchema = z.object({
  campaignId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { campaignId } = createSchema.parse(body);

    // Verify campaign belongs to this profile
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, profileId: session.user.profile.id },
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const job = await prisma.generationJob.create({
      data: { campaignId },
    });

    // Fire and forget — processes in background while client polls
    void processGenerationJob(job.id);

    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/generation-jobs error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
