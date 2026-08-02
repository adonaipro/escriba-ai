import { prisma } from "@/lib/db";
import { floorToMinute } from "./slots";

export { allocateUniqueMinutes, floorToMinute } from "./slots";

const TIME_ZONE = "America/Sao_Paulo";

export type ScheduleConfig = { scheduleDays?: number[]; scheduleTimes?: string[] };

export function parseSchedule(raw: string | null | undefined): ScheduleConfig {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ScheduleConfig;
  } catch {
    return {};
  }
}

/** Valid HH:mm entries, sorted, de-duplicated — never invents times. */
export function parseScheduleTimes(raw: string | null | undefined): string[] {
  const times = parseSchedule(raw).scheduleTimes ?? [];
  return [...new Set(times.filter((time) => /^\d{2}:\d{2}$/.test(time)))].sort();
}

export function localDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Wall-clock dateKey + HH:mm in America/Sao_Paulo → absolute Date. */
export function campaignSlotAt(dateKey: string, time: string): Date {
  return floorToMinute(new Date(`${dateKey}T${time}:00-03:00`));
}

function addLocalDays(dateKey: string, dayOffset: number): string {
  const noon = new Date(`${dateKey}T12:00:00-03:00`);
  return localDateKey(new Date(noon.getTime() + dayOffset * 86_400_000));
}

function weekdayLocal(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00-03:00`).getDay();
}

/**
 * Next campaign schedule slot strictly after `after`.
 * Only uses configured scheduleTimes — never invents fallback times.
 * Skips times present in `occupiedMs` (minute-precision).
 */
export function nextCampaignSlot(
  raw: string | null | undefined,
  after = new Date(),
  occupiedMs?: Set<number>,
): Date | null {
  const config = parseSchedule(raw);
  const times = parseScheduleTimes(raw);
  if (times.length === 0) return null;

  const days = config.scheduleDays?.length ? config.scheduleDays : [0, 1, 2, 3, 4, 5, 6];
  const startKey = localDateKey(after);

  // Up to ~2 months so large batches (e.g. 10+) with few daily times still allocate.
  for (let dayOffset = 0; dayOffset <= 62; dayOffset++) {
    const dateKey = addLocalDays(startKey, dayOffset);
    if (!days.includes(weekdayLocal(dateKey))) continue;
    for (const time of times) {
      const candidate = campaignSlotAt(dateKey, time);
      if (candidate <= after) continue;
      if (occupiedMs?.has(candidate.getTime())) continue;
      return candidate;
    }
  }
  return null;
}

/** Format HH:mm in America/Sao_Paulo for a Date. */
export function formatSlotTimeSP(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Next `count` free campaign slots (may span multiple days).
 * Schedules only distribute generated narratives — never invent times.
 */
export function allocateNextCampaignSlots(
  raw: string | null | undefined,
  count: number,
  after = new Date(),
  occupiedMs?: Set<number>,
): Date[] {
  const slots: Date[] = [];
  const occupied = occupiedMs ?? new Set<number>();
  let cursor = after;
  for (let i = 0; i < count; i++) {
    const next = nextCampaignSlot(raw, cursor, occupied);
    if (!next) break;
    slots.push(next);
    occupied.add(next.getTime());
    cursor = next;
  }
  return slots;
}

async function loadOccupiedSlotsForAccount(
  socialAccountId: string | null | undefined,
  excludeTrendId?: string,
): Promise<Set<number>> {
  const occupied = new Set<number>();
  if (!socialAccountId) return occupied;

  // One occupied mark per trend (first post / trend.scheduledAt), not per reply minute.
  const trends = await prisma.trend.findMany({
    where: {
      campaign: { socialAccountId },
      status: { in: ["scheduled", "paused", "publishing"] },
      scheduledAt: { not: null },
      ...(excludeTrendId ? { NOT: { id: excludeTrendId } } : {}),
    },
    select: { scheduledAt: true },
  });

  for (const trend of trends) {
    if (trend.scheduledAt) occupied.add(floorToMinute(trend.scheduledAt).getTime());
  }
  return occupied;
}

/**
 * Schedule a trend and one Publication per post at the exact campaign slot.
 * All posts of the narrative share the same scheduledAt (no +1 minute invention).
 * If preferred is past/occupied, advances to the next free configured campaign time.
 */
export async function scheduleTrend(trendId: string, scheduledAt: Date): Promise<void> {
  const trend = await prisma.trend.findUnique({
    where: { id: trendId },
    include: {
      posts: { select: { id: true }, orderBy: { position: "asc" } },
      campaign: { select: { id: true, socialAccountId: true, customSchedule: true } },
    },
  });
  if (!trend) throw new Error("Narrativa não encontrada");

  const occupied = await loadOccupiedSlotsForAccount(
    trend.campaign.socialAccountId,
    trendId,
  );

  const preferred = floorToMinute(scheduledAt);
  const now = new Date();
  let slot: Date | null =
    preferred > now && !occupied.has(preferred.getTime()) ? preferred : null;

  if (!slot) {
    const after = preferred > now ? preferred : now;
    slot = nextCampaignSlot(trend.campaign.customSchedule, after, occupied);
  }

  if (!slot) {
    throw new Error(
      "Nenhum horário configurado disponível na campanha. Defina scheduleTimes e tente de novo.",
    );
  }

  const exactSlot = floorToMinute(slot);

  await prisma.$transaction(async (tx) => {
    await tx.trend.update({
      where: { id: trendId },
      data: { status: "scheduled", scheduledAt: exactSlot },
    });

    for (const post of trend.posts) {
      await tx.publication.upsert({
        where: { trendPostId: post.id },
        update: {
          campaignId: trend.campaignId,
          trendId,
          scheduledAt: exactSlot,
          status: "scheduled",
          lastError: null,
        },
        create: {
          campaignId: trend.campaignId,
          trendId,
          trendPostId: post.id,
          scheduledAt: exactSlot,
          status: "scheduled",
        },
      });
    }
  });
}
