import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reanalyzeProduct } from "@/lib/products/product-import";

export const runtime = "nodejs";

// POST /api/produtos/[id]/analyze — re-run Product Intelligence Engine
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profileId = session.user.profile.id;
  const { id } = await params;

  const product = await prisma.product.findFirst({ where: { id, profileId } });
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  await reanalyzeProduct(id);
  return NextResponse.json({ ok: true });
}
