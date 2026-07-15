import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LabClient } from "./lab-client";

export const metadata = { title: "Laboratório Narrativo" };

export default async function LaboratorioPage() {
  const session = await getSession();
  if (!session?.user.profile) {
    redirect("/login");
  }

  const profileId = session.user.profile.id;

  const [narrators, products] = await Promise.all([
    prisma.narrator.findMany({
      where: { profileId, status: { not: "archived" } },
      select: {
        id: true,
        name: true,
        sex: true,
        ageRange: true,
        maritalStatus: true,
        hasChildren: true,
        livesAlone: true,
        status: true,
        totalNarratives: true,
        totalClicks: true,
        totalImpressions: true,
        hypotheses: {
          where: { status: { in: ["winner", "testing"] } },
          select: { id: true, dimension: true, value: true, status: true, confidence: true },
          orderBy: { confidence: "desc" },
        },
        insights: {
          orderBy: { confidence: "desc" },
          take: 12,
          select: { id: true, title: true, body: true, confidence: true, impact: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { profileId },
      select: {
        id: true,
        name: true,
        marketplace: true,
        category: true,
        imageUrl: true,
        price: true,
        commissionPct: true,
        affiliateUrl: true,
        analysisStatus: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return <LabClient narrators={narrators} products={products} />;
}
