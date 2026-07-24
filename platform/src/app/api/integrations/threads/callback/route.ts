export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptThreadsToken } from "@/lib/integrations/threads/crypto";
import { exchangeForLongLivedToken, exchangeThreadsCode, getThreadsProfile, THREADS_OAUTH_SCOPES } from "@/lib/integrations/threads/client";

function integrationsUrl(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/integracoes", process.env.NEXTAUTH_URL || request.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.redirect(integrationsUrl(request, { threads_error: "Sessao expirada" }));
  const store = await cookies();
  const expectedState = store.get("threads_oauth_state")?.value;
  store.delete("threads_oauth_state");
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error_message") || request.nextUrl.searchParams.get("error");
  if (oauthError) return NextResponse.redirect(integrationsUrl(request, { threads_error: oauthError }));
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(integrationsUrl(request, { threads_error: "Retorno OAuth invalido" }));
  }

  try {
    const shortToken = await exchangeThreadsCode(code);
    const longToken = await exchangeForLongLivedToken(shortToken);
    const profile = await getThreadsProfile(longToken.accessToken);
    const profileId = session.user.profile.id;
    const existing = await prisma.socialAccount.findFirst({
      where: { profileId, network: "threads", OR: [{ externalId: profile.id }, { username: profile.username }] },
      orderBy: { isMock: "desc" },
    });
    const data = {
      username: profile.username,
      displayName: profile.name || profile.username,
      avatarUrl: profile.threads_profile_picture_url || null,
      externalId: profile.id,
      accessToken: encryptThreadsToken(longToken.accessToken),
      tokenExpiresAt: new Date(Date.now() + longToken.expiresIn * 1000),
      tokenScopes: THREADS_OAUTH_SCOPES.join(","),
      isMock: false,
      status: "active",
      lastVerifiedAt: new Date(),
    };
    const savedAccount = existing
      ? await prisma.socialAccount.update({ where: { id: existing.id }, data })
      : await prisma.socialAccount.create({ data: { profileId, network: "threads", ...data } });
    await prisma.publication.updateMany({
      where: { campaign: { socialAccountId: savedAccount.id }, status: "published" },
      data: { metricsSyncedAt: null, metricsLastError: null },
    });
    return NextResponse.redirect(integrationsUrl(request, { threads_connected: "1" }));
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 180) : "Falha ao conectar Threads";
    return NextResponse.redirect(integrationsUrl(request, { threads_error: message }));
  }
}
