import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  TrendingUp,
  Eye,
  DollarSign,
  ArrowUpRight,
  AlertTriangle,
  Zap,
  CalendarDays,
  ListOrdered,
  CheckCircle2,
  TrendingDown,
  Activity,
  Brain,
  Minus,
  Users,
  FlaskConical,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, formatPercent, campaignStatusLabel } from "@/lib/utils";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getSelectedAccountId } from "@/lib/account";
import { resolveDateRange } from "@/lib/analytics/date-range";
import { buildDailyPerformance } from "@/lib/analytics/daily-performance";
import { DateRangeFilter } from "@/components/analytics/date-range-filter";
import { PerformanceChart } from "@/components/analytics/performance-chart";
import { hasShopeeCredentials } from "@/lib/providers/shopee-client";
import { getShopeeMetricsSummary, syncShopeeConversions } from "@/lib/providers/shopee-conversions";

function statusColor(status: string) {
  const colors: Record<string, string> = {
    testing: "secondary",
    scale_eligible: "success",
    scaling: "default",
    monitoring: "info",
    saturating: "warning",
    paused: "outline",
    ended: "outline",
  };
  return (colors[status] || "secondary") as Parameters<typeof Badge>[0]["variant"];
}

function statusDot(status: string) {
  const map: Record<string, string> = {
    testing: "bg-zinc-500",
    scale_eligible: "bg-emerald-400",
    scaling: "bg-blue-400 animate-pulse",
    monitoring: "bg-sky-400",
    saturating: "bg-amber-400",
    paused: "bg-zinc-600",
    ended: "bg-zinc-700",
  };
  return map[status] ?? "bg-zinc-600";
}

function impactIcon(impact: string) {
  if (impact === "positive") return { Icon: TrendingUp, color: "text-emerald-400" };
  if (impact === "negative") return { Icon: TrendingDown, color: "text-red-400" };
  return { Icon: Minus, color: "text-zinc-400" };
}

function formatScheduleLabel(date: Date): string {
  if (isToday(date)) return `Hoje, ${format(date, "HH:mm")}`;
  if (isTomorrow(date)) return `Amanha, ${format(date, "HH:mm")}`;
  return format(date, "dd MMM, HH:mm", { locale: ptBR });
}

async function getDashboardData(profileId: string, accountId: string | null, range: ReturnType<typeof resolveDateRange>) {
  const now = new Date();
  const twentyFourHoursAhead = new Date(now.getTime() + 24 * 3600000);
  const selectedAccountId = accountId ?? "__no_selected_account__";
  const campaignWhere = { profileId, socialAccountId: selectedAccountId };
  const publishedAt = range.from ? { gte: range.from, lte: range.to } : { lte: range.to };

  const [campaigns, learnings, publications, upcoming, topPatterns, activeJobs, narrators, globalInsights, recommendations] = await Promise.all([
    prisma.campaign.findMany({
      where: campaignWhere,
      include: {
        _count: { select: { trends: true, publications: true } },
        publications: {
          where: { status: "published", publishedAt },
          select: { clicks: true, impressions: true, revenueBrl: true, conversions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.learning.findMany({
      where: { profileId, state: "active", campaign: { socialAccountId: selectedAccountId } },
      orderBy: { recordedAt: "desc" },
      take: 5,
    }),
    prisma.publication.findMany({
      where: { campaign: campaignWhere, status: "published", publishedAt },
      select: { clicks: true, impressions: true, revenueBrl: true, conversions: true, likes: true, replies: true, reposts: true, quotes: true, shares: true, publishedAt: true, metricsSyncedAt: true },
    }),
    prisma.publication.findMany({
      where: {
        campaign: campaignWhere,
        status: { in: ["scheduled", "pending"] },
        scheduledAt: { gte: now, lte: twentyFourHoursAhead },
      },
      include: {
        campaign: { select: { id: true, name: true, targetNetwork: true } },
        trend: { select: { format: true, hook: true } },
        trendPost: { select: { position: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    prisma.narrativePattern.findMany({
      where: { profileId, socialAccountId: selectedAccountId },
      orderBy: [{ winCount: "desc" }, { usageCount: "desc" }],
      take: 6,
    }),
    prisma.generationJob.findMany({
      where: {
        campaign: campaignWhere,
        status: { notIn: ["completed", "failed"] },
      },
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.narrator.findMany({
      where: { profileId, status: "active", accountNarrators: { some: { socialAccountId: selectedAccountId, isActive: true } } },
      include: {
        hypotheses: { where: { status: "winner" }, select: { dimension: true, value: true } },
        _count: { select: { trends: true } },
      },
      orderBy: { totalConversions: "desc" },
      take: 3,
    }),
    prisma.globalInsight.findMany({
      where: { profileId, id: "__account_scoped_only__" },
      orderBy: { confidence: "desc" },
      take: 2,
    }),
    prisma.narratorRecommendation.findMany({
      where: { profileId, status: "pending", targetNarrator: { accountNarrators: { some: { socialAccountId: selectedAccountId } } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // Threads-side metrics (impressions/engagement from Meta insights).
  // Affiliate revenue/conversions come from Shopee conversionReport — not from publications.
  const totalClicks = publications.reduce((s, p) => s + (p.clicks || 0), 0);
  const totalImpressions = publications.reduce((s, p) => s + (p.impressions || 0), 0);
  const totalEngagements = publications.reduce((s, p) => s + (p.likes || 0) + (p.replies || 0) + (p.reposts || 0) + (p.quotes || 0) + (p.shares || 0), 0);
  const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;
  const publishedPosts = publications.length;
  const publishedCampaigns = campaigns.filter((campaign) => campaign.publications.length > 0).length;
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const latestMetricsSync = publications.reduce<Date | null>((latest, publication) => !publication.metricsSyncedAt ? latest : !latest || publication.metricsSyncedAt > latest ? publication.metricsSyncedAt : latest, null);
  const dailyPerformance = buildDailyPerformance(publications, {
    from: range.from,
    to: range.to,
    fillGaps: Boolean(range.from),
  });

  // Computed intelligence signals
  const scaleEligible = campaigns.filter((c) => c.status === "scale_eligible");
  const saturating = campaigns.filter((c) => c.status === "saturating");
  const scaling = campaigns.filter((c) => c.status === "scaling");
  const testing = campaigns.filter((c) => c.status === "testing");

  // Build intelligence feed
  type Signal = { type: "opportunity" | "warning" | "discovery" | "info"; message: string; link?: string; linkLabel?: string };
  const signals: Signal[] = [];

  for (const c of scaleEligible) {
    signals.push({
      type: "opportunity",
      message: `Padrao narrativo validado em "${c.name}". A Entidade aguarda sua decisao de escala.`,
      link: `/campanhas/${c.id}`,
      linkLabel: "Escalar agora",
    });
  }
  for (const c of saturating) {
    signals.push({
      type: "warning",
      message: `"${c.name}" esta saturando. Eficiencia em queda detectada. Rotacao narrativa recomendada.`,
      link: `/campanhas/${c.id}`,
      linkLabel: "Ver campanha",
    });
  }
  if (learnings.length > 0) {
    signals.push({
      type: "discovery",
      message: `A Entidade registrou ${learnings.length} padrao${learnings.length > 1 ? "es" : ""} narrativo${learnings.length > 1 ? "s" : ""}. Novos aprendizados disponiveis.`,
      link: "/aprendizados",
      linkLabel: "Ver padroes",
    });
  }
  if (upcoming.length > 0) {
    signals.push({
      type: "info",
      message: `${upcoming.length} publicacao${upcoming.length > 1 ? "oes" : ""} agendada${upcoming.length > 1 ? "s" : ""} nas proximas 24h.`,
      link: "/fila",
      linkLabel: "Ver fila",
    });
  }
  if (topPatterns.length > 0 && topPatterns[0].usageCount >= 3) {
    signals.push({
      type: "discovery",
      message: `Biblioteca narrativa com ${topPatterns.length} elementos registrados. Elemento mais testado: "${topPatterns[0].value}" (${topPatterns[0].usageCount}×).`,
      link: "/narrativas",
      linkLabel: "Ver biblioteca",
    });
  }
  if (activeJobs.length > 0) {
    signals.push({
      type: "info",
      message: `${activeJobs.length} geração${activeJobs.length > 1 ? "ões" : ""} em andamento: ${activeJobs.map((j) => j.campaign.name).join(", ")}.`,
      link: `/campanhas/${activeJobs[0].campaign.id}`,
      linkLabel: "Ver progresso",
    });
  }
  if (campaigns.length === 0) {
    signals.push({
      type: "info",
      message: "Nenhuma campanha ativa. Crie a primeira para iniciar o mapeamento narrativo.",
      link: "/campanhas/nova",
      linkLabel: "Criar campanha",
    });
  }
  if (recommendations.length > 0) {
    signals.push({
      type: "discovery",
      message: `A Entidade tem ${recommendations.length} recomendação${recommendations.length > 1 ? "ões" : ""} de Narrador aguardando sua decisão.`,
      link: "/narradores",
      linkLabel: "Ver recomendações",
    });
  }

  return {
    metrics: { totalClicks, totalImpressions, avgCtr, totalEngagements, engagementRate, publishedPosts, publishedCampaigns, latestMetricsSync },
    campaigns,
    scaleEligible,
    saturating,
    scaling,
    testing,
    learnings,
    upcoming,
    signals,
    topPatterns,
    activeJobs,
    narrators,
    globalInsights,
    recommendations,
    dailyPerformance,
  };
}

function SignalIcon({ type }: { type: "opportunity" | "warning" | "discovery" | "info" }) {
  if (type === "opportunity") return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />;
  if (type === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />;
  if (type === "discovery") return <Brain className="h-3.5 w-3.5 text-pink-400 shrink-0 mt-0.5" />;
  return <Activity className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />;
}

function signalBorder(type: "opportunity" | "warning" | "discovery" | "info") {
  if (type === "opportunity") return "border-emerald-800/40 bg-emerald-950/20";
  if (type === "warning") return "border-amber-800/40 bg-amber-950/20";
  if (type === "discovery") return "border-pink-800/40 bg-pink-950/20";
  return "border-zinc-800 bg-zinc-900/50";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const accountId = await getSelectedAccountId(session.user.profile.id);
  const params = await searchParams;
  const range = resolveDateRange(params.period, params.from, params.to);
  const profileId = session.user.profile.id;
  const data = await getDashboardData(profileId, accountId, range);
  const activeCampaigns = data.campaigns.filter((c) => !["paused", "ended"].includes(c.status));

  // Shopee affiliate metrics (official conversionReport) — independent of Threads publications.
  let shopeeMetrics: Awaited<ReturnType<typeof getShopeeMetricsSummary>> | null = null;
  if (hasShopeeCredentials()) {
    try {
      shopeeMetrics = await getShopeeMetricsSummary(profileId, range.from, range.to);
      const staleMs = 6 * 60 * 60 * 1000;
      const needsRefresh =
        !shopeeMetrics.lastSyncedAt ||
        Date.now() - shopeeMetrics.lastSyncedAt.getTime() > staleMs;
      if (needsRefresh) {
        await syncShopeeConversions(profileId, {
          purchaseTimeStart: range.from ?? new Date(Date.now() - 90 * 86400000),
          purchaseTimeEnd: range.to,
          maxPages: 4,
        }).catch(() => null);
        shopeeMetrics = await getShopeeMetricsSummary(profileId, range.from, range.to);
      }
    } catch {
      shopeeMetrics = null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Central de Inteligencia</h1>
          <p className="text-sm text-zinc-400">
            {activeCampaigns.length} campanha{activeCampaigns.length !== 1 ? "s" : ""} ativa{activeCampaigns.length !== 1 ? "s" : ""} &middot; {data.campaigns.length} total
          </p>
        </div>
        <Button asChild>
          <Link href="/campanhas/nova">
            <Zap className="h-4 w-4" />
            Nova campanha
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <DateRangeFilter period={range.period} from={range.fromInput} to={range.toInput} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
          <span>Resultados acumulados dos posts publicados em: {range.label}.</span>
          <span>{data.metrics.latestMetricsSync ? `Última sincronização: ${format(data.metrics.latestMetricsSync, "dd/MM/yyyy HH:mm")}` : "Aguardando primeira sincronização de métricas"}</span>
        </div>
      </div>

      {/* Onboarding checklist — shown until user has at least one campaign */}
      {data.campaigns.length === 0 && (
        <div className="rounded-xl border border-pink-800/30 bg-pink-950/10 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-pink-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Primeiros passos</h2>
          </div>
          <p className="text-xs text-zinc-500 mb-4">Complete esses passos para começar a gerar conteúdo.</p>
          <div className="space-y-2">
            {[
              {
                done: data.narrators.length > 0,
                label: "Criar seu primeiro Narrador",
                detail: "A voz que conta as histórias. Leva 2 minutos com um quiz rápido.",
                href: "/narradores/novo",
                cta: "Criar Narrador",
              },
              {
                done: false,
                label: "Testar uma narrativa no Laboratório",
                detail: "Gere histórias e veja como a IA trabalha antes de criar uma campanha.",
                href: "/laboratorio",
                cta: "Abrir Lab",
              },
              {
                done: false,
                label: "Lançar sua primeira Campanha",
                detail: "Vincule um produto afiliado e comece a rastrear resultados reais.",
                href: "/campanhas/nova",
                cta: "Criar Campanha",
              },
            ].map((step) => (
              <div
                key={step.label}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  step.done
                    ? "border-emerald-800/30 bg-emerald-950/10 opacity-60"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    step.done ? "border-emerald-500 bg-emerald-500" : "border-zinc-600"
                  }`}
                >
                  {step.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.done ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                    {step.label}
                  </p>
                  {!step.done && <p className="text-xs text-zinc-500 mt-0.5">{step.detail}</p>}
                </div>
                {!step.done && (
                  <Button asChild size="sm" variant="outline" className="shrink-0 text-xs">
                    <Link href={step.href}>{step.cta}</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intelligence feed */}
      {data.signals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Feed de sinais</p>
          <div className="space-y-2">
            {data.signals.map((s, i) => (
              <div key={i} className={`rounded-lg border p-3 flex items-start gap-3 ${signalBorder(s.type)}`}>
                <SignalIcon type={s.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 leading-relaxed">{s.message}</p>
                </div>
                {s.link && (
                  <Link
                    href={s.link}
                    className="text-xs text-zinc-400 hover:text-zinc-100 shrink-0 underline underline-offset-2"
                  >
                    {s.linkLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shopee affiliate KPIs — source: conversionReport (official affiliate panel) */}
      {shopeeMetrics && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Shopee afiliados</p>
            <span className="text-[11px] text-zinc-600">
              Fonte: conversionReport · {shopeeMetrics.lastSyncedAt
                ? `sincronizado ${format(shopeeMetrics.lastSyncedAt, "dd/MM/yyyy HH:mm")}`
                : "ainda não sincronizado"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {[
              {
                title: "Comissão acumulada",
                value: formatCurrency(shopeeMetrics.totalCommission),
                icon: DollarSign,
                color: "text-emerald-400",
                bg: "bg-emerald-600/10",
                sub: "totalCommission (painel Shopee)",
              },
              {
                title: "Conversões",
                value: formatNumber(shopeeMetrics.conversions),
                icon: TrendingUp,
                color: "text-pink-400",
                bg: "bg-pink-600/10",
                sub: "conversionIds únicos",
              },
              {
                title: "Pedidos",
                value: formatNumber(shopeeMetrics.orders),
                icon: ListOrdered,
                color: "text-amber-400",
                bg: "bg-amber-600/10",
                sub: `${shopeeMetrics.completedOrders} completed · ${shopeeMetrics.pendingOrders} pending`,
              },
              {
                title: "Itens vendidos",
                value: formatNumber(shopeeMetrics.itemsSold),
                icon: Activity,
                color: "text-cyan-400",
                bg: "bg-cyan-600/10",
                sub: "soma de qty nos itens",
              },
              {
                title: "Receita (GMV)",
                value: formatCurrency(shopeeMetrics.revenueGmv),
                icon: DollarSign,
                color: "text-blue-400",
                bg: "bg-blue-600/10",
                sub: "itemPrice × qty",
              },
            ].map((m) => (
              <Card key={m.title}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-zinc-400">{m.title}</span>
                    <div className={`rounded-lg p-1.5 ${m.bg}`}>
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-zinc-100">{m.value}</div>
                  <p className="text-xs text-zinc-500 mt-1">{m.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Threads KPI cards */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Threads · conteúdo</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {[
            {
              title: "Visualizações",
              value: formatNumber(data.metrics.totalImpressions),
              icon: Eye,
              color: "text-blue-400",
              bg: "bg-blue-600/10",
              sub: data.metrics.totalClicks > 0 ? `${formatNumber(data.metrics.totalClicks)} cliques rastreados` : "insights do Threads",
            },
            {
              title: "Interações",
              value: formatNumber(data.metrics.totalEngagements),
              icon: Users,
              color: "text-amber-400",
              bg: "bg-amber-600/10",
              sub: "curtidas, respostas e compartilhamentos",
            },
            {
              title: "Engajamento",
              value: formatPercent(data.metrics.engagementRate),
              icon: TrendingUp,
              color: "text-cyan-400",
              bg: "bg-cyan-600/10",
              sub: "interações por visualização",
            },
            {
              title: "Posts publicados",
              value: formatNumber(data.metrics.publishedPosts),
              icon: CalendarDays,
              color: "text-blue-400",
              bg: "bg-blue-600/10",
              sub: "blocos enviados ao Threads",
            },
            {
              title: "Campanhas publicadas",
              value: String(data.metrics.publishedCampaigns),
              icon: Activity,
              color: "text-pink-400",
              bg: "bg-pink-600/10",
              sub: `${activeCampaigns.length} ativas nesta conta`,
            },
          ].map((m) => (
            <Card key={m.title}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-400">{m.title}</span>
                  <div className={`rounded-lg p-1.5 ${m.bg}`}>
                    <m.icon className={`h-4 w-4 ${m.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-100">{m.value}</div>
                <p className="text-xs text-zinc-500 mt-1">{m.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <PerformanceChart data={data.dailyPerformance} />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Campaign status panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Estado das campanhas</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/campanhas">Ver todas</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.campaigns.length === 0 ? (
                <div className="px-5 pb-5 text-center py-8 text-zinc-500">
                  <p className="text-sm">Nenhuma campanha ainda.</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/campanhas/nova">Criar primeira campanha</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {data.campaigns.slice(0, 6).map((c) => {
                    const impressions = c.publications.reduce((s, p) => s + (p.impressions || 0), 0);
                    const clicks = c.publications.reduce((s, p) => s + (p.clicks || 0), 0);
                    return (
                      <Link
                        key={c.id}
                        href={`/campanhas/${c.id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot(c.status)}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-white">
                              {c.name}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {c._count.trends} trends &middot; {c._count.publications} publicacoes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-zinc-400">{formatNumber(impressions)} views</p>
                            <p className="text-xs text-zinc-500">{formatNumber(clicks)} cliques</p>
                          </div>
                          <Badge variant={statusColor(c.status)}>{campaignStatusLabel(c.status)}</Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 24h timeline */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-zinc-400" />
                  <CardTitle className="text-base">Proximas 24h</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/fila">Ver fila completa</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.upcoming.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-zinc-500 text-center py-6">
                  Nenhuma publicacao agendada nas proximas 24h.
                </p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {data.upcoming.map((pub) => (
                    <div key={pub.id} className="flex items-start gap-3 px-5 py-3">
                      <div className="pt-0.5 shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-500">
                          {formatScheduleLabel(new Date(pub.scheduledAt))}
                          {pub.trendPost && (
                            <span className="ml-2 text-zinc-600">&middot; post {pub.trendPost.position}</span>
                          )}
                        </p>
                        <p className="text-sm text-zinc-300 truncate mt-0.5 leading-snug">
                          {pub.trend?.hook ?? "—"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">{pub.campaign.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0 capitalize">
                        {pub.campaign.targetNetwork}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Learnings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-pink-400" />
                  <CardTitle className="text-base">Padroes detectados</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/aprendizados">Ver todos</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {data.learnings.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  A Entidade ainda nao detectou padroes.
                </p>
              ) : (
                data.learnings.map((l) => {
                  const { Icon, color } = impactIcon(l.impact);
                  return (
                    <div key={l.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                      <div className="flex items-start gap-2">
                        <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${color}`} />
                        <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                          {l.summary}
                        </p>
                      </div>
                      {l.autoApplied && (
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span className="text-xs text-emerald-400">Aplicado automaticamente</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Narrator recommendations */}
          {data.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    <CardTitle className="text-base">Recomendações da Entidade</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/narradores">Ver todas</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {data.recommendations.map((rec) => (
                  <Link key={rec.id} href="/narradores">
                    <div className="rounded-lg border border-amber-800/20 bg-amber-950/10 p-3 hover:border-amber-700/40 transition-colors">
                      <p className="text-xs font-medium text-zinc-200 line-clamp-2">{rec.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-amber-400">
                          {Math.round(rec.confidence * 100)}% confiança
                        </span>
                        <span className="text-[10px] text-zinc-600">·</span>
                        <span className="text-[10px] text-zinc-500">{rec.sampleSize} amostras</span>
                        <span className="text-[10px] text-amber-600 ml-auto">aguardando você</span>
                      </div>
                    </div>
                  </Link>
                ))}
                <p className="text-[10px] text-zinc-700 pt-1">
                  A Entidade nunca age sozinha — toda decisão estrutural é sua.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Narrators + global insights */}
          {data.narrators.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-pink-400" />
                    <CardTitle className="text-base">Narradores</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/narradores">Ver todos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {data.globalInsights.map((gi) => (
                  <div key={gi.id} className="rounded-lg border border-pink-800/20 bg-pink-950/10 p-2.5">
                    <p className="text-[10px] text-pink-400 mb-0.5">descoberta global</p>
                    <p className="text-xs text-zinc-300">{gi.title}</p>
                  </div>
                ))}
                {data.narrators.map((n) => (
                  <Link key={n.id} href={`/narradores/${n.id}`}>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-2.5 py-2 hover:border-zinc-700 transition-colors">
                      <div>
                        <p className="text-xs font-medium text-zinc-200">{n.name}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {n.hypotheses.slice(0, 2).map((h) => (
                            <span key={h.value} className="text-[9px] px-1 py-0 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-800/20">
                              {h.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-xs text-zinc-500">{n._count.trends} histórias</p>
                        {n.hypotheses.length > 0 && (
                          <p className="text-[10px] text-emerald-400">{n.hypotheses.length} vencedoras</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                {data.narrators.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-zinc-500 mb-2">Nenhum narrador ativo.</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/narradores/novo">Criar Narrador</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top narrative patterns */}
          {data.topPatterns.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Elementos narrativos</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/narrativas">Biblioteca</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                {data.topPatterns.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 flex-1 truncate">{p.value}</span>
                    <span className="text-xs text-zinc-600 shrink-0 font-mono">{p.type}</span>
                    <span className="text-xs text-zinc-500 shrink-0">{p.usageCount}×</span>
                    {p.winCount > 0 && (
                      <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acesso rapido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pb-4">
              {[
                { href: "/trends", icon: TrendingUp, label: "Ver todas as Trends" },
                { href: "/calendario", icon: CalendarDays, label: "Calendario estrategico" },
                { href: "/fila", icon: ListOrdered, label: "Fila operacional" },
                { href: "/aprendizados", icon: Brain, label: "Padroes narrativos" },
                { href: "/narrativas", icon: Activity, label: "Biblioteca narrativa" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors py-1.5 rounded px-1 hover:bg-zinc-800/50"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
