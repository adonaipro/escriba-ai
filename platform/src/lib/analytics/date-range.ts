export const PERIODS = [
  { value: "7d", label: "7 dias", days: 7 },
  { value: "30d", label: "30 dias", days: 30 },
  { value: "90d", label: "3 meses", days: 90 },
  { value: "1y", label: "1 ano", days: 365 },
  { value: "all", label: "Todo período", days: null },
] as const;

export type PeriodValue = typeof PERIODS[number]["value"];

export function resolveDateRange(periodInput?: string, fromInput?: string, toInput?: string) {
  const period = PERIODS.some((item) => item.value === periodInput) ? periodInput as PeriodValue : "30d";
  const now = new Date();
  const customFrom = fromInput && /^\d{4}-\d{2}-\d{2}$/.test(fromInput) ? new Date(`${fromInput}T00:00:00-03:00`) : null;
  const customTo = toInput && /^\d{4}-\d{2}-\d{2}$/.test(toInput) ? new Date(`${toInput}T23:59:59.999-03:00`) : null;
  if (customFrom && customTo && customFrom <= customTo) {
    return { period: "custom" as const, from: customFrom, to: customTo, fromInput, toInput, label: `${fromInput} a ${toInput}` };
  }
  const config = PERIODS.find((item) => item.value === period) ?? PERIODS[1];
  const from = config.days ? new Date(now.getTime() - (config.days - 1) * 86400000) : null;
  if (from) from.setHours(0, 0, 0, 0);
  return { period, from, to: now, fromInput: "", toInput: "", label: config.label };
}
