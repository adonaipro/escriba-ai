export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedAccountId } from "@/lib/account";
import {
  classifyContentType,
  detectTheme,
  modelLabel,
  narratorLabel,
  renderDailyExport,
  type ExportStory,
} from "@/lib/calendar/daily-export";

/**
 * GET /api/calendar/export?date=YYYY-MM-DD&scope=selected|all
 * Downloads a .txt of all stories scheduled that day for the current user's profile.
 * Includes managerial summary (local analysis, no LLM).
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profileId = session.user.profile.id;

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const scope = searchParams.get("scope") === "all" ? "all" : "selected";

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Parâmetro date inválido (use YYYY-MM-DD)." },
      { status: 400 },
    );
  }

  // Day bounds in America/Sao_Paulo (UTC-3, no DST for this use)
  const dayStart = new Date(`${date}T00:00:00-03:00`);
  const dayEnd = new Date(`${date}T23:59:59.999-03:00`);

  let accountFilter: { socialAccountId?: string } = {};
  let scopeLabel = "Todas as contas";

  if (scope === "selected") {
    const accountId = await getSelectedAccountId(profileId);
    if (!accountId) {
      return NextResponse.json(
        { error: "Nenhuma conta social selecionada." },
        { status: 400 },
      );
    }
    accountFilter = { socialAccountId: accountId };
    const acc = await prisma.socialAccount.findFirst({
      where: { id: accountId, profileId },
      select: { username: true, displayName: true },
    });
    scopeLabel = acc?.username
      ? `@${acc.username}`
      : acc?.displayName ?? accountId;
  }

  const publications = await prisma.publication.findMany({
    where: {
      campaign: {
        profileId,
        ...accountFilter,
      },
      trendId: { not: null },
      scheduledAt: { gte: dayStart, lte: dayEnd },
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          aiModel: true,
          socialAccount: {
            select: { username: true, displayName: true },
          },
          narrator: { select: { id: true, name: true } },
        },
      },
      trend: {
        select: {
          id: true,
          hook: true,
          narrativeSummary: true,
          status: true,
          format: true,
          contentMode: true,
          conflictType: true,
          openingStyle: true,
          questionType: true,
          tone: true,
          structureType: true,
          scheduledAt: true,
          narratorId: true,
          narrator: { select: { name: true } },
          posts: {
            orderBy: { position: "asc" },
            select: { position: true, content: true },
          },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // One block per story/trend (not per reply Publication)
  const seen = new Set<string>();
  const trendIds: string[] = [];
  const campaignIds = new Set<string>();
  const draftStories: Array<{
    trendId: string;
    campaignId: string;
    username: string;
    campaign: string;
    campaignAiModel: string;
    campaignNarratorName: string | null;
    trendNarratorName: string | null;
    when: Date;
    status: string;
    trend: NonNullable<(typeof publications)[number]["trend"]>;
    posts: Array<{ position: number; content: string }>;
  }> = [];

  for (const pub of publications) {
    const trendId = pub.trendId!;
    if (seen.has(trendId)) continue;
    seen.add(trendId);

    const trend = pub.trend;
    if (!trend) continue;

    let orderedPosts = trend.posts ?? [];
    if (!orderedPosts.length) {
      orderedPosts = await prisma.trendPost.findMany({
        where: { trendId },
        orderBy: { position: "asc" },
        select: { position: true, content: true },
      });
    }

    const username = pub.campaign.socialAccount?.username
      ? `@${pub.campaign.socialAccount.username}`
      : pub.campaign.socialAccount?.displayName ?? "(sem conta)";

    // Prefer trend-level status when published; otherwise publication status of the lead slot
    const status = trend.status === "published" ? "published" : pub.status;

    draftStories.push({
      trendId,
      campaignId: pub.campaign.id,
      username,
      campaign: pub.campaign.name,
      campaignAiModel: pub.campaign.aiModel,
      campaignNarratorName: pub.campaign.narrator?.name ?? null,
      trendNarratorName: trend.narrator?.name ?? null,
      when: pub.scheduledAt,
      status,
      trend,
      posts: orderedPosts,
    });
    trendIds.push(trendId);
    campaignIds.add(pub.campaign.id);
  }

  // Load generation metadata (character, family, emotion, provider) — already persisted
  const events =
    trendIds.length === 0
      ? []
      : await prisma.campaignEvent.findMany({
          where: {
            campaignId: { in: [...campaignIds] },
            type: "generated",
          },
          orderBy: { createdAt: "desc" },
          take: 500,
          select: { metadata: true, campaignId: true },
        });

  type GenMeta = {
    trendId?: string;
    provider?: string;
    family?: string;
    emotion?: string;
    character?: string;
    role?: string;
    conflictObject?: string;
    contentMode?: string;
  };

  const metaByTrend = new Map<string, GenMeta>();
  for (const ev of events) {
    if (!ev.metadata) continue;
    try {
      const m = JSON.parse(ev.metadata) as GenMeta;
      if (m.trendId && !metaByTrend.has(m.trendId)) {
        metaByTrend.set(m.trendId, m);
      }
    } catch {
      /* ignore malformed legacy metadata */
    }
  }

  const stories: ExportStory[] = draftStories.map((d) => {
    const gen = metaByTrend.get(d.trendId) ?? {};
    const firstContent = d.posts[0]?.content ?? d.trend.hook ?? "";
    const narratorSource = d.trendNarratorName ?? d.campaignNarratorName;
    const { label: narrator, missing: narratorMissing } = narratorLabel(narratorSource);
    const contentMode = d.trend.contentMode ?? gen.contentMode ?? null;
    const classified = classifyContentType({
      contentMode,
      format: d.trend.format,
      questionType: d.trend.questionType,
      hook: d.trend.hook,
      firstPost: firstContent,
    });
    const theme = detectTheme({
      conflictType: d.trend.conflictType,
      family: gen.family,
      emotion: gen.emotion,
      contentMode,
      narrativeSummary: d.trend.narrativeSummary,
      hook: d.trend.hook,
    });
    const premise =
      (d.trend.narrativeSummary && d.trend.narrativeSummary.trim()) ||
      (d.trend.hook && d.trend.hook.trim()) ||
      firstContent.split("\n")[0]?.slice(0, 160) ||
      "";
    const fullText = d.posts.map((p) => p.content).join("\n");
    const character = (gen.character || gen.role || "").trim();
    const conflict =
      (d.trend.conflictType?.trim() || gen.conflictObject?.trim() || "").trim();
    const opening =
      (d.trend.openingStyle?.trim() ||
        (d.trend.hook || firstContent).replace(/\s+/g, " ").trim().slice(0, 120) ||
        "").trim();

    return {
      id: d.trendId,
      username: d.username,
      campaign: d.campaign,
      campaignId: d.campaignId,
      narrator,
      narratorMissing,
      model: modelLabel(d.campaignAiModel, gen.provider),
      contentType: classified.type,
      contentTypeLabel: classified.label,
      theme,
      premise,
      status: d.status,
      when: d.when,
      hook: (d.trend.hook || firstContent).replace(/\s+/g, " ").trim(),
      conflict,
      opening,
      character,
      posts: d.posts,
      fullText,
    };
  });

  const body = renderDailyExport(
    { date, scopeLabel, generatedAt: new Date() },
    stories,
  );

  const filename =
    scope === "all"
      ? `escriba-${date}-todas-contas.txt`
      : `escriba-${date}-${scopeLabel.replace(/[^a-zA-Z0-9@_.-]/g, "_")}.txt`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
