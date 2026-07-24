import { prisma } from "@/lib/db";
import { publishTrendToThreads } from "@/lib/integrations/threads/publisher";
import {
  findOversizedThreadsPosts,
  formatOversizedThreadsPostsError,
} from "@/lib/publishing/threads-limits";

export async function runDueThreadsPublications(take = 5) {
  const due = await prisma.trend.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: new Date() },
      campaign: {
        targetNetwork: "threads",
        socialAccount: { isMock: false, status: "active", accessToken: { not: null } },
      },
    },
    select: {
      id: true,
      campaign: { select: { profileId: true } },
      posts: { select: { position: true, content: true }, orderBy: { position: "asc" } },
    },
    orderBy: { scheduledAt: "asc" },
    take,
  });
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const item of due) {
    // Defensive: never claim oversized content into "publishing"
    const oversized = findOversizedThreadsPosts(item.posts);
    if (oversized.length > 0) {
      const message = formatOversizedThreadsPostsError(oversized);
      await prisma.$transaction([
        prisma.trend.updateMany({
          where: { id: item.id, status: "scheduled" },
          data: { status: "failed" },
        }),
        prisma.publication.updateMany({
          where: { trendId: item.id, status: "scheduled" },
          data: { status: "failed", lastError: message, attempts: { increment: 1 } },
        }),
      ]);
      results.push({ id: item.id, ok: false, error: message });
      continue;
    }

    const claimed = await prisma.trend.updateMany({
      where: { id: item.id, status: "scheduled" },
      data: { status: "publishing" },
    });
    if (!claimed.count) continue;
    try {
      await publishTrendToThreads(item.id, item.campaign.profileId);
      results.push({ id: item.id, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha";
      const permanentFailure =
        /excede o limite de 500|at most 500|acima do limite de 500|Historia sem posts|Conecte uma conta Threads real|Token Threads expirado/i.test(
          message,
        );
      await prisma.$transaction([
        prisma.trend.update({
          where: { id: item.id },
          data: { status: permanentFailure ? "failed" : "scheduled" },
        }),
        prisma.publication.updateMany({
          where: { trendId: item.id, status: "scheduled" },
          data: {
            status: permanentFailure ? "failed" : "scheduled",
            lastError: message,
            attempts: { increment: 1 },
          },
        }),
      ]);
      results.push({ id: item.id, ok: false, error: message });
    }
  }
  return results;
}
