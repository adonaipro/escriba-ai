export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ACCOUNT_COOKIE, ACCOUNT_COOKIE_MAX_AGE, getSelectedAccountId } from "@/lib/account";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = session.user.profile.id;
  const selectedId = await getSelectedAccountId(profileId);

  const accounts = await prisma.socialAccount.findMany({
    where: { profileId, status: "active" },
    include: {
      accountNarrators: {
        where: { isActive: true },
        include: { narrator: { select: { id: true, name: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const selected = selectedId ? accounts.find((a) => a.id === selectedId) ?? null : null;

  return NextResponse.json({
    selectedAccountId: selectedId,
    selected,
    accounts,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await request.json();
  if (!accountId || typeof accountId !== "string") {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  const profileId = session.user.profile.id;

  const account = await prisma.socialAccount.findFirst({
    where: { id: accountId, profileId, status: "active" },
    include: {
      accountNarrators: {
        where: { isActive: true },
        include: { narrator: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
  }

  // Persist preference to DB so it survives cookie expiry
  await prisma.profile.update({
    where: { id: profileId },
    data: { activeAccountId: accountId },
  });

  const response = NextResponse.json({ account });

  // Write non-HttpOnly cookie so client JS can also read it
  response.cookies.set(ACCOUNT_COOKIE, accountId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: ACCOUNT_COOKIE_MAX_AGE,
  });

  return response;
}
