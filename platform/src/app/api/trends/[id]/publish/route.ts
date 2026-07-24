export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { publishTrendToThreads } from "@/lib/integrations/threads/publisher";
import { prisma } from "@/lib/db";
import {
  findOversizedThreadsPosts,
  formatOversizedThreadsPostsError,
} from "@/lib/publishing/threads-limits";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let trendId: string | null = null;
  let previousStatus = "scheduled";
  try {
    const { id } = await params;
    trendId = id;
    const trend = await prisma.trend.findFirst({
      where: { id, campaign: { profileId: session.user.profile.id } },
      select: {
        status: true,
        posts: { select: { position: true, content: true }, orderBy: { position: "asc" } },
      },
    });
    if (!trend) return NextResponse.json({ error: "História não encontrada" }, { status: 404 });
    if (trend.status === "publishing") {
      return NextResponse.json(
        { error: "Esta história já está sendo publicada. Aguarde alguns segundos." },
        { status: 409 },
      );
    }
    if (trend.status === "published") {
      return NextResponse.json({ error: "Esta história já foi publicada." }, { status: 409 });
    }

    // Defensive: never claim oversized content into "publishing"
    const oversized = findOversizedThreadsPosts(trend.posts);
    if (oversized.length > 0) {
      const message = formatOversizedThreadsPostsError(oversized);
      if (trend.status === "scheduled") {
        await prisma.$transaction([
          prisma.trend.updateMany({
            where: { id, status: "scheduled" },
            data: { status: "failed" },
          }),
          prisma.publication.updateMany({
            where: { trendId: id, status: "scheduled" },
            data: { status: "failed", lastError: message, attempts: { increment: 1 } },
          }),
        ]);
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    previousStatus = trend.status;
    const claimed = await prisma.trend.updateMany({
      where: { id, status: { notIn: ["published", "publishing"] } },
      data: { status: "publishing" },
    });
    if (!claimed.count) return NextResponse.json({ error: "Esta história já foi publicada." }, { status: 409 });
    return NextResponse.json(await publishTrendToThreads(id, session.user.profile.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao publicar no Threads";
    if (trendId) {
      const permanentFailure = /limite de 500|at most 500|excede o limite/i.test(message);
      await prisma.$transaction([
        prisma.trend.updateMany({
          where: { id: trendId, status: "publishing" },
          data: {
            status: permanentFailure
              ? "failed"
              : previousStatus === "draft"
                ? "draft"
                : "scheduled",
          },
        }),
        prisma.publication.updateMany({
          where: { trendId, status: "scheduled" },
          data: permanentFailure
            ? { status: "failed", lastError: message, attempts: { increment: 1 } }
            : { lastError: message },
        }),
      ]).catch(() => undefined);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
