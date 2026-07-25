import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function displayName(sex: string): string {
  return sex === "male" ? "Narrador homem" : "Narradora mulher";
}

export async function GET() {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const narrators = await prisma.narrator.findMany({
    where: { profileId: session.user.profile.id },
    select: {
      id: true,
      name: true,
      sex: true,
      status: true,
      createdAt: true,
      _count: { select: { campaigns: true, trends: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    narrators: narrators.map((n) => ({
      ...n,
      label: n.sex === "male" ? "Homem" : "Mulher",
      displayName: displayName(n.sex),
    })),
  });
}

/** Create or reuse a single active narrator per sex. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;
  const body = (await req.json()) as { sex?: string };
  const sex = body.sex === "male" || body.sex === "female" ? body.sex : null;
  if (!sex) {
    return NextResponse.json({ error: "Informe sex: male ou female" }, { status: 400 });
  }

  const existing = await prisma.narrator.findFirst({
    where: { profileId, sex, status: "active" },
  });
  if (existing) {
    return NextResponse.json({ narrator: existing, reused: true }, { status: 200 });
  }

  const name = displayName(sex);
  const narrator = await prisma.narrator.create({
    data: {
      profileId,
      name,
      sex,
      // Legacy required columns — ignored by UI and LLM
      ageRange: "26-35",
      maritalStatus: "other",
      hasChildren: false,
      livesAlone: false,
      status: "active",
    },
  });

  return NextResponse.json({ narrator, reused: false }, { status: 201 });
}
