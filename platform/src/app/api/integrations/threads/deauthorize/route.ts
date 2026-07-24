export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyThreadsSignedRequest } from "@/lib/integrations/threads/signed-request";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const signedRequest = form.get("signed_request");
    if (typeof signedRequest !== "string") return NextResponse.json({ error: "signed_request ausente" }, { status: 400 });
    const payload = verifyThreadsSignedRequest(signedRequest);
    if (payload.user_id) {
      await prisma.socialAccount.updateMany({
        where: { network: "threads", externalId: String(payload.user_id) },
        data: { accessToken: null, tokenExpiresAt: null, tokenScopes: null, status: "disconnected" },
      });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Requisicao Meta invalida" }, { status: 400 });
  }
}
