import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  niche: z.string().min(2).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { name, niche, currentPassword, newPassword } = parsed.data;
  const userId = session.user.id;
  const profileId = session.user.profile.id;

  // Password change
  if (currentPassword && newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
  }

  // Name update
  if (name) {
    await prisma.user.update({ where: { id: userId }, data: { name } });
  }

  // Niche update
  if (niche) {
    await prisma.profile.update({ where: { id: profileId }, data: { niche } });
  }

  return NextResponse.json({ ok: true });
}
