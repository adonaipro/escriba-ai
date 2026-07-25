import { formatNumber } from "@/lib/utils";

export function PerformanceChart({
  data,
}: {
  data: Array<{ label: string; views: number; posts: number; dayKey?: string }>;
}) {
  // Data is expected already sorted chronologically by the server.
  // Cap display to the most recent 30 calendar points (end of series).
  const visible = data.slice(-30);
  const max = Math.max(1, ...visible.map((item) => item.views));
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Desempenho por data de publicação</h2>
          <p className="text-[11px] text-zinc-500">
            Visualizações dos posts, agrupadas pelo dia de publicação (ordem cronológica, fuso America/Sao_Paulo).
          </p>
        </div>
        <span className="text-[10px] text-zinc-600">até 30 datas</span>
      </div>
      {visible.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-600">Nenhuma publicação neste período.</div>
      ) : (
        <div className="flex h-40 items-end gap-1.5 overflow-x-auto pb-1">
          {visible.map((item) => (
            <div
              key={item.dayKey ?? item.label}
              className="group flex min-w-7 flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="invisible rounded bg-zinc-800 px-2 py-1 text-[9px] text-zinc-200 group-hover:visible">
                {formatNumber(item.views)} views · {item.posts} posts
              </div>
              <div
                className="w-full rounded-t bg-gradient-to-t from-pink-500 via-rose-500 to-orange-400 transition-opacity hover:opacity-80"
                style={{ height: `${Math.max(4, (item.views / max) * 105)}px` }}
              />
              <span className="whitespace-nowrap text-[8px] text-zinc-600">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
