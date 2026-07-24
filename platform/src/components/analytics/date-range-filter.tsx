"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { PERIODS } from "@/lib/analytics/date-range";

export function DateRangeFilter({ period, from, to }: { period: string; from?: string; to?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) value ? params.set(key, value) : params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
      <CalendarDays className="ml-1 h-4 w-4 text-zinc-500" />
      {PERIODS.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => navigate({ period: item.value, from: null, to: null })}
          className={`rounded-lg px-3 py-1.5 text-xs transition-all ${period === item.value ? "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white shadow-sm" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"}`}
        >
          {item.label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <input aria-label="Data inicial" type="date" defaultValue={from} className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300" id="analytics-from" />
        <span className="text-xs text-zinc-600">até</span>
        <input aria-label="Data final" type="date" defaultValue={to} className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-300" id="analytics-to" />
        <button
          type="button"
          onClick={() => {
            const fromValue = (document.getElementById("analytics-from") as HTMLInputElement | null)?.value;
            const toValue = (document.getElementById("analytics-to") as HTMLInputElement | null)?.value;
            if (fromValue && toValue) navigate({ period: null, from: fromValue, to: toValue });
          }}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
