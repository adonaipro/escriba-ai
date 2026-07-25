import { prisma } from "@/lib/db";

function displayName(sex: "male" | "female"): string {
  return sex === "male" ? "Narrador homem" : "Narradora mulher";
}

/** Ensure profile has active male + female default narrators. */
export async function ensureDefaultSexNarrators(profileId: string) {
  for (const sex of ["female", "male"] as const) {
    const existing = await prisma.narrator.findFirst({
      where: { profileId, sex, status: "active" },
    });
    if (existing) continue;
    await prisma.narrator.create({
      data: {
        profileId,
        name: displayName(sex),
        sex,
        ageRange: "26-35",
        maritalStatus: "other",
        hasChildren: false,
        livesAlone: false,
        status: "active",
      },
    });
  }
}

/**
 * Resolve a narrator for a campaign that may have no narratorId.
 * Updates the campaign row when linking.
 * Priority:
 *  1) Campaign.narratorId if set and valid
 *  2) Preferred sex (account active narrator / param)
 *  3) Single active narrator on profile
 *  4) Ensure defaults (M+F), then preferred sex or female
 */
export async function resolveAndLinkCampaignNarrator(
  campaignId: string,
  profileId: string,
  options?: {
    preferredSex?: string | null;
    socialAccountId?: string | null;
  },
) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, profileId },
    include: {
      narrator: { include: { hypotheses: true } },
    },
  });
  if (!campaign) throw new Error("Campanha não encontrada");

  if (campaign.narratorId && campaign.narrator) {
    return campaign.narrator;
  }

  let preferredSex: "male" | "female" | null =
    options?.preferredSex === "male" || options?.preferredSex === "female"
      ? options.preferredSex
      : null;

  const accountId = options?.socialAccountId ?? campaign.socialAccountId;
  if (!preferredSex && accountId) {
    const link = await prisma.accountNarrator.findFirst({
      where: { socialAccountId: accountId, isActive: true },
      include: { narrator: { select: { sex: true } } },
    });
    if (link?.narrator?.sex === "male" || link?.narrator?.sex === "female") {
      preferredSex = link.narrator.sex;
    }
  }

  let active = await prisma.narrator.findMany({
    where: { profileId, status: "active" },
    include: { hypotheses: true },
    orderBy: { createdAt: "asc" },
  });

  if (active.length === 0) {
    await ensureDefaultSexNarrators(profileId);
    active = await prisma.narrator.findMany({
      where: { profileId, status: "active" },
      include: { hypotheses: true },
      orderBy: { createdAt: "asc" },
    });
  }

  let chosen =
    (preferredSex ? active.find((n) => n.sex === preferredSex) : undefined) ??
    (active.length === 1 ? active[0] : undefined) ??
    active.find((n) => n.sex === "female") ??
    active.find((n) => n.sex === "male") ??
    active[0];

  if (!chosen) {
    await ensureDefaultSexNarrators(profileId);
    const fallback = await prisma.narrator.findFirst({
      where: { profileId, status: "active" },
      include: { hypotheses: true },
      orderBy: { createdAt: "asc" },
    });
    if (!fallback) {
      throw new Error("Não foi possível criar ou localizar um narrador para a campanha.");
    }
    chosen = fallback;
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { narratorId: chosen.id },
  });

  return chosen;
}
