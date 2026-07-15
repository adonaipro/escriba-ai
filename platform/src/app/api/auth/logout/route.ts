export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSessionToken, deleteSession, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const token = await getSessionToken();
  if (token) {
    await deleteSession(token);
    await clearSessionCookie();
  }
  return NextResponse.json({ ok: true });
}
