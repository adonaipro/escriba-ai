import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// PATCH /api/account-narrators/[id] — activate or deactivate a link
// Body: { isActive: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const profileId = session.user.profile.id;
  const body = await req.json() as { isActive?: boolean };

  const link = await prisma.accountNarrator.findUnique({
    where: { id },
    include: {
      narrator: { select: { profileId: true } },
      socialAccount: { select: { profileId: true } },
    },
  });

  if (!link || link.narrator.profileId !== profileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.isActive === true) {
    // Deactivate any currently active narrator for this account first
    await prisma.accountNarrator.updateMany({
      where: { socialAccountId: link.socialAccountId, isActive: true, id: { not: id } },
      data: { isActive: false, endedAt: new Date() },
    });
  }

  const updated = await prisma.accountNarrator.update({
    where: { id },
    data: {
      isActive: body.isActive ?? link.isActive,
      ...(body.isActive === false ? { endedAt: new Date() } : {}),
      ...(body.isActive === true ? { startedAt: new Date(), endedAt: null } : {}),
    },
  });

  return NextResponse.json({ link: updated });
}

// DELETE /api/account-narrators/[id] — deactivate a link
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const profileId = session.user.profile.id;

  const link = await prisma.accountNarrator.findUnique({
    where: { id },
    include: { narrator: { select: { profileId: true } } },
  });

  if (!link || link.narrator.profileId !== profileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.accountNarrator.update({
    where: { id },
    data: { isActive: false, endedAt: new Date() },
  });

  return NextResponse.json({ link: updated });
}
