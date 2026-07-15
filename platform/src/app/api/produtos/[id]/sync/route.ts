import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { defaultProductProvider } from "@/lib/providers/simulated-product-provider";

export const runtime = "nodejs";

// POST /api/produtos/[id]/sync — refresh price/commission from marketplace
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

  const { updated, changedFields } = await defaultProductProvider.syncProduct(
    product.externalId ?? id,
    product.shopId ?? undefined,
  );

  const data: Record<string, unknown> = { lastSyncedAt: new Date() };
  if (updated.price !== undefined) data.price = updated.price;
  if (updated.promotionalPrice !== undefined) data.promotionalPrice = updated.promotionalPrice;
  if (updated.commission !== undefined) data.commission = updated.commission;
  if (updated.commissionPct !== undefined) data.commissionPct = updated.commissionPct;

  await prisma.product.update({ where: { id }, data });

  return NextResponse.json({ ok: true, changedFields });
}
