/**
 * Build a chronological daily performance series from publications.
 * Uses real Date keys (yyyy-MM-dd in America/Sao_Paulo) for ordering,
 * and optionally fills missing calendar days with zeros for a continuous line.
 */

const BRAZIL_OFFSET_MS = -3 * 60 * 60 * 1000; // America/Sao_Paulo (no DST)

function toBrazilDayKey(date: Date): string {
  const shifted = new Date(date.getTime() + BRAZIL_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayKeyToLabel(dayKey: string): string {
  const [, m, d] = dayKey.split("-");
  return `${d}/${m}`;
}

function dayKeyToUtcNoon(dayKey: string): Date {
  // Represent the calendar day at a stable instant for iteration.
  return new Date(`${dayKey}T12:00:00.000-03:00`);
}

function enumerateDayKeys(from: Date, to: Date): string[] {
  const startKey = toBrazilDayKey(from);
  const endKey = toBrazilDayKey(to);
  const keys: string[] = [];
  let cursor = dayKeyToUtcNoon(startKey);
  const end = dayKeyToUtcNoon(endKey);
  // Safety cap: 400 days
  for (let i = 0; i < 400 && cursor.getTime() <= end.getTime(); i++) {
    keys.push(toBrazilDayKey(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return keys;
}

export type DailyPerformancePoint = {
  /** Display label dd/MM */
  label: string;
  /** Sortable ISO day yyyy-MM-dd (Brazil) */
  dayKey: string;
  views: number;
  posts: number;
};

/**
 * Aggregate publications into a sorted daily series.
 * @param fillGaps when true and range is provided, insert zero-value days for continuity.
 */
export function buildDailyPerformance(
  publications: Array<{ publishedAt: Date | null; impressions?: number | null }>,
  options?: {
    from?: Date | null;
    to?: Date | null;
    fillGaps?: boolean;
  },
): DailyPerformancePoint[] {
  const map = new Map<string, { views: number; posts: number }>();

  for (const publication of publications) {
    if (!publication.publishedAt) continue;
    const dayKey = toBrazilDayKey(publication.publishedAt);
    const current = map.get(dayKey) ?? { views: 0, posts: 0 };
    current.views += publication.impressions ?? 0;
    current.posts += 1;
    map.set(dayKey, current);
  }

  let dayKeys: string[];
  if (options?.fillGaps && options.from && options.to) {
    dayKeys = enumerateDayKeys(options.from, options.to);
  } else {
    dayKeys = [...map.keys()].sort((a, b) => a.localeCompare(b));
  }

  return dayKeys.map((dayKey) => {
    const value = map.get(dayKey) ?? { views: 0, posts: 0 };
    return {
      label: dayKeyToLabel(dayKey),
      dayKey,
      views: value.views,
      posts: value.posts,
    };
  });
}
