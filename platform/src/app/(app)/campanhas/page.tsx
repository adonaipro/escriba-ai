"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Megaphone, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- State metadata ---

const STATE_META: Record<
  string,
  { label: string; variant: "secondary" | "success" | "default" | "info" | "warning" | "outline"; dotClass: string; explanation: string }
> = {
  testing: {
    label: "Testando",
    variant: "secondary",
    dotClass: "bg-zinc-500",
    explanation: "Ainda poucos dados. A Entidade esta explorando formatos narrativos e coletando sinais iniciais.",
  },
  scale_eligible: {
    label: "Pronta para Escalar",
    variant: "success",
    dotClass: "bg-emerald-400",
    explanation: "Padrao narrativo validado. CTR e engajamento acima do limiar. A Entidade aguarda sua decisao.",
  },
  scaling: {
    label: "Escalando",
    variant: "default",
    dotClass: "bg-blue-400 animate-pulse",
    explanation: "Distribuicao aumentada automaticamente. Frequencia de publicacao elevada.",
  },
  monitoring: {
    label: "Monitorando",
    variant: "info",
    dotClass: "bg-sky-400",
    explanation: "Sinais promissores detectados. A Entidade aguarda confirmacao estatistica antes de recomendar escala.",
  },
  saturating: {
    label: "Saturando",
    variant: "warning",
    dotClass: "bg-amber-400",
    explanation: "Eficiencia em queda. Audiencia ja exposta ao padrao narrativo. Rotacao recomendada.",
  },
  paused: {
    label: "Pausada",
    variant: "outline",
    dotClass: "bg-zinc-600",
    explanation: "Publicacoes suspensas manualmente. Dados preservados.",
  },
  ended: {
    label: "Encerrada",
    variant: "outline",
    dotClass: "bg-zinc-700",
    explanation: "Campanha concluida. Historico disponivel para analise comparativa.",
  },
};

const ALL_STATES = ["all", "testing", "scale_eligible", "scaling", "monitoring", "saturating", "paused", "ended"];
const STATE_LABELS: Record<string, string> = {
  all: "Todas",
  testing: "Testando",
  scale_eligible: "Escala",
  scaling: "Escalando",
  monitoring: "Monitorando",
  saturating: "Saturando",
  paused: "Pausadas",
  ended: "Encerradas",
};

// --- Types ---

type CampaignData = {
  id: string;
  name: string;
  productName: string;
  status: string;
  createdAt: string;
  _count: { trends: number; publications: number };
  metrics: { clicks: number; impressions: number; revenue: number; ctr: number; trendsCount: number; publicationsCount: number };
};

// --- Tooltip component ---

function StateTooltip({ status }: { status: string }) {
  const [open, setOpen] = useState(false);
  const meta = STATE_META[status];
  if (!meta) return null;
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); setOpen(!open); }}
        className="text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <Info className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
          <p className="text-xs text-zinc-300 leading-relaxed">{meta.explanation}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-700" />
        </div>
      )}
    </div>
  );
}

// --- Campaign card ---

function CampaignCard({ campaign }: { campaign: CampaignData }) {
  const { clicks: totalClicks, impressions: totalImpressions, revenue: totalRevenue, ctr } = campaign.metrics;
  const meta = STATE_META[campaign.status] ?? STATE_META.testing;

  return (
    <Link href={`/campanhas/${campaign.id}`}>
      <Card className="hover:border-zinc-700 transition-colors cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dotClass}`} />
              <div className="min-w-0">
                <h3 className="font-semibold text-zinc-100 truncate group-hover:text-white">{campaign.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{campaign.productName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <StateTooltip status={campaign.status} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-zinc-500">Cliques</p>
              <p className="text-sm font-medium text-zinc-200">{formatNumber(totalClicks)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Impressoes</p>
              <p className="text-sm font-medium text-zinc-200">{formatNumber(totalImpressions)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">CTR</p>
              <p className="text-sm font-medium text-zinc-200">{formatPercent(ctr)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Receita</p>
              <p className="text-sm font-medium text-emerald-400">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
            <div className="flex gap-3 text-xs text-zinc-500">
              <span>{campaign.metrics.trendsCount} trend{campaign.metrics.trendsCount !== 1 ? "s" : ""}</span>
              <span>{campaign.metrics.publicationsCount} publicacoes</span>
            </div>
            <span className="text-xs text-zinc-600">
              {format(new Date(campaign.createdAt), "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// --- Page ---

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((j) => { setCampaigns(j.campaigns ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const countByState = (state: string) =>
    state === "all" ? campaigns.length : campaigns.filter((c) => c.status === state).length;

  const filtered =
    activeFilter === "all" ? campaigns : campaigns.filter((c) => c.status === activeFilter);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Campanhas</h1>
            <p className="text-sm text-zinc-400">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Campanhas</h1>
          <p className="text-sm text-zinc-400">
            {campaigns.length} campanha{campaigns.length !== 1 ? "s" : ""} &middot; mapeamento narrativo ativo
          </p>
        </div>
        <Button asChild>
          <Link href="/campanhas/nova">
            <Plus className="h-4 w-4" />
            Nova campanha
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20">
          <Megaphone className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">Nenhuma campanha ainda</h3>
          <p className="text-sm text-zinc-500 mb-6 text-center max-w-sm">
            Crie a primeira campanha para iniciar o mapeamento de padroes narrativos comportamentais.
          </p>
          <Button asChild>
            <Link href="/campanhas/nova">
              <Plus className="h-4 w-4" />
              Criar primeira campanha
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* State filter chips */}
          <div className="flex flex-wrap gap-2">
            {ALL_STATES.map((state) => {
              const count = countByState(state);
              if (state !== "all" && count === 0) return null;
              const isActive = activeFilter === state;
              return (
                <button
                  key={state}
                  onClick={() => setActiveFilter(state)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-zinc-400 bg-zinc-800 text-zinc-100"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {state !== "all" && (
                    <span className={`h-1.5 w-1.5 rounded-full ${STATE_META[state]?.dotClass ?? "bg-zinc-500"}`} />
                  )}
                  {STATE_LABELS[state]}
                  <span className={`${isActive ? "text-zinc-300" : "text-zinc-600"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active filter context */}
          {activeFilter !== "all" && STATE_META[activeFilter] && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400 leading-relaxed">{STATE_META[activeFilter].explanation}</p>
            </div>
          )}

          {/* Campaign grid */}
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-12">
              Nenhuma campanha neste estado.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filtered.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
