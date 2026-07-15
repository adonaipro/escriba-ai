import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

interface AccountMetrics {
  id: string;
  network: string;
  username: string | null;
  displayName: string | null;
  activeNarrator: { id: string; name: string } | null;
  totalPublications: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  totalRevenue: number;
  ctr: number;
  campaignsCount: number;
  scalingCampaigns: number;
  hasAlert: boolean;
}

async function getWorkspaceData(profileId: string) {
  const accounts = await prisma.socialAccount.findMany({
    where: { profileId, status: "active" },
    include: {
      accountNarrators: {
        where: { isActive: true },
        include: { narrator: { select: { id: true, name: true } } },
        take: 1,
      },
      campaigns: {
        include: {
          publications: {
            where: { status: "published" },
            select: { clicks: true, impressions: true, revenueBrl: true, conversions: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const metrics: AccountMetrics[] = accounts.map((a) => {
    const allPubs = a.campaigns.flatMap((c) => c.publications);
    const totalClicks = allPubs.reduce((s, p) => s + (p.clicks ?? 0), 0);
    const totalImpressions = allPubs.reduce((s, p) => s + (p.impressions ?? 0), 0);
    const totalConversions = allPubs.reduce((s, p) => s + (p.conversions ?? 0), 0);
    const totalRevenue = allPubs.reduce((s, p) => s + (p.revenueBrl ?? 0), 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const scalingCampaigns = a.campaigns.filter((c) => c.status === "scaling").length;
    const hasAlert = a.campaigns.some((c) => c.status === "saturating");

    return {
      id: a.id,
      network: a.network,
      username: a.username,
      displayName: a.displayName,
      activeNarrator: a.accountNarrators[0]?.narrator ?? null,
      totalPublications: allPubs.length,
      totalClicks,
      totalImpressions,
      totalConversions,
      totalRevenue,
      ctr,
      campaignsCount: a.campaigns.length,
      scalingCampaigns,
      hasAlert,
    };
  });

  const totalRevenue = metrics.reduce((s, m) => s + m.totalRevenue, 0);
  const totalClicks = metrics.reduce((s, m) => s + m.totalClicks, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.totalConversions, 0);
  const totalImpressions = metrics.reduce((s, m) => s + m.totalImpressions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const sorted = [...metrics].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const bestAccount = sorted[0] ?? null;
  const worstAccount = sorted[sorted.length - 1] !== bestAccount ? sorted[sorted.length - 1] : null;

  return { metrics, bestAccount, worstAccount, totals: { totalRevenue, totalClicks, totalConversions, totalImpressions, avgCtr } };
}

function NetworkChip({ network }: { network: string }) {
  if (network === "threads") {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-blue-950/40 text-blue-400 border border-blue-800/30">
        T
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/50">
      X
    </span>
  );
}

function CtrDelta({ ctr }: { ctr: number }) {
  if (ctr === 0) return <span className="text-zinc-600">—</span>;
  const avgBenchmark = 2.0;
  if (ctr >= avgBenchmark) {
    return (
      <span className="flex items-center gap-1 text-emerald-400">
        <TrendingUp className="h-3 w-3" /> {formatPercent(ctr)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-amber-400">
      <TrendingDown className="h-3 w-3" /> {formatPercent(ctr)}
    </span>
  );
}

export default async function WorkspacePage() {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const { metrics, bestAccount, worstAccount, totals } = await getWorkspaceData(session.user.profile.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Visão geral do Workspace</h1>
          <p className="text-sm text-zinc-400">
            {metrics.length} conta{metrics.length !== 1 ? "s" : ""} ativa{metrics.length !== 1 ? "s" : ""} · comparação cruzada
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/integracoes">Conectar nova conta</Link>
        </Button>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Receita total",
            value: formatCurrency(totals.totalRevenue),
            sub: `${totals.totalConversions} conversões`,
            icon: DollarSign,
            color: "text-emerald-400",
            bg: "bg-emerald-600/10",
          },
          {
            label: "Cliques",
            value: formatNumber(totals.totalClicks),
            sub: `${formatNumber(totals.totalImpressions)} impressões`,
            icon: MousePointerClick,
            color: "text-blue-400",
            bg: "bg-blue-600/10",
          },
          {
            label: "CTR médio",
            value: formatPercent(totals.avgCtr),
            sub: totals.avgCtr >= 2 ? "acima da média" : totals.avgCtr > 0 ? "abaixo da média" : "sem dados",
            icon: TrendingUp,
            color: "text-amber-400",
            bg: "bg-amber-600/10",
          },
          {
            label: "Contas ativas",
            value: String(metrics.length),
            sub: `${metrics.reduce((s, m) => s + m.campaignsCount, 0)} campanhas`,
            icon: BarChart3,
            color: "text-violet-400",
            bg: "bg-violet-600/10",
          },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-400">{m.label}</span>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Comparison table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Comparação por conta</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {metrics.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-zinc-500 mb-3">Nenhuma conta conectada ainda.</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/integracoes">Conectar primeira conta</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left">
                        <th className="px-5 py-3 text-zinc-500 font-medium">Conta</th>
                        <th className="px-3 py-3 text-zinc-500 font-medium">Narrador</th>
                        <th className="px-3 py-3 text-zinc-500 font-medium text-right">CTR</th>
                        <th className="px-3 py-3 text-zinc-500 font-medium text-right">Conversão</th>
                        <th className="px-3 py-3 text-zinc-500 font-medium text-right">Comissão</th>
                        <th className="px-5 py-3 text-zinc-500 font-medium text-right">Publicações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {metrics.map((m) => (
                        <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {m.hasAlert && (
                                <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                              )}
                              <NetworkChip network={m.network} />
                              <div>
                                <p className="text-zinc-200 font-medium">@{m.username}</p>
                                {m.displayName && (
                                  <p className="text-zinc-600 text-[10px]">{m.displayName}</p>
                                )}
                              </div>
                              {m.id === bestAccount?.id && (
                                <Badge variant="success" className="text-[9px] py-0">melhor</Badge>
                              )}
                              {m.id === worstAccount?.id && totals.totalRevenue > 0 && (
                                <Badge variant="warning" className="text-[9px] py-0">menor CTR</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            {m.activeNarrator ? (
                              <Link href={`/narradores/${m.activeNarrator.id}`} className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
                                {m.activeNarrator.name}
                              </Link>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            <CtrDelta ctr={m.ctr} />
                          </td>
                          <td className="px-3 py-3.5 text-right text-zinc-300">
                            {m.totalConversions > 0 ? formatNumber(m.totalConversions) : <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="px-3 py-3.5 text-right text-emerald-400 font-medium">
                            {m.totalRevenue > 0 ? formatCurrency(m.totalRevenue) : <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-right text-zinc-400">
                            {m.totalPublications}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights sidebar */}
        <div className="space-y-4">
          {bestAccount && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <CardTitle className="text-base">Melhor conta</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <NetworkChip network={bestAccount.network} />
                  <p className="text-sm font-medium text-zinc-100">@{bestAccount.username}</p>
                </div>
                {bestAccount.activeNarrator && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Users className="h-3 w-3 text-violet-400" />
                    <span>Narrador: </span>
                    <Link href={`/narradores/${bestAccount.activeNarrator.id}`} className="text-violet-400 underline underline-offset-2">
                      {bestAccount.activeNarrator.name}
                    </Link>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2">
                    <p className="text-[10px] text-zinc-500">CTR</p>
                    <p className="text-sm font-bold text-emerald-400">{formatPercent(bestAccount.ctr)}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2">
                    <p className="text-[10px] text-zinc-500">Comissão</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(bestAccount.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI comparison hints */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-400" />
                <CardTitle className="text-base">Análise cruzada</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              {metrics.length < 2 ? (
                <p className="text-xs text-zinc-500 text-center py-2">
                  Conecte 2+ contas para ativar análise comparativa.
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Same narrator on different accounts */}
                  {(() => {
                    const narratorMap: Record<string, string[]> = {};
                    for (const m of metrics) {
                      if (m.activeNarrator) {
                        if (!narratorMap[m.activeNarrator.name]) narratorMap[m.activeNarrator.name] = [];
                        narratorMap[m.activeNarrator.name].push(`@${m.username}`);
                      }
                    }
                    const sharedNarrators = Object.entries(narratorMap).filter(([, accs]) => accs.length > 1);
                    return sharedNarrators.map(([name, accs]) => (
                      <div key={name} className="rounded-lg border border-violet-800/20 bg-violet-950/10 p-2.5">
                        <p className="text-[10px] text-violet-400 mb-0.5">mesmo narrador</p>
                        <p className="text-xs text-zinc-300">
                          <strong>{name}</strong> está ativo em {accs.join(" e ")} — compare o CTR para medir consistência.
                        </p>
                      </div>
                    ));
                  })()}

                  {/* Network comparison */}
                  {(() => {
                    const threadAccs = metrics.filter((m) => m.network === "threads");
                    const xAccs = metrics.filter((m) => m.network === "x");
                    if (threadAccs.length > 0 && xAccs.length > 0) {
                      const threadsCtr = threadAccs.reduce((s, m) => s + m.ctr, 0) / threadAccs.length;
                      const xCtr = xAccs.reduce((s, m) => s + m.ctr, 0) / xAccs.length;
                      const winner = threadsCtr >= xCtr ? "Threads" : "X";
                      return (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5">
                          <p className="text-[10px] text-zinc-500 mb-0.5">por rede</p>
                          <p className="text-xs text-zinc-300">
                            <strong>{winner}</strong> tem CTR médio maior ({formatPercent(Math.max(threadsCtr, xCtr))}) nesse período.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Accounts in scale */}
                  {(() => {
                    const inScale = metrics.filter((m) => m.scalingCampaigns > 0);
                    if (inScale.length > 0) {
                      return (
                        <div className="rounded-lg border border-emerald-800/20 bg-emerald-950/10 p-2.5">
                          <p className="text-[10px] text-emerald-400 mb-0.5">em escala</p>
                          <p className="text-xs text-zinc-300">
                            {inScale.map((m) => `@${m.username}`).join(", ")} tem{inScale.length > 1 ? "m" : ""} campanhas em escala ativa.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Alerts */}
                  {(() => {
                    const withAlerts = metrics.filter((m) => m.hasAlert);
                    if (withAlerts.length > 0) {
                      return (
                        <div className="rounded-lg border border-amber-800/20 bg-amber-950/10 p-2.5">
                          <p className="text-[10px] text-amber-400 mb-0.5">atenção</p>
                          <p className="text-xs text-zinc-300">
                            {withAlerts.map((m) => `@${m.username}`).join(", ")} tem{withAlerts.length > 1 ? "m" : ""} campanhas saturando.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {metrics.every((m) => m.totalRevenue === 0) && (
                    <div className="rounded-lg border border-zinc-800 p-2.5">
                      <p className="text-xs text-zinc-500">
                        Sem dados de conversão ainda — as análises comparativas aparecerão conforme as publicações acumulam métricas.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardContent className="p-4 space-y-1">
              {[
                { href: "/narradores", label: "Gerenciar Narradores", icon: Users },
                { href: "/integracoes", label: "Integrações", icon: Activity },
                { href: "/campanhas", label: "Todas as campanhas", icon: BarChart3 },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100 transition-colors py-1.5 px-1 rounded hover:bg-zinc-800/50"
                >
                  <item.icon className="h-3.5 w-3.5" />
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
