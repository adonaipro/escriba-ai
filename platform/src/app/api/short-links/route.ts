import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrReuseNarrativeShortLink, publicShortUrl } from "@/lib/short-links";

export const runtime = "nodejs";

const createSchema = z.object({
  destinationUrl: z.string().url(),
  socialAccountId: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  trendId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  marketplace: z.string().max(50).optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const campaignId = request.nextUrl.searchParams.get("campaignId") || undefined;
  const productId = request.nextUrl.searchParams.get("productId") || undefined;
  const socialAccountId = request.nextUrl.searchParams.get("socialAccountId") || undefined;
  const links = await prisma.shortLink.findMany({
    where: { workspaceId: session.user.profile.id, campaignId, productId, socialAccountId },
    include: {
      _count: { select: { clicks: true } },
      campaign: { select: { id: true, name: true } },
      product: { select: { id: true, name: true } },
      socialAccount: { select: { id: true, username: true } },
      trend: { select: { id: true, hook: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ links: links.map((link) => ({ ...link, shortUrl: publicShortUrl(link.code) })) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = createSchema.parse(await request.json());
    if (data.campaignId) {
      const campaign = await prisma.campaign.findFirst({ where: { id: data.campaignId, profileId: session.user.profile.id }, select: { id: true } });
      if (!campaign) return NextResponse.json({ error: "Campanha inválida" }, { status: 400 });
    }
    const link = await createOrReuseNarrativeShortLink({ ...data, workspaceId: session.user.profile.id });
    return NextResponse.json({ link: { ...link, shortUrl: publicShortUrl(link.code) } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 400 });
  }
}
