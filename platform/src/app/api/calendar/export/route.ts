export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedAccountId } from "@/lib/account";

/**
 * GET /api/calendar/export?date=YYYY-MM-DD&scope=selected|all
 * Downloads a .txt of all stories scheduled that day for the current user's profile.
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
        profileId, // never leak other users
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
          socialAccount: {
            select: { username: true, displayName: true },
          },
          narrator: { select: { name: true } },
        },
      },
      trend: {
        select: {
          id: true,
          hook: true,
          status: true,
          scheduledAt: true,
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
  const stories: Array<{
    username: string;
    campaign: string;
    narrator: string;
    when: Date;
    status: string;
    title: string;
    posts: Array<{ position: number; content: string }>;
  }> = [];

  for (const pub of publications) {
    const trendId = pub.trendId!;
    if (seen.has(trendId)) continue;
    seen.add(trendId);

    const trend = pub.trend;
    let orderedPosts = trend?.posts ?? [];
    if (!orderedPosts.length) {
      orderedPosts = await prisma.trendPost.findMany({
        where: { trendId },
        orderBy: { position: "asc" },
        select: { position: true, content: true },
      });
    }

    const username =
      pub.campaign.socialAccount?.username
        ? `@${pub.campaign.socialAccount.username}`
        : pub.campaign.socialAccount?.displayName ?? "(sem conta)";

    const firstContent = orderedPosts[0]?.content ?? trend?.hook ?? "";
    const title =
      (trend?.hook && trend.hook.trim()) ||
      firstContent.split("\n")[0]?.slice(0, 120) ||
      "(sem título)";

    stories.push({
      username,
      campaign: pub.campaign.name,
      narrator: pub.campaign.narrator?.name ?? "(sem narrador)",
      when: pub.scheduledAt,
      status: pub.status,
      title,
      posts: orderedPosts,
    });
  }

  const fmtWhen = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);

  const lines: string[] = [
    `Escriba — Exportação diária`,
    `Data: ${date}`,
    `Escopo: ${scopeLabel}`,
    `Histórias: ${stories.length}`,
    `Gerado em: ${fmtWhen(new Date())}`,
    "",
  ];

  if (stories.length === 0) {
    lines.push("(Nenhuma publicação neste dia para o escopo selecionado.)");
  }

  for (let i = 0; i < stories.length; i++) {
    const s = stories[i]!;
    lines.push("════════════════════════════════════════════════════════════");
    lines.push(`#${i + 1}`);
    lines.push(`Conta:     ${s.username}`);
    lines.push(`Campanha:  ${s.campaign}`);
    lines.push(`Narrador:  ${s.narrator}`);
    lines.push(`Data/hora: ${fmtWhen(s.when)}`);
    lines.push(`Status:    ${s.status}`);
    lines.push(`Título:    ${s.title}`);
    lines.push("");
    if (s.posts.length === 0) {
      lines.push("(sem posts)");
    } else {
      for (const post of s.posts) {
        lines.push(`--- Post ${post.position} ---`);
        lines.push(post.content);
        lines.push("");
      }
    }
    lines.push("");
  }

  const body = lines.join("\n");
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
