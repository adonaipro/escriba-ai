import { prisma } from "@/lib/db";
import { processGenerationJob } from "@/lib/generation-service";

const TIME_ZONE = "America/Sao_Paulo";

type CampaignSchedule = { scheduleDays?: number[]; scheduleTimes?: string[] };

function localDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

function parseSchedule(raw: string | null): CampaignSchedule {
  if (!raw) return {};
  try { return JSON.parse(raw) as CampaignSchedule; } catch { return {}; }
}

function dateAtNoon(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00-03:00`);
}

export async function ensureCampaignDailyJobs(campaignId: string, now = new Date()) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { socialAccount: { select: { isMock: true, status: true } } },
  });
  if (!campaign || !campaign.socialAccountId || !campaign.socialAccount || campaign.socialAccount.isMock || campaign.socialAccount.status !== "active" || campaign.status === "paused" || campaign.status === "ended" || campaign.endedAt) return [];

  const dateKey = localDateKey(now);
  if (campaign.startDate && dateKey < localDateKey(campaign.startDate)) return [];
  if (campaign.endDate && dateKey > localDateKey(campaign.endDate)) return [];

  const schedule = parseSchedule(campaign.customSchedule);
  const days = schedule.scheduleDays?.length ? schedule.scheduleDays : [0, 1, 2, 3, 4, 5, 6];
  if (!days.includes(dateAtNoon(dateKey).getDay())) return [];

  const times = (schedule.scheduleTimes ?? [])
    .filter((time) => /^\d{2}:\d{2}$/.test(time))
    .sort()
    .slice(0, campaign.trendsPerDay);

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
    where: { campaignId: campaign.id, targetDate: dateAtNoon(dateKey) },
    select: { generationKey: true, slotIndex: true, status: true },
  });
  const existingKeys = new Set(existingJobs.map((job) => job.generationKey).filter(Boolean));
  const occupiedSlots = new Set(existingTrends.flatMap((trend) => trend.scheduledAt ? [trend.scheduledAt.getTime()] : []));
  let missing = Math.max(0, campaign.trendsPerDay - existingTrends.length - existingJobs.filter((job) => job.status !== "completed").length);

  const jobs = [];
  for (let slotIndex = 0; slotIndex < campaign.trendsPerDay; slotIndex++) {
    const time = times[slotIndex] ?? times[times.length - 1];
    const generationKey = `${campaign.id}:${dateKey}:${slotIndex}`;
    if (existingKeys.has(generationKey)) {
      const job = await prisma.generationJob.findUnique({ where: { generationKey } });
      if (job) jobs.push(job);
      continue;
    }
    const targetSlot = time ? new Date(`${dateKey}T${time}:00-03:00`) : null;
    if (missing <= 0 || (targetSlot && occupiedSlots.has(targetSlot.getTime()))) continue;
    jobs.push(await prisma.generationJob.upsert({
      where: { generationKey },
      update: {},
      create: {
        campaignId: campaign.id,
        generationKey,
        targetDate: dateAtNoon(dateKey),
        targetSlot,
        slotIndex,
      },
    }));
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
