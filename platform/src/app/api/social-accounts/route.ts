export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  network: z.enum(["threads", "x"]),
  username: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100).optional(),
  narratorId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? "active";

  const accounts = await prisma.socialAccount.findMany({
    where: {
      profileId: session.user.profile.id,
      ...(status !== "all" ? { status } : {}),
    },
    include: {
      accountNarrators: {
        where: { isActive: true },
        include: { narrator: { select: { id: true, name: true } } },
        take: 1,
      },
      _count: { select: { campaigns: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ accounts });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const profileId = session.user.profile.id;

    // Check for duplicate @username on same network
    const existing = await prisma.socialAccount.findFirst({
      where: { profileId, network: data.network, username: data.username },
    });
    if (existing) {
      return NextResponse.json(
        { error: `@${data.username} já está conectado em ${data.network}` },
        { status: 409 }
      );
    }

    const account = await prisma.socialAccount.create({
      data: {
        profileId,
        network: data.network,
        username: data.username,
        displayName: data.displayName ?? data.username,
        status: "active",
        isMock: true,
      },
    });

    // Optionally link narrator
    if (data.narratorId) {
      const narrator = await prisma.narrator.findFirst({
        where: { id: data.narratorId, profileId },
      });
      if (narrator) {
        await prisma.accountNarrator.create({
          data: {
            socialAccountId: account.id,
            narratorId: data.narratorId,
            isActive: true,
          },
        });
      }
    }

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create social account error:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
