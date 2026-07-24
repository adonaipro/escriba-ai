import { prisma } from "@/lib/db";
import { assertThreadsPostsWithinLimit } from "@/lib/publishing/threads-limits";
import { decryptThreadsToken } from "./crypto";
import { createTextContainer, getThreadPermalink, publishContainer, waitForThreadsContainer } from "./client";

export async function publishTrendToThreads(trendId: string, profileId: string) {
  const trend = await prisma.trend.findFirst({
    where: { id: trendId, campaign: { profileId } },
    include: {
      posts: { orderBy: { position: "asc" } },
      campaign: { include: { socialAccount: true } },
    },
  });
  if (!trend) throw new Error("Historia nao encontrada");
  if (trend.status === "published") throw new Error("Historia ja publicada");
  const account = trend.campaign.socialAccount;
  if (!account || account.network !== "threads" || account.isMock || !account.accessToken || !account.externalId) {
    throw new Error("Conecte uma conta Threads real a esta campanha");
  }
  if (account.tokenExpiresAt && account.tokenExpiresAt <= new Date()) throw new Error("Token Threads expirado; reconecte a conta");
  if (trend.posts.length === 0) throw new Error("Historia sem posts");
  // Never truncate — hard-fail oversized posts (claim should already be blocked upstream)
  assertThreadsPostsWithinLimit(trend.posts);

  const accessToken = decryptThreadsToken(account.accessToken);
  let replyToId: string | undefined;
  let rootUrl: string | null = null;

  for (const post of trend.posts) {
    if (post.externalId) {
      replyToId = post.externalId;
      rootUrl ||= post.externalUrl;
      continue;
    }
    const containerId = await createTextContainer(account.externalId, accessToken, post.content, replyToId);
    await waitForThreadsContainer(containerId, accessToken);
    const mediaId = await publishContainer(account.externalId, accessToken, containerId);
    const permalink = await getThreadPermalink(mediaId, accessToken).catch(() => null);
    await prisma.trendPost.update({
      where: { id: post.id },
      data: { externalId: mediaId, externalUrl: permalink, publishedAt: new Date() },
    });
    await prisma.publication.updateMany({
      where: { trendPostId: post.id },
      data: { status: "published", publishedAt: new Date(), externalId: mediaId, externalUrl: permalink, lastError: null },
    });
    replyToId = mediaId;
    rootUrl ||= permalink;
    if (post.position < trend.posts.length) await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  await prisma.trend.update({ where: { id: trend.id }, data: { status: "published", publishedAt: new Date() } });
  await prisma.campaignEvent.create({
    data: { campaignId: trend.campaignId, type: "published", title: "Historia publicada no Threads", description: rootUrl ?? `@${account.username}` },
  });
  return { trendId: trend.id, url: rootUrl, account: account.username };
}
