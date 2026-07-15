export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  provider: z.enum(["simulated", "openai", "anthropic", "openrouter", "groq"]),
  apiKey: z.string().default(""),
  model: z.string().default(""),
  baseUrl: z.string().default(""),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.llmConfig.findUnique({
    where: { profileId: session.user.profile.id },
    select: { id: true, provider: true, model: true, baseUrl: true, updatedAt: true },
    // Note: apiKey intentionally excluded from GET response for security
  });

  return NextResponse.json({ config: config ?? { provider: "simulated", model: "", baseUrl: "" } });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const config = await prisma.llmConfig.upsert({
      where: { profileId: session.user.profile.id },
      update: {
        provider: data.provider,
        apiKey: data.apiKey,
        model: data.model,
        baseUrl: data.baseUrl,
      },
      create: {
        profileId: session.user.profile.id,
        provider: data.provider,
        apiKey: data.apiKey,
        model: data.model,
        baseUrl: data.baseUrl,
      },
      select: { id: true, provider: true, model: true, baseUrl: true, updatedAt: true },
    });

    return NextResponse.json({ config });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("PUT /api/llm-config error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
