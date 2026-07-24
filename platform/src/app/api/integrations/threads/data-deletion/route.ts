export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyThreadsSignedRequest } from "@/lib/integrations/threads/signed-request";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const signedRequest = form.get("signed_request");
    if (typeof signedRequest !== "string") return NextResponse.json({ error: "signed_request ausente" }, { status: 400 });
    const payload = verifyThreadsSignedRequest(signedRequest);
    const userId = payload.user_id ? String(payload.user_id) : "unknown";
    const confirmationCode = crypto.createHash("sha256").update(`${userId}:${Date.now()}`).digest("hex").slice(0, 24);
    if (payload.user_id) {
      await prisma.socialAccount.updateMany({
        where: { network: "threads", externalId: userId },
        data: { accessToken: null, tokenExpiresAt: null, tokenScopes: null, status: "deleted_by_user" },
      });
    }
    const statusUrl = new URL("/api/integrations/threads/data-deletion", request.url);
    statusUrl.searchParams.set("code", confirmationCode);
    return NextResponse.json({ url: statusUrl.toString(), confirmation_code: confirmationCode });
  } catch {
    return NextResponse.json({ error: "Requisicao Meta invalida" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  return NextResponse.json({ confirmation_code: code, status: "completed" });
}
