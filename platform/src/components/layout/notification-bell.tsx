"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Sparkles, Trophy, Plus, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NotifEvent {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  campaign: { id: string; name: string; productName: string };
}

const ENTITY_VOICE: Record<string, (e: NotifEvent) => string> = {
  created: (e) => `Registrei o início de "${e.campaign.productName}". Estou monitorando.`,
  generated: (e) => {
    const m = e.description ?? "";
    const family = m.match(/Família "([^"]+)"/)?.[1];
    return family
      ? `Escolhi a família "${family}" para esta narrativa. Sigo o padrão aprendido.`
      : "Nova narrativa tecida. Observo o resultado com atenção.";
  },
  win: () => "Padrão vencedor confirmado. Estou internalizando os elementos desta estrutura.",
  scheduled: () => "Narrativa agendada. Calculei o melhor momento para publicação.",
  published: () => "Publicado. Aguardo os primeiros sinais de performance.",
  error: () => "Encontrei uma resistência. Analiso a causa antes de prosseguir.",
};

function getEntityVoice(ev: NotifEvent): string {
  const fn = ENTITY_VOICE[ev.type];
  return fn ? fn(ev) : "Evento registrado na linha do tempo.";
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5 text-zinc-400" />,
  generated: <Sparkles className="h-3.5 w-3.5 text-violet-400" />,
  win: <Trophy className="h-3.5 w-3.5 text-emerald-400" />,
  scheduled: <Calendar className="h-3.5 w-3.5 text-blue-400" />,
  published: <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />,
  error: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

const LS_KEY = "notif_seen_at";

export function NotificationBell() {
  const [events, setEvents] = useState<NotifEvent[]>([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function computeBadge(evts: NotifEvent[]) {
    const seenAt = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    const cutoff = seenAt ? new Date(seenAt) : new Date(Date.now() - 48 * 60 * 60 * 1000);
    return evts.filter((e) => new Date(e.createdAt) > cutoff).length;
  }

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json() as { events: NotifEvent[] };
      setEvents(data.events);
      setBadgeCount(computeBadge(data.events));
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      localStorage.setItem(LS_KEY, new Date().toISOString());
      setBadgeCount(0);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-zinc-100">
          <Bell className="h-4 w-4" />
          {badgeCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 border border-zinc-800 bg-zinc-950 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold tracking-widest text-violet-300 uppercase">
            A Entidade
          </span>
        </div>

        {/* Events list */}
        <div className="max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">
              Nenhum evento registrado ainda.
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="border-b border-zinc-800/50 px-4 py-3 last:border-0 hover:bg-zinc-900/50"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex-shrink-0">
                    {TYPE_ICON[ev.type] ?? TYPE_ICON.created}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-xs font-medium text-zinc-200">{ev.title}</p>
                      <span className="flex-shrink-0 text-[10px] text-zinc-600">
                        {relativeTime(ev.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                      {ev.campaign.productName}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-snug text-violet-300/80 italic">
                      &ldquo;{getEntityVoice(ev)}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {events.length > 0 && (
          <div className="border-t border-zinc-800 px-4 py-2 text-center">
            <span className="text-[10px] text-zinc-600">
              {events.length} eventos · atualiza a cada 30s
            </span>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
