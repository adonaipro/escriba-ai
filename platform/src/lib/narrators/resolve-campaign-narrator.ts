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

type ResolveOptions = {
  preferredSex?: string | null;
  socialAccountId?: string | null;
};

/**
 * Pick the active narrator for a profile (and optional account).
 * Does not touch Campaign rows.
 *
 * Priority:
 *  1) Preferred sex (param or active AccountNarrator on social account)
 *  2) Single active narrator on profile
 *  3) Ensure defaults (M+F), then preferred sex or female
 */
export async function pickNarratorForProfile(
  profileId: string,
  options?: ResolveOptions,
) {
  let preferredSex: "male" | "female" | null =
    options?.preferredSex === "male" || options?.preferredSex === "female"
      ? options.preferredSex
      : null;

  if (!preferredSex && options?.socialAccountId) {
    const link = await prisma.accountNarrator.findFirst({
      where: { socialAccountId: options.socialAccountId, isActive: true },
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
    const created = await prisma.narrator.findFirst({
      where: { profileId, status: "active" },
      include: { hypotheses: true },
      orderBy: { createdAt: "asc" },
    });
    if (!created) {
      throw new Error("Não foi possível criar ou localizar um narrador para a campanha.");
    }
    chosen = created;
  }

  return chosen;
}

/**
 * Ensure a campaign row has a valid narratorId and return that narrator.
 * Used by the generation pipeline for campaigns that may predate auto-link.
 */
export async function resolveAndLinkCampaignNarrator(
  campaignId: string,
  profileId: string,
  options?: ResolveOptions,
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

  const chosen = await pickNarratorForProfile(profileId, {
    preferredSex: options?.preferredSex,
    socialAccountId: options?.socialAccountId ?? campaign.socialAccountId,
  });

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { narratorId: chosen.id },
  });

  return chosen;
}
