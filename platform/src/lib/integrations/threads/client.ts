const AUTH_URL = "https://threads.net/oauth/authorize";
const API_URL = "https://graph.threads.net";

export const THREADS_OAUTH_SCOPES = [
  "threads_basic",
  "threads_content_publish",
  "threads_manage_insights",
  "threads_manage_replies",
  "threads_read_replies",
  "threads_delete",
] as const;

function required(name: "THREADS_APP_ID" | "THREADS_APP_SECRET"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} nao configurada`);
  return value;
}

export function threadsRedirectUri(): string {
  return process.env.THREADS_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/threads/callback`;
}

export function buildThreadsAuthorizationUrl(state: string): string {
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", required("THREADS_APP_ID"));
  url.searchParams.set("redirect_uri", threadsRedirectUri());
  url.searchParams.set("scope", THREADS_OAUTH_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url.toString();
}

async function graphFetch<T>(url: URL, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000), cache: "no-store" });
  const textBody = await response.text();
  let body: unknown;
  try { body = JSON.parse(textBody); } catch { body = { raw: textBody }; }
  if (!response.ok) throw new Error(`Threads API ${response.status}: ${JSON.stringify(body)}`);
  return body as T;
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function waitForThreadsContainer(containerId: string, accessToken: string): Promise<void> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const url = new URL(`${API_URL}/${containerId}`);
    url.searchParams.set("fields", "status,error_message");
    url.searchParams.set("access_token", accessToken);
    const data = await graphFetch<{ status?: string; error_message?: string }>(url);
    if (data.status === "FINISHED") return;
    if (data.status === "ERROR" || data.status === "EXPIRED") throw new Error(data.error_message || `Threads container ${data.status}`);
    await wait(Math.min(1000 + attempt * 500, 4000));
  }
  throw new Error("A Meta demorou demais para preparar a publicação. Tente novamente.");
}

export async function exchangeThreadsCode(code: string): Promise<string> {
  const url = new URL(`${API_URL}/oauth/access_token`);
  const body = new URLSearchParams({
    client_id: required("THREADS_APP_ID"),
    client_secret: required("THREADS_APP_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: threadsRedirectUri(),
    code,
  });
  const data = await graphFetch<{ access_token: string }>(url, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
  });
  return data.access_token;
}

export async function exchangeForLongLivedToken(shortToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const url = new URL(`${API_URL}/access_token`);
  url.searchParams.set("grant_type", "th_exchange_token");
  url.searchParams.set("client_secret", required("THREADS_APP_SECRET"));
  url.searchParams.set("access_token", shortToken);
  const data = await graphFetch<{ access_token: string; expires_in?: number }>(url);
  return { accessToken: data.access_token, expiresIn: data.expires_in ?? 5_184_000 };
}

export async function getThreadsProfile(accessToken: string): Promise<{ id: string; username: string; name?: string; threads_profile_picture_url?: string }> {
  const url = new URL(`${API_URL}/me`);
  url.searchParams.set("fields", "id,username,name,threads_profile_picture_url");
  url.searchParams.set("access_token", accessToken);
  return graphFetch(url);
}

export async function createTextContainer(userId: string, accessToken: string, text: string, replyToId?: string): Promise<string> {
  const url = new URL(`${API_URL}/${userId}/threads`);
  const body = new URLSearchParams({ media_type: "TEXT", text, access_token: accessToken });
  if (replyToId) body.set("reply_to_id", replyToId);
  const data = await graphFetch<{ id: string }>(url, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
  });
  return data.id;
}

export async function publishContainer(userId: string, accessToken: string, creationId: string): Promise<string> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const url = new URL(`${API_URL}/${userId}/threads_publish`);
      const body = new URLSearchParams({ creation_id: creationId, access_token: accessToken });
      const data = await graphFetch<{ id: string }>(url, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
      });
      return data.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === 3 || (!message.includes('"code":24') && !message.includes("Mídia não encontrada"))) throw error;
      await wait(1500 * (attempt + 1));
    }
  }
  throw new Error("Não foi possível publicar o container no Threads");
}

export async function getThreadPermalink(mediaId: string, accessToken: string): Promise<string | null> {
  const url = new URL(`${API_URL}/${mediaId}`);
  url.searchParams.set("fields", "permalink");
  url.searchParams.set("access_token", accessToken);
  const data = await graphFetch<{ permalink?: string }>(url);
  return data.permalink ?? null;
}

export type ThreadInsights = {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  shares: number;
};

export async function getThreadInsights(mediaId: string, accessToken: string): Promise<ThreadInsights> {
  const url = new URL(`${API_URL}/${mediaId}/insights`);
  url.searchParams.set("metric", "views,likes,replies,reposts,quotes,shares");
  url.searchParams.set("access_token", accessToken);
  const result = await graphFetch<{
    data?: Array<{ name?: string; values?: Array<{ value?: number }> }>;
  }>(url);
  const metrics: ThreadInsights = { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0, shares: 0 };
  for (const item of result.data ?? []) {
    if (!item.name || !(item.name in metrics)) continue;
    const value = item.values?.at(-1)?.value;
    metrics[item.name as keyof ThreadInsights] = Number.isFinite(value) ? Number(value) : 0;
  }
  return metrics;
}
