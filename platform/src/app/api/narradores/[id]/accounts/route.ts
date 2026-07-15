import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────
// GET /api/narradores/[id]/accounts — accounts linked to this narrator
// ─────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: narratorId } = await params;
  const profileId = session.user.profile.id;

  const narrator = await prisma.narrator.findFirst({ where: { id: narratorId, profileId } });
  if (!narrator) {
    return NextResponse.json({ error: "Narrador não encontrado" }, { status: 404 });
  }

  const links = await prisma.accountNarrator.findMany({
    where: { narratorId },
    include: {
      socialAccount: { select: { id: true, network: true, username: true, status: true } },
    },
    orderBy: [{ isActive: "desc" }, { startedAt: "desc" }],
  });

  return NextResponse.json({ links });
}

// ─────────────────────────────────────────────────────────────────
// POST /api/narradores/[id]/accounts — link narrator to a social account
// Body: { socialAccountId, reason? }
// This makes the narrator active for that account (deactivating any prior active narrator)
// ─────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: narratorId } = await params;
  const profileId = session.user.profile.id;
  const body = await req.json() as { socialAccountId?: string; reason?: string };
  const { socialAccountId, reason } = body;

  if (!socialAccountId) {
    return NextResponse.json({ error: "socialAccountId é obrigatório" }, { status: 400 });
  }

  // Verify ownership
  const [narrator, socialAccount] = await Promise.all([
    prisma.narrator.findFirst({ where: { id: narratorId, profileId } }),
    prisma.socialAccount.findFirst({ where: { id: socialAccountId, profileId } }),
  ]);

  if (!narrator) return NextResponse.json({ error: "Narrador não encontrado" }, { status: 404 });
  if (!socialAccount) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  // Deactivate the currently active narrator for this social account
  await prisma.accountNarrator.updateMany({
    where: { socialAccountId, isActive: true },
    data: { isActive: false, endedAt: new Date() },
  });

  // Upsert the link (if already exists from a prior period, create new record would violate unique;
  // instead update to re-activate)
  const existing = await prisma.accountNarrator.findUnique({
    where: { socialAccountId_narratorId: { socialAccountId, narratorId } },
  });

  let link;
  if (existing) {
    link = await prisma.accountNarrator.update({
      where: { socialAccountId_narratorId: { socialAccountId, narratorId } },
      data: {
        isActive: true,
        startedAt: new Date(),
        endedAt: null,
        reason: reason ?? existing.reason,
      },
    });
  } else {
    link = await prisma.accountNarrator.create({
      data: { socialAccountId, narratorId, isActive: true, reason },
    });
  }

  return NextResponse.json({ link }, { status: 201 });
}
