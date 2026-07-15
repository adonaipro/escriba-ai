import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────
// GET /api/recommendations — list recommendations for this profile
// ─────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;

  const recommendations = await prisma.narratorRecommendation.findMany({
    where: { profileId },
    include: {
      targetNarrator: { select: { id: true, name: true, sex: true, ageRange: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ recommendations });
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/recommendations — update status (accept / dismiss)
// Body: { id, action: "accept" | "dismiss" }
// ─────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;
  const body = await req.json() as { id?: string; action?: string };
  const { id, action } = body;

  if (!id || !action || !["accept", "dismiss"].includes(action)) {
    return NextResponse.json({ error: "id e action (accept|dismiss) são obrigatórios" }, { status: 400 });
  }

  const rec = await prisma.narratorRecommendation.findFirst({
    where: { id, profileId },
  });

  if (!rec) {
    return NextResponse.json({ error: "Recomendação não encontrada" }, { status: 404 });
  }

  const updated = await prisma.narratorRecommendation.update({
    where: { id },
    data: {
      status: action === "accept" ? "accepted" : "dismissed",
      resolvedAt: new Date(),
    },
  });

  return NextResponse.json({ recommendation: updated });
}
