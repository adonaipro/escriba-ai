import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateNarratorName } from "@/lib/narrators/names";
import { generateInitialHypotheses } from "@/lib/narrators/hypothesis-engine";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────
// GET /api/narradores — list narrators for the current profile
// ─────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;

  const narrators = await prisma.narrator.findMany({
    where: { profileId },
    include: {
      hypotheses: true,
      insights: { orderBy: { createdAt: "desc" }, take: 3 },
      _count: { select: { campaigns: true, trends: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ narrators });
}

// ─────────────────────────────────────────────────────────────────
// POST /api/narradores — create narrator from quiz
// ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;
  const niche = session.user.profile.niche;

  const body = await req.json() as {
    sex?: string;
    ageRange?: string;
    maritalStatus?: string;
    hasChildren?: boolean;
    livesAlone?: boolean;
  };

  const { sex, ageRange, maritalStatus, hasChildren = false, livesAlone = false } = body;

  if (!sex || !ageRange || !maritalStatus) {
    return NextResponse.json(
      { error: "sex, ageRange e maritalStatus são obrigatórios" },
      { status: 400 }
    );
  }

  // Get existing names to avoid duplicates
  const existing = await prisma.narrator.findMany({
    where: { profileId },
    select: { name: true },
  });
  const existingNames = existing.map((n) => n.name);

  // Generate AI name based on identity
  const name = generateNarratorName(sex, ageRange, existingNames);

  // Create the narrator
  const narrator = await prisma.narrator.create({
    data: {
      profileId,
      name,
      sex,
      ageRange,
      maritalStatus,
      hasChildren,
      livesAlone,
      status: "active",
    },
  });

  // Auto-generate initial hypotheses for this narrator+niche
  const hypothesisSpecs = generateInitialHypotheses(narrator.id, niche, {
    sex,
    ageRange,
    maritalStatus,
    hasChildren,
    livesAlone,
  });

  if (hypothesisSpecs.length > 0) {
    await prisma.narratorHypothesis.createMany({
      data: hypothesisSpecs,
    });
  }

  const narratorWithHypotheses = await prisma.narrator.findUnique({
    where: { id: narrator.id },
    include: {
      hypotheses: true,
      insights: true,
    },
  });

  return NextResponse.json({ narrator: narratorWithHypotheses }, { status: 201 });
}
