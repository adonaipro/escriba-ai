import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Clock, XCircle, TrendingUp,
  FlaskConical, Lightbulb, BarChart3, Megaphone, Link2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { describeNarrator } from "@/lib/narrators/names";
import { buildHypothesisSummary, DIMENSION_LABELS, HYPOTHESIS_POOLS } from "@/lib/narrators/hypothesis-engine";
import { NarratorActions } from "./narrator-actions";
import { AccountNarratorActions } from "./account-narrator-actions";

const STRATEGY_META: Record<string, { label: string; description: string; color: string }> = {
  clickbait:  { label: "Clickbait",   description: "Produto como gatilho de curiosidade",       color: "text-amber-400" },
  contextual: { label: "Contextual",  description: "Produto coerente com o universo da história", color: "text-blue-400" },
  hybrid:     { label: "Híbrida",     description: "Produto nasce como consequência natural",     color: "text-violet-400" },
};

export default async function NarradorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const { id } = await params;
  const profileId = session.user.profile.id;

  const narrator = await prisma.narrator.findFirst({
    where: { id, profileId },
    include: {
      hypotheses: { orderBy: [{ status: "asc" }, { usageCount: "desc" }] },
      insights: { orderBy: { confidence: "desc" } },
      campaigns: {
        select: { id: true, name: true, productName: true, status: true, _count: { select: { trends: true } } },
      },
      _count: { select: { trends: true } },
      trends: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true, hook: true, productStrategy: true, tone: true,
          rhythm: true, conflictType: true, questionType: true,
          totalClicks: true, totalImpressions: true, totalConversions: true,
          createdAt: true,
        },
      },
      accountNarrators: {
        include: {
          socialAccount: { select: { id: true, network: true, username: true, status: true } },
        },
        orderBy: [{ isActive: "desc" }, { startedAt: "desc" }],
      },
    },
  });

  if (!narrator) notFound();

  const profileAccounts = await prisma.socialAccount.findMany({
    where: { profileId, status: "active" },
    select: { id: true, network: true, username: true, displayName: true },
  });

  const description = describeNarrator(narrator);
  const hypothesisSummary = buildHypothesisSummary(narrator.hypotheses);

  // Product strategy stats
  const strategyStats = (["clickbait", "contextual", "hybrid"] as const).map((s) => {
    const ts = narrator.trends.filter((t) => t.productStrategy === s);
    const totalImp = ts.reduce((sum, t) => sum + t.totalImpressions, 0);
    const totalClk = ts.reduce((sum, t) => sum + t.totalClicks, 0);
    return { strategy: s, count: ts.length, ctr: totalImp > 0 ? (totalClk / totalImp) * 100 : 0 };
  });

  // Per-dimension hypothesis view
  const dimensions = Object.keys(HYPOTHESIS_POOLS) as Array<keyof typeof HYPOTHESIS_POOLS>;
  const byDimension = dimensions.map((dim) => ({
    dimension: dim,
    label: DIMENSION_LABELS[dim],
    hypotheses: narrator.hypotheses.filter((h) => h.dimension === dim),
  }));

  const totalImp = narrator.totalImpressions;
  const overallCtr = totalImp > 0 ? (narrator.totalClicks / totalImp) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/narradores"
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Narradores
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-zinc-100">{narrator.name}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                narrator.status === "active"
                  ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-400"
                  : "border-zinc-700 bg-zinc-800/40 text-zinc-500"
              }`}
            >
              {narrator.status === "active" ? "ativa" : "pausada"}
            </span>
          </div>
          <p className="text-sm text-zinc-400">{description}</p>
        </div>
        <NarratorActions narratorId={narrator.id} currentStatus={narrator.status} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Histórias", value: narrator._count.trends },
          { label: "CTR médio", value: overallCtr > 0 ? `${overallCtr.toFixed(1)}%` : "—" },
          { label: "Conversões", value: narrator.totalConversions || "—" },
          { label: "Hipót. vencedoras", value: hypothesisSummary.winners.length },
          { label: "Em teste", value: hypothesisSummary.testing.length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-zinc-100">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entidade voice */}
      <div className="rounded-lg border border-l-2 border-violet-800/30 border-l-violet-500 bg-zinc-900/50 p-4">
        <p className="text-xs text-violet-400 font-mono mb-2 tracking-wide">A ENTIDADE SOBRE {narrator.name.toUpperCase()}</p>
        <p className="text-sm text-zinc-300 font-mono leading-relaxed">
          {hypothesisSummary.winners.length > 0
            ? `Já identifiquei ${hypothesisSummary.winners.length} padrão${hypothesisSummary.winners.length > 1 ? "ões" : ""} vencedor${hypothesisSummary.winners.length > 1 ? "es" : ""} para ${narrator.name}. Estou priorizando esses valores nas próximas gerações.`
            : `Ainda em fase de exploração para ${narrator.name}. Preciso de mais histórias para identificar padrões consistentes.`
          }
          {` Tenho ${hypothesisSummary.testing.length} hipótese${hypothesisSummary.testing.length > 1 ? "s" : ""} sendo testada${hypothesisSummary.testing.length > 1 ? "s" : ""} neste momento.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Descobertas de {narrator.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {narrator.insights.length === 0 ? (
              <p className="text-xs text-zinc-600">
                Descobertas aparecem automaticamente conforme a IA acumula dados suficientes.
              </p>
            ) : (
              <div className="space-y-3">
                {narrator.insights.map((ins) => (
                  <div key={ins.id} className="flex items-start gap-2">
                    {ins.impact === "positive" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{ins.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{ins.body}</p>
                      <p className="text-[10px] text-zinc-700 mt-0.5">
                        {Math.round(ins.confidence * 100)}% confiança · {ins.sampleSize} amostras · {ins.niche}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product strategy comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Estratégia de Inserção do Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategyStats.map(({ strategy, count, ctr }) => {
                const meta = STRATEGY_META[strategy];
                return (
                  <div key={strategy} className="flex items-center gap-3">
                    <div className="w-20 shrink-0">
                      <p className={`text-xs font-medium ${meta.color}`}>{meta.label}</p>
                      <p className="text-[10px] text-zinc-600">{count} histórias</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-zinc-400">
                          {ctr > 0 ? `${ctr.toFixed(1)}% CTR` : "sem dados"}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500/60 transition-all"
                          style={{ width: count > 0 ? `${Math.min(ctr * 10, 100)}%` : "0%" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-zinc-700 mt-2">
                A IA compara CTR, retenção e conversão entre estratégias e aprende qual funciona melhor para este narrador + nicho.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hypothesis explorer */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-violet-400" />
            Experimentos Ativos — todas as dimensões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byDimension.map(({ dimension, label, hypotheses }) => {
              if (hypotheses.length === 0) return null;
              return (
                <div key={dimension} className="space-y-1.5">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</p>
                  {hypotheses.map((h) => (
                    <div
                      key={h.id}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                        h.status === "winner"
                          ? "bg-emerald-950/20 border border-emerald-800/30"
                          : h.status === "loser"
                          ? "bg-red-950/20 border border-red-800/30 opacity-60"
                          : "bg-zinc-900/50 border border-zinc-800/40"
                      }`}
                    >
                      <span
                        className={
                          h.status === "winner"
                            ? "text-emerald-300"
                            : h.status === "loser"
                            ? "text-red-400"
                            : "text-zinc-400"
                        }
                      >
                        {h.value}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {h.status === "winner" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        {h.status === "loser"  && <XCircle      className="h-3 w-3 text-red-400" />}
                        {h.status === "testing" && <Clock        className="h-3 w-3 text-zinc-600" />}
                        {h.usageCount > 0 && (
                          <span className="text-[10px] text-zinc-600">{h.usageCount}×</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Campaigns */}
      {narrator.campaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-zinc-400" />
              Campanhas de {narrator.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {narrator.campaigns.map((camp) => (
                <Link key={camp.id} href={`/campanhas/${camp.id}`} className="block">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 hover:border-zinc-700 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{camp.name}</p>
                      <p className="text-xs text-zinc-500">{camp.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-600">{camp._count.trends} histórias</p>
                      <p className={`text-[10px] ${camp.status === "active" ? "text-emerald-400" : "text-zinc-600"}`}>
                        {camp.status}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent trends */}
      {narrator.trends.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-400" />
              Histórias recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {narrator.trends.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-zinc-800/40 bg-zinc-900/30 px-3 py-2"
                >
                  <p className="text-xs text-zinc-300 mb-1 leading-snug">{t.hook}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-600">
                    {t.productStrategy && (
                      <span className={STRATEGY_META[t.productStrategy]?.color ?? "text-zinc-500"}>
                        {STRATEGY_META[t.productStrategy]?.label}
                      </span>
                    )}
                    {t.tone && <span>· {t.tone}</span>}
                    {t.rhythm && <span>· {t.rhythm}</span>}
                    {t.totalClicks > 0 && (
                      <span className="text-zinc-400 ml-auto">{t.totalClicks} cliques</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked accounts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4 text-zinc-400" />
            Contas vinculadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {narrator.accountNarrators.length === 0 && profileAccounts.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-zinc-600 mb-3">
                {narrator.name} ainda não está vinculado a nenhuma conta social.
              </p>
              <p className="text-[10px] text-zinc-700">
                Acesse uma conta em{" "}
                <Link href="/integracoes" className="underline text-zinc-500 hover:text-zinc-300">
                  Integrações
                </Link>{" "}
                para vincular este Narrador.
              </p>
            </div>
          ) : (
            <AccountNarratorActions
              narratorId={narrator.id}
              accountNarrators={narrator.accountNarrators.map((an) => ({
                id: an.id,
                isActive: an.isActive,
                socialAccountId: an.socialAccountId,
                socialAccount: {
                  id: an.socialAccount.id,
                  network: an.socialAccount.network,
                  username: an.socialAccount.username,
                },
              }))}
              availableAccounts={profileAccounts}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
