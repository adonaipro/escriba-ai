import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isPreviewBot, registerShortLinkClick } from "@/lib/short-links";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function neutralPreviewResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    },
  });
}

async function findActive(code: string) {
  return prisma.shortLink.findUnique({ where: { code }, select: { id: true, destinationUrl: true, isActive: true } });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = await findActive(code);
  if (!link?.isActive) return new NextResponse("Link indisponível", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  const userAgent = request.headers.get("user-agent");
  if (isPreviewBot(userAgent)) return neutralPreviewResponse();

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const tracking = await registerShortLinkClick({
    shortLinkId: link.id,
    ip,
    userAgent,
    referer: request.headers.get("referer"),
    country: request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry"),
  });
  if (tracking.rateLimited) return new NextResponse("Muitas solicitações", { status: 429, headers: { "Retry-After": "60" } });
  return NextResponse.redirect(link.destinationUrl, { status: 302, headers: { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" } });
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const link = await findActive(code);
  if (!link?.isActive) return new NextResponse(null, { status: 404 });
  if (isPreviewBot(request.headers.get("user-agent"))) return neutralPreviewResponse();
  return NextResponse.redirect(link.destinationUrl, { status: 302, headers: { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" } });
}
