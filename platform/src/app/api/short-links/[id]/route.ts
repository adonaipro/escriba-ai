import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicShortUrl, validateDestinationUrl } from "@/lib/short-links";

export const runtime = "nodejs";

const updateSchema = z.object({ destinationUrl: z.string().url().optional(), isActive: z.boolean().optional() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.shortLink.findFirst({ where: { id, workspaceId: session.user.profile.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const data = updateSchema.parse(await request.json());
    const updated = await prisma.shortLink.update({
      where: { id },
      data: { ...data, ...(data.destinationUrl ? { destinationUrl: validateDestinationUrl(data.destinationUrl) } : {}) },
    });
    return NextResponse.json({ link: { ...updated, shortUrl: publicShortUrl(updated.code) } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 400 });
  }
}
