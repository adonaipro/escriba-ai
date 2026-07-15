"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Brain,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  addMonths,
  subMonths,
  addDays,
  isAfter,
  isBefore,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Calendar types ───────────────────────────────────────────────────────────

type PubItem = {
  id: string;
  scheduledAt: string;
  publishedAt: string | null;
  status: string;
  clicks: number | null;
  impressions: number | null;
  campaign: { id: string; name: string; productName: string };
  trend: { id: string; format: string; hook: string } | null;
  trendPost: { position: number; content: string } | null;
};

type EventType =
  | "publication_published"
  | "publication_scheduled"
  | "scale_opportunity"
  | "saturation_alert"
  | "learning";

type CalEvent = {
  id: string;
  type: EventType;
  dateKey: string;
  label: string;
  sublabel?: string;
  link?: string;
  pubData?: PubItem;
};

type CampaignStatus = { id: string; name: string; status: string };

type Learning = { id: string; summary: string; recordedAt: string; impact: string };

type GroupedPubs = Record<string, PubItem[]>;

// ─── Queue types ──────────────────────────────────────────────────────────────

type QueueItem = {
  id: string;
  scheduledAt: string | null;
  status: string;
  campaign: { id: string; name: string };
  trend: { id: string; format: string; hook: string; qualityScore: number | null } | null;
  trendPost: { position: number; content: string } | null;
};

// ─── Calendar constants ───────────────────────────────────────────────────────

const EVENT_DOT: Record<EventType, string> = {
  publication_published: "bg-emerald-400",
  publication_scheduled: "bg-blue-400",
  scale_opportunity: "bg-emerald-500 ring-1 ring-emerald-300",
  saturation_alert: "bg-amber-400",
  learning: "bg-violet-400",
};

const EVENT_ICON: Record<EventType, React.ComponentType<{ className?: string }>> = {
  publication_published: () => <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />,
  publication_scheduled: () => <span className="h-1.5 w-1.5 rounded-full bg-blue-400 inline-block" />,
  scale_opportunity: TrendingUp,
  saturation_alert: AlertTriangle,
  learning: Brain,
};

function statusDot(status: string) {
  if (status === "published") return "bg-emerald-400";
  if (status === "scheduled") return "bg-blue-400";
  return "bg-zinc-500";
}

function buildEvents(
  grouped: GroupedPubs,
  campaigns: CampaignStatus[],
  learnings: Learning[]
): Record<string, CalEvent[]> {
  const events: Record<string, CalEvent[]> = {};

  const add = (dateKey: string, ev: CalEvent) => {
    if (!events[dateKey]) events[dateKey] = [];
    events[dateKey].push(ev);
  };

  // Publications
  for (const [dateKey, pubs] of Object.entries(grouped)) {
    for (const p of pubs) {
      add(dateKey, {
        id: p.id,
        type: p.status === "published" ? "publication_published" : "publication_scheduled",
        dateKey,
        label: p.trend?.hook ?? p.campaign.productName,
        sublabel: p.campaign.name,
        link: p.trend ? `/campanhas/${p.campaign.id}` : undefined,
        pubData: p,
      });
    }
  }

  // Intelligence events: scale_eligible and saturating campaigns show on today's date
  const todayKey = format(new Date(), "yyyy-MM-dd");
  for (const c of campaigns) {
    if (c.status === "scale_eligible") {
      add(todayKey, {
        id: `scale-${c.id}`,
        type: "scale_opportunity",
        dateKey: todayKey,
        label: `Oportunidade: ${c.name}`,
        sublabel: "Padrao validado — pronta para escala",
        link: `/campanhas/${c.id}`,
      });
    }
    if (c.status === "saturating") {
      add(todayKey, {
        id: `sat-${c.id}`,
        type: "saturation_alert",
        dateKey: todayKey,
        label: `Saturacao: ${c.name}`,
        sublabel: "Eficiencia em queda — rotacao recomendada",
        link: `/campanhas/${c.id}`,
      });
    }
  }

  // Learnings pinned to their recording date
  for (const l of learnings) {
    const dateKey = l.recordedAt.split("T")[0];
    add(dateKey, {
      id: `learning-${l.id}`,
      type: "learning",
      dateKey,
      label: l.summary,
      sublabel: "Padrao detectado",
      link: "/aprendizados",
    });
  }

  return events;
}

// ─── Queue helpers ────────────────────────────────────────────────────────────

function groupQueueByDate(items: QueueItem[], rangedays: number): Record<string, QueueItem[]> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const cutoff = addDays(new Date(), -rangedays);
  cutoff.setHours(0, 0, 0, 0);

  const result: Record<string, QueueItem[]> = {};
  for (const item of items) {
    if (!item.scheduledAt) continue;
    const d = new Date(item.scheduledAt);
    if (isBefore(d, cutoff) || isAfter(d, today)) continue;
    const key = format(d, "yyyy-MM-dd");
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function CalendarioPage() {
  // Top-level view: calendario or fila
  const [topView, setTopView] = useState<"calendario" | "fila">("calendario");

  // ── Calendar state ──
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [grouped, setGrouped] = useState<GroupedPubs>({});
  const [campaigns, setCampaigns] = useState<CampaignStatus[]>([]);
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // ── Fila state ──
  const [filaRange, setFilaRange] = useState<7 | 14 | 30>(7);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [filaLoading, setFilaLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Calendar fetch ──
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const from = startOfMonth(currentMonth).toISOString();
      const to = endOfMonth(currentMonth).toISOString();
      const [calRes, campRes, learnRes] = await Promise.all([
        fetch(`/api/calendar?from=${from}&to=${to}`),
        fetch("/api/campaigns"),
        fetch("/api/learnings"),
      ]);
      if (calRes.ok) {
        const d = await calRes.json();
        setGrouped(d.grouped);
        setTotal(d.total);
      }
      if (campRes.ok) {
        const d = await campRes.json();
        setCampaigns(
          (d.campaigns ?? []).map((c: { id: string; name: string; status: string }) => ({
            id: c.id,
            name: c.name,
            status: c.status,
          }))
        );
      }
      if (learnRes.ok) {
        const d = await learnRes.json();
        setLearnings(d.learnings ?? []);
      }
      setLoading(false);
    }
    void fetchAll();
  }, [currentMonth]);

  // ── Fila fetch ──
  const fetchFila = async () => {
    setFilaLoading(true);
    const res = await fetch("/api/queue");
    if (res.ok) {
      const d = await res.json();
      setQueueItems(d.items ?? []);
    }
    setFilaLoading(false);
  };

  useEffect(() => {
    if (topView === "fila") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchFila();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topView, filaRange]);

  // ── Queue actions ──
  async function handleQueueAction(trendId: string, action: "approved" | "rejected") {
    setActionLoading(trendId);
    await fetch(`/api/trends/${trendId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    });
    setActionLoading(null);
    void fetchFila();
  }

  // ── Calendar derived values ──
  const allEvents = buildEvents(grouped, campaigns, learnings);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const startPad = getDay(start);
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const selectedEvents = selectedDay ? (allEvents[selectedDay] ?? []) : [];

  const scaleOpp = campaigns.filter((c) => c.status === "scale_eligible");
  const satAlerts = campaigns.filter((c) => c.status === "saturating");

  // ── Queue derived values ──
  const groupedQueue = groupQueueByDate(queueItems, filaRange);
  const sortedQueueDates = Object.keys(groupedQueue).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {/* ── Top view toggle ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTopView("calendario")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            topView === "calendario"
              ? "bg-violet-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          }`}
        >
          Calendario
        </button>
        <button
          onClick={() => setTopView("fila")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            topView === "fila"
              ? "bg-violet-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          }`}
        >
          Fila
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          FILA VIEW
      ══════════════════════════════════════════════════════════ */}
      {topView === "fila" && (
        <div className="space-y-6">
          {/* Range selector */}
          <div className="flex items-center gap-2">
            {([7, 14, 30] as const).map((n) => (
              <button
                key={n}
                onClick={() => setFilaRange(n)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filaRange === n
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {n}d
              </button>
            ))}
          </div>

          {filaLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : sortedQueueDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20">
              <CalendarDays className="h-12 w-12 text-zinc-600 mb-4" />
              <p className="text-sm text-zinc-500">
                Nenhuma narrativa pendente nos ultimos {filaRange} dias.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedQueueDates.map((dateKey) => {
                const items = groupedQueue[dateKey];
                return (
                  <div key={dateKey} className="space-y-2">
                    {/* Date separator */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-zinc-300 capitalize whitespace-nowrap">
                        {format(new Date(dateKey + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })}
                      </h3>
                      <div className="flex-1 h-px bg-zinc-800" />
                      <span className="text-xs text-zinc-500 shrink-0">{items.length}</span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const isActing = actionLoading === item.trend?.id;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                          >
                            {/* Hook */}
                            <p className="flex-1 min-w-0 text-sm text-zinc-200 truncate leading-snug">
                              {item.trend?.hook ?? "(sem hook)"}
                            </p>

                            {/* Campaign badge */}
                            <span className="shrink-0 text-xs text-zinc-500 hidden sm:block">
                              {item.campaign.name}
                            </span>

                            {/* Actions */}
                            {item.trend ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isActing}
                                  onClick={() => handleQueueAction(item.trend!.id, "approved")}
                                  className="h-7 px-2.5 text-xs border-emerald-800 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 disabled:opacity-50"
                                >
                                  {isActing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Aprovar</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isActing}
                                  onClick={() => handleQueueAction(item.trend!.id, "rejected")}
                                  className="h-7 px-2.5 text-xs border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
                                >
                                  {isActing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                  <span className="ml-1">Rejeitar</span>
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-600 shrink-0">sem trend</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          CALENDARIO VIEW
      ══════════════════════════════════════════════════════════ */}
      {topView === "calendario" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Calendario Estrategico</h1>
              <p className="text-sm text-zinc-400">
                {total} publicacao{total !== 1 ? "oes" : ""} este mes &middot;{" "}
                {scaleOpp.length} oportunidade{scaleOpp.length !== 1 ? "s" : ""} &middot;{" "}
                {satAlerts.length} alerta{satAlerts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Intelligence alerts */}
          {scaleOpp.length > 0 && (
            <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-4 py-2.5 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">
                <strong>{scaleOpp.map((c) => c.name).join(", ")}</strong> — padrao validado,
                oportunidade de escala identificada.
              </p>
              <Link
                href="/campanhas"
                className="text-xs text-emerald-400 underline ml-auto shrink-0"
              >
                Ver campanhas
              </Link>
            </div>
          )}
          {satAlerts.length > 0 && (
            <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-2.5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">
                <strong>{satAlerts.map((c) => c.name).join(", ")}</strong> — saturacao detectada.
                Rotacao narrativa recomendada.
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
            {[
              { dot: "bg-emerald-400", label: "Publicado" },
              { dot: "bg-blue-400", label: "Agendado" },
              { dot: "bg-emerald-500 ring-1 ring-emerald-300", label: "Oportunidade de escala" },
              { dot: "bg-amber-400", label: "Alerta de saturacao" },
              { dot: "bg-violet-400", label: "Padrao detectado" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full shrink-0 ${item.dot}`} />
                {item.label}
              </div>
            ))}
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold text-zinc-100 capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : viewMode === "month" ? (
            <div className="space-y-4">
              {/* Calendar grid */}
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-zinc-800">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((d) => (
                    <div
                      key={d}
                      className="py-2 text-center text-xs font-medium text-zinc-500"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {paddedDays.map((day, idx) => {
                    if (!day) {
                      return (
                        <div
                          key={`pad-${idx}`}
                          className="min-h-[80px] border-b border-r border-zinc-800/50"
                        />
                      );
                    }
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayEvents = allEvents[dateKey] ?? [];
                    const isSelected = selectedDay === dateKey;
                    const isCurrentDay = isToday(day);

                    // Collect unique dot types
                    const dotTypes = [...new Set(dayEvents.map((e) => e.type))];

                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                        className={`min-h-[80px] border-b border-r border-zinc-800/50 p-2 text-left transition-colors ${
                          isSelected ? "bg-violet-600/10" : "hover:bg-zinc-800/30"
                        } ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}`}
                      >
                        <div
                          className={`text-sm font-medium mb-1.5 w-7 h-7 flex items-center justify-center rounded-full ${
                            isCurrentDay ? "bg-violet-600 text-white" : "text-zinc-300"
                          }`}
                        >
                          {format(day, "d")}
                        </div>
                        {dotTypes.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {dotTypes.map((type) => {
                              const count = dayEvents.filter((e) => e.type === type).length;
                              return (
                                <div key={type} className="flex items-center gap-0.5">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${EVENT_DOT[type]}`}
                                  />
                                  {count > 1 && (
                                    <span className="text-[10px] text-zinc-600">{count}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected day detail */}
              {selectedDay && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-3 capitalize">
                      {format(
                        new Date(selectedDay + "T12:00:00"),
                        "EEEE, dd 'de' MMMM",
                        { locale: ptBR }
                      )}
                      <span className="text-zinc-500 font-normal ml-2">
                        — {selectedEvents.length} evento
                        {selectedEvents.length !== 1 ? "s" : ""}
                      </span>
                    </h3>
                    {selectedEvents.length === 0 ? (
                      <p className="text-sm text-zinc-500">Nenhum evento nesse dia.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEvents.map((ev) => {
                          const IcoComp = EVENT_ICON[ev.type];
                          const isIntel = [
                            "scale_opportunity",
                            "saturation_alert",
                            "learning",
                          ].includes(ev.type);
                          return (
                            <div
                              key={ev.id}
                              className={`flex items-start gap-3 py-2 border-b border-zinc-800 last:border-0 ${
                                ev.type === "scale_opportunity"
                                  ? "bg-emerald-950/10 rounded px-2"
                                  : ev.type === "saturation_alert"
                                  ? "bg-amber-950/10 rounded px-2"
                                  : ev.type === "learning"
                                  ? "bg-violet-950/10 rounded px-2"
                                  : ""
                              }`}
                            >
                              <span className="mt-1.5 shrink-0">
                                {isIntel ? (
                                  <IcoComp
                                    className={`h-3.5 w-3.5 ${
                                      ev.type === "scale_opportunity"
                                        ? "text-emerald-400"
                                        : ev.type === "saturation_alert"
                                        ? "text-amber-400"
                                        : "text-violet-400"
                                    }`}
                                  />
                                ) : (
                                  <span
                                    className={`h-2 w-2 rounded-full block ${statusDot(
                                      ev.type === "publication_published"
                                        ? "published"
                                        : "scheduled"
                                    )}`}
                                  />
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                {ev.pubData && (
                                  <p className="text-xs text-zinc-500">
                                    {format(new Date(ev.pubData.scheduledAt), "HH:mm")}
                                    {ev.pubData.trendPost && (
                                      <span className="ml-2">
                                        &middot; post {ev.pubData.trendPost.position}
                                      </span>
                                    )}
                                  </p>
                                )}
                                <p className="text-sm text-zinc-200 truncate mt-0.5 leading-snug">
                                  {ev.label}
                                </p>
                                {ev.sublabel && (
                                  <p className="text-xs text-zinc-500 mt-0.5">{ev.sublabel}</p>
                                )}
                              </div>
                              {ev.link && (
                                <Link href={ev.link}>
                                  <Button variant="ghost" size="sm" className="text-xs shrink-0">
                                    Ver
                                  </Button>
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* List view */
            <div className="space-y-6">
              {Object.keys(allEvents).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20">
                  <CalendarDays className="h-12 w-12 text-zinc-600 mb-4" />
                  <p className="text-sm text-zinc-500">Nenhum evento este mes.</p>
                </div>
              ) : (
                Object.entries(allEvents)
                  .filter(([dateKey]) => {
                    const d = new Date(dateKey + "T12:00:00");
                    return isSameMonth(d, currentMonth);
                  })
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, evs]) => (
                    <div key={date} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-zinc-300 capitalize">
                          {format(
                            new Date(date + "T12:00:00"),
                            "EEEE, dd 'de' MMMM",
                            { locale: ptBR }
                          )}
                        </h3>
                        <div className="flex-1 h-px bg-zinc-800" />
                        <span className="text-xs text-zinc-500">{evs.length}</span>
                      </div>
                      {evs.map((ev) => (
                        <Card
                          key={ev.id}
                          className={
                            ev.type === "scale_opportunity"
                              ? "border-emerald-800/40"
                              : ev.type === "saturation_alert"
                              ? "border-amber-800/40"
                              : ev.type === "learning"
                              ? "border-violet-800/40"
                              : ""
                          }
                        >
                          <CardContent className="p-4 flex items-start gap-3">
                            {ev.type === "publication_published" ||
                            ev.type === "publication_scheduled" ? (
                              <span
                                className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${EVENT_DOT[ev.type]}`}
                              />
                            ) : ev.type === "scale_opportunity" ? (
                              <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : ev.type === "saturation_alert" ? (
                              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            ) : (
                              <Brain className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              {ev.pubData && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-zinc-500">
                                    {format(new Date(ev.pubData.scheduledAt), "HH:mm")}
                                  </span>
                                  <Badge
                                    variant={
                                      ev.type === "publication_published" ? "success" : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {ev.type === "publication_published" ? "Publicado" : "Agendado"}
                                  </Badge>
                                </div>
                              )}
                              <p className="text-sm text-zinc-200 line-clamp-2 leading-snug">
                                {ev.label}
                              </p>
                              {ev.sublabel && (
                                <p className="text-xs text-zinc-500 mt-0.5">{ev.sublabel}</p>
                              )}
                            </div>
                            {ev.link && (
                              <Link href={ev.link}>
                                <Button variant="ghost" size="sm" className="text-xs">
                                  Ver
                                </Button>
                              </Link>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
