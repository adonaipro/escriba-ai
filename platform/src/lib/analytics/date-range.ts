export const PERIODS = [
  { value: "7d", label: "7 dias", days: 7 },
  { value: "30d", label: "30 dias", days: 30 },
  { value: "90d", label: "3 meses", days: 90 },
  { value: "1y", label: "1 ano", days: 365 },
  { value: "all", label: "Todo período", days: null },
] as const;

export type PeriodValue = (typeof PERIODS)[number]["value"];

/** America/Sao_Paulo fixed offset (Brazil no longer observes DST). */
const BRAZIL_OFFSET = "-03:00";

function startOfDayBrazil(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00${BRAZIL_OFFSET}`);
}

function endOfDayBrazil(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999${BRAZIL_OFFSET}`);
}

/** Format a Date as yyyy-MM-dd in America/Sao_Paulo. */
export function formatBrazilDate(date: Date): string {
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function resolveDateRange(periodInput?: string, fromInput?: string, toInput?: string) {
  const period = PERIODS.some((item) => item.value === periodInput)
    ? (periodInput as PeriodValue)
    : "30d";
  const now = new Date();
  const customFrom =
    fromInput && /^\d{4}-\d{2}-\d{2}$/.test(fromInput) ? startOfDayBrazil(fromInput) : null;
  const customTo =
    toInput && /^\d{4}-\d{2}-\d{2}$/.test(toInput) ? endOfDayBrazil(toInput) : null;

  if (customFrom && customTo && customFrom <= customTo) {
    return {
      period: "custom" as const,
      from: customFrom,
      to: customTo,
      fromInput,
      toInput,
      label: `${fromInput} a ${toInput}`,
    };
  }

  const config = PERIODS.find((item) => item.value === period) ?? PERIODS[1];
  if (!config.days) {
    return {
      period,
      from: null as Date | null,
      to: now,
      fromInput: "",
      toInput: "",
      label: config.label,
    };
  }

  // Inclusive window of N calendar days ending today (Brazil).
  const todayKey = formatBrazilDate(now);
  const end = endOfDayBrazil(todayKey);
  const startDay = new Date(startOfDayBrazil(todayKey).getTime() - (config.days - 1) * 86400000);
  const from = startOfDayBrazil(formatBrazilDate(startDay));

  return {
    period,
    from,
    to: end,
    fromInput: "",
    toInput: "",
    label: config.label,
  };
}
