import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────
// GET /api/social-accounts/[id]/narrator — active narrator + history
// ─────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: socialAccountId } = await params;
  const profileId = session.user.profile.id;

  const socialAccount = await prisma.socialAccount.findFirst({
    where: { id: socialAccountId, profileId },
  });
  if (!socialAccount) {
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
  }

  const links = await prisma.accountNarrator.findMany({
    where: { socialAccountId },
    include: {
      narrator: {
        select: {
          id: true, name: true, sex: true, ageRange: true, maritalStatus: true,
          hasChildren: true, livesAlone: true, status: true,
          totalNarratives: true, totalClicks: true, totalImpressions: true,
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { startedAt: "desc" }],
  });

  const active = links.find((l) => l.isActive) ?? null;
  const history = links.filter((l) => !l.isActive);

  return NextResponse.json({ active, history, socialAccount });
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/social-accounts/[id]/narrator — switch active narrator
// Body: { narratorId, reason? }
// ─────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: socialAccountId } = await params;
  const profileId = session.user.profile.id;
  const body = await req.json() as { narratorId?: string; reason?: string };
  const { narratorId, reason } = body;

  if (!narratorId) {
    return NextResponse.json({ error: "narratorId é obrigatório" }, { status: 400 });
  }

  const [socialAccount, narrator] = await Promise.all([
    prisma.socialAccount.findFirst({ where: { id: socialAccountId, profileId } }),
    prisma.narrator.findFirst({ where: { id: narratorId, profileId } }),
  ]);

  if (!socialAccount) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
  if (!narrator) return NextResponse.json({ error: "Narrador não encontrado" }, { status: 404 });

  // Deactivate current
  await prisma.accountNarrator.updateMany({
    where: { socialAccountId, isActive: true },
    data: { isActive: false, endedAt: new Date() },
  });

  // Activate new
  const existing = await prisma.accountNarrator.findUnique({
    where: { socialAccountId_narratorId: { socialAccountId, narratorId } },
  });

  let link;
  if (existing) {
    link = await prisma.accountNarrator.update({
      where: { socialAccountId_narratorId: { socialAccountId, narratorId } },
      data: { isActive: true, startedAt: new Date(), endedAt: null, reason: reason ?? existing.reason },
    });
  } else {
    link = await prisma.accountNarrator.create({
      data: { socialAccountId, narratorId, isActive: true, reason },
    });
  }

  return NextResponse.json({ link, narrator });
}
