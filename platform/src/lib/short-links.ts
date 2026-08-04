import { createHash, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const CODE_LENGTH = 8;
const UNIQUE_WINDOW_MS = 30 * 60 * 1000;
const PREVIEW_BOT_RE = /facebookexternalhit|facebot|meta-externalagent|meta-externalfetcher|threads|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot/i;

export type ShortLinkContext = {
  destinationUrl: string;
  workspaceId: string;
  socialAccountId?: string | null;
  campaignId?: string | null;
  trendId?: string | null;
  productId?: string | null;
  marketplace?: string | null;
};

export function validateDestinationUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("A URL de destino deve usar http ou https.");
  }
  if (url.username || url.password) throw new Error("Credenciais na URL não são permitidas.");
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Destino local ou interno não permitido.");
  }
  const ipVersion = isIP(hostname);
  if (ipVersion === 4) {
    const parts = hostname.split(".").map(Number);
    const blocked = parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) || parts[0] >= 224;
    if (blocked) throw new Error("Destino IP privado ou reservado não permitido.");
  }
  if (ipVersion === 6 && (hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80:"))) {
    throw new Error("Destino IPv6 privado ou reservado não permitido.");
  }
  return url.toString();
}

export function isPreviewBot(userAgent: string | null): boolean {
  return PREVIEW_BOT_RE.test(userAgent ?? "");
}

export function hashIp(ip: string): string {
  const salt = process.env.SHORT_LINK_IP_SALT || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "escriba-local-short-link-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function publicShortUrl(code: string): string {
  const origin = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://escribaai.duckdns.org").replace(/\/$/, "");
  return `${origin}/go/${code}`;
}

function randomCode(): string {
  return randomBytes(9).toString("base64url").slice(0, CODE_LENGTH);
}

export async function createOrReuseNarrativeShortLink(input: ShortLinkContext) {
  const destinationUrl = validateDestinationUrl(input.destinationUrl);
  if (input.trendId) {
    const existing = await prisma.shortLink.findFirst({
      where: { trendId: input.trendId, destinationUrl },
      orderBy: { createdAt: "asc" },
    });
    if (existing) return existing;
  }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await prisma.shortLink.create({ data: { ...input, destinationUrl, code: randomCode() } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Não foi possível gerar um código curto único.");
}

export async function registerShortLinkClick(input: {
  shortLinkId: string;
  ip: string;
  userAgent: string | null;
  referer: string | null;
  country: string | null;
}) {
  const ipHash = hashIp(input.ip);
  const since = new Date(Date.now() - UNIQUE_WINDOW_MS);
  const [recentUnique, recentVolume] = await Promise.all([
    prisma.shortLinkClick.findFirst({
      where: { shortLinkId: input.shortLinkId, ipHash, userAgent: input.userAgent, clickedAt: { gte: since }, isUnique: true },
      select: { id: true },
    }),
    prisma.shortLinkClick.count({ where: { ipHash, clickedAt: { gte: new Date(Date.now() - 60_000) } } }),
  ]);
  if (recentVolume >= 60) return { rateLimited: true, isUnique: false };
  const isUnique = !recentUnique;
  await prisma.shortLinkClick.create({
    data: {
      shortLinkId: input.shortLinkId,
      ipHash,
      userAgent: input.userAgent?.slice(0, 1000) || null,
      referer: input.referer?.slice(0, 2000) || null,
      country: input.country?.slice(0, 2).toUpperCase() || null,
      isUnique,
    },
  });
  return { rateLimited: false, isUnique };
}

export function replaceNarrativeLink(content: string, destinationUrl: string, shortUrl: string): string {
  return content.replaceAll("[LINK]", shortUrl).replaceAll(destinationUrl, shortUrl);
}
