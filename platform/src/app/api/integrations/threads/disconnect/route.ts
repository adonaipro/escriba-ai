export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ accountId: z.string().min(1) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Conta invalida" }, { status: 400 });
  const account = await prisma.socialAccount.findFirst({ where: { id: parsed.data.accountId, profileId: session.user.profile.id, network: "threads" } });
  if (!account) return NextResponse.json({ error: "Conta nao encontrada" }, { status: 404 });
  await prisma.socialAccount.update({ where: { id: account.id }, data: { accessToken: null, tokenExpiresAt: null, tokenScopes: null, status: "disconnected" } });
  return NextResponse.json({ ok: true });
}
