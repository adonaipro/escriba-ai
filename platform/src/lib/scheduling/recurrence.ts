import { prisma } from "@/lib/db";
import { processGenerationJob } from "@/lib/generation-service";
import {
  campaignSlotAt,
  localDateKey,
  parseSchedule,
  parseScheduleTimes,
} from "./scheduler";

export async function ensureCampaignDailyJobs(campaignId: string, now = new Date()) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { socialAccount: { select: { isMock: true, status: true } } },
  });
  if (
    !campaign ||
    !campaign.socialAccountId ||
    !campaign.socialAccount ||
    campaign.socialAccount.isMock ||
    campaign.socialAccount.status !== "active" ||
    campaign.status === "paused" ||
    campaign.status === "ended" ||
    campaign.endedAt
  ) {
    return [];
  }

  const dateKey = localDateKey(now);
  if (campaign.startDate && dateKey < localDateKey(campaign.startDate)) return [];
  if (campaign.endDate && dateKey > localDateKey(campaign.endDate)) return [];

  const schedule = parseSchedule(campaign.customSchedule);
  const days = schedule.scheduleDays?.length ? schedule.scheduleDays : [0, 1, 2, 3, 4, 5, 6];
  const weekday = new Date(`${dateKey}T12:00:00-03:00`).getDay();
  if (!days.includes(weekday)) return [];

  // Exact campaign times only — never invent fallbacks.
  const times = parseScheduleTimes(campaign.customSchedule);
  if (times.length === 0) return [];

  const dayStart = new Date(`${dateKey}T00:00:00-03:00`);
  const dayEnd = new Date(`${dateKey}T23:59:59.999-03:00`);
  const existingTrends = await prisma.trend.findMany({
    where: {
      campaignId: campaign.id,
      OR: [
        { scheduledAt: { gte: dayStart, lte: dayEnd } },
        { scheduledAt: null, createdAt: { gte: dayStart, lte: dayEnd } },
      ],
    },
    select: { scheduledAt: true },
  });
  const existingJobs = await prisma.generationJob.findMany({
    where: { campaignId: campaign.id, targetDate: new Date(`${dateKey}T12:00:00-03:00`) },
    select: { generationKey: true, slotIndex: true, status: true },
  });
  const existingKeys = new Set(existingJobs.map((job) => job.generationKey).filter(Boolean));
  const occupiedSlots = new Set(
    existingTrends.flatMap((trend) =>
      trend.scheduledAt ? [trend.scheduledAt.getTime()] : [],
    ),
  );

  let missing = Math.max(
    0,
    campaign.trendsPerDay -
      existingTrends.length -
      existingJobs.filter((job) => job.status !== "completed").length,
  );

  // Next free FUTURE times from the campaign list (order preserved). Never invent times.
  const slotsToday = times
    .map((time, slotIndex) => ({
      slotIndex,
      time,
      targetSlot: campaignSlotAt(dateKey, time),
    }))
    .filter(({ targetSlot }) => targetSlot > now && !occupiedSlots.has(targetSlot.getTime()))
    .slice(0, campaign.trendsPerDay);

  const jobs = [];
  for (const { slotIndex, targetSlot } of slotsToday) {
    if (missing <= 0) break;

    const generationKey = `${campaign.id}:${dateKey}:${slotIndex}`;
    if (existingKeys.has(generationKey)) {
      const job = await prisma.generationJob.findUnique({ where: { generationKey } });
      if (job) jobs.push(job);
      continue;
    }

    jobs.push(
      await prisma.generationJob.upsert({
        where: { generationKey },
        update: {},
        create: {
          campaignId: campaign.id,
          generationKey,
          targetDate: new Date(`${dateKey}T12:00:00-03:00`),
          targetSlot,
          slotIndex,
        },
      }),
    );
    missing--;
  }
  return jobs;
}

export async function runCampaignRecurrence(now = new Date()) {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { notIn: ["paused", "ended"] },
      endedAt: null,
      socialAccountId: { not: null },
      socialAccount: { isMock: false, status: "active" },
      OR: [{ startDate: null }, { startDate: { lte: now } }],
    },
    select: { id: true },
  });

  const pending = [];
  for (const campaign of campaigns) {
    const jobs = await ensureCampaignDailyJobs(campaign.id, now);
    pending.push(...jobs.filter((job) => job.status === "pending"));
  }
  for (const job of pending) await processGenerationJob(job.id);
  return pending;
}
