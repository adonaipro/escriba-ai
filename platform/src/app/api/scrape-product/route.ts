export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url obrigatória" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Não foi possível acessar a página" }, { status: 422 });
    }

    const html = await res.text();

    // Try og:title first — usually cleaner than <title>
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];

    if (ogTitle) {
      return NextResponse.json({ name: decodeHtmlEntities(ogTitle.trim()) });
    }

    // Fallback: <title> stripped of site name suffix (e.g. "Tênis Runner Pro | Shopee Brasil")
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    if (titleTag) {
      const cleaned = titleTag.split(/[|\-–—]/)[0]?.trim() ?? titleTag.trim();
      return NextResponse.json({ name: decodeHtmlEntities(cleaned) });
    }

    return NextResponse.json({ error: "Nome do produto não encontrado" }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar a página" }, { status: 422 });
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
