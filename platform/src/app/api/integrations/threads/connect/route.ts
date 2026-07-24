export const runtime = "nodejs";

import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildThreadsAuthorizationUrl } from "@/lib/integrations/threads/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user.profile) return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
  const state = crypto.randomBytes(32).toString("hex");
  const store = await cookies();
  store.set("threads_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  return NextResponse.redirect(buildThreadsAuthorizationUrl(state));
}
