import { prisma } from "@/lib/db";

type ScheduleConfig = { scheduleDays?: number[]; scheduleTimes?: string[] };

function parseSchedule(raw: string | null): ScheduleConfig {
  if (!raw) return {};
  try { return JSON.parse(raw) as ScheduleConfig; } catch { return {}; }
}

export function nextCampaignSlot(raw: string | null, after = new Date()): Date | null {
  const config = parseSchedule(raw);
  const days = config.scheduleDays?.length ? config.scheduleDays : [0, 1, 2, 3, 4, 5, 6];
  const times = config.scheduleTimes?.filter((time) => /^\d{2}:\d{2}$/.test(time)).sort() ?? [];
  if (times.length === 0) return null;

  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });
  const startKey = dateFormatter.format(after);
  const startDate = new Date(`${startKey}T12:00:00Z`);
  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    const day = new Date(startDate);
    day.setUTCDate(day.getUTCDate() + dayOffset);
    const dateKey = day.toISOString().slice(0, 10);
    if (!days.includes(day.getUTCDay())) continue;
    for (const time of times) {
      const candidate = new Date(`${dateKey}T${time}:00-03:00`);
      if (candidate > after) return candidate;
    }
  }
  return null;
}

export async function scheduleTrend(trendId: string, scheduledAt: Date): Promise<void> {
  const trend = await prisma.trend.findUnique({
    where: { id: trendId },
    include: { posts: { select: { id: true } } },
  });
  if (!trend) throw new Error("Narrativa não encontrada");

  await prisma.$transaction(async (tx) => {
    await tx.trend.update({ where: { id: trendId }, data: { status: "scheduled", scheduledAt } });
    for (const post of trend.posts) {
      await tx.publication.upsert({
        where: { trendPostId: post.id },
        update: { campaignId: trend.campaignId, trendId, scheduledAt, status: "scheduled", lastError: null },
        create: { campaignId: trend.campaignId, trendId, trendPostId: post.id, scheduledAt, status: "scheduled" },
      });
    }
  });
}
