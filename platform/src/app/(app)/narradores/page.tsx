import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Users, TrendingUp, FlaskConical, CheckCircle2, Clock, Activity, Lightbulb, BarChart2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { describeNarrator } from "@/lib/narrators/names";
import { parseEvidence, parseSuggestedProfile } from "@/lib/narrators/recommendation-engine";

const AGE_LABEL: Record<string, string> = {
  "18-25": "18–25 anos",
  "26-35": "26–35 anos",
  "36-45": "36–45 anos",
  "46+": "46+ anos",
};

const STATUS_LABEL: Record<string, string> = {
  single: "Solteira",
  dating: "Namorando",
  married: "Casada",
  divorced: "Divorciada",
};

const STATUS_LABEL_M: Record<string, string> = {
  single: "Solteiro",
  dating: "Namorando",
  married: "Casado",
  divorced: "Divorciado",
};

const STRATEGY_LABEL: Record<string, string> = {
  clickbait: "Clickbait",
  contextual: "Contextual",
  hybrid: "Híbrida",
};

export default async function NarradoresPage() {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const profileId = session.user.profile.id;

  const [narrators, globalInsights, recommendations] = await Promise.all([
    prisma.narrator.findMany({
      where: { profileId },
      include: {
        hypotheses: true,
        insights: { orderBy: { confidence: "desc" }, take: 1 },
        _count: { select: { trends: true, campaigns: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.globalInsight.findMany({
      where: { profileId },
      orderBy: { confidence: "desc" },
      take: 4,
    }),
    prisma.narratorRecommendation.findMany({
      where: { profileId, status: "pending" },
      include: { targetNarrator: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const totalNarratives = narrators.reduce((s, n) => s + n._count.trends, 0);
  const totalWinners = narrators.reduce(
    (s, n) => s + n.hypotheses.filter((h) => h.status === "winner").length,
    0
  );
  const totalTesting = narrators.reduce(
    (s, n) => s + n.hypotheses.filter((h) => h.status === "testing").length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Narradores</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Cada Narrador é uma identidade consistente que conta histórias — e a IA aprende o que funciona para cada um
          </p>
        </div>
        <Button asChild>
          <Link href="/narradores/novo" className="flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Novo Narrador
          </Link>
        </Button>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Narradores ativos", value: narrators.filter((n) => n.status === "active").length, icon: Users },
          { label: "Histórias geradas", value: totalNarratives, icon: Activity },
          { label: "Hipóteses vencedoras", value: totalWinners, icon: CheckCircle2 },
          { label: "Experimentos ativos", value: totalTesting, icon: FlaskConical },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/10 shrink-0">
                <Icon className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="text-xl font-bold text-zinc-100">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global insights */}
      {globalInsights.length > 0 && (
        <div className="rounded-lg border border-l-2 border-zinc-800 border-l-violet-500 bg-zinc-900/50 p-4">
          <p className="text-xs text-violet-400 font-mono mb-3 tracking-wide">DESCOBERTAS GLOBAIS</p>
          <div className="space-y-2">
            {globalInsights.map((gi) => (
              <div key={gi.id} className="flex items-start gap-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-zinc-200 font-medium">{gi.title}</p>
                  <p className="text-xs text-zinc-500">{gi.body}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    Confiança {Math.round(gi.confidence * 100)}% · {gi.sampleSize} narrativas
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entidade recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5" />
            Recomendações da Entidade — aguardando sua decisão
          </p>
          {recommendations.map((rec) => {
            const evidence = parseEvidence(rec.evidence);
            const suggested = parseSuggestedProfile(rec.suggestedProfile ?? null);
            return (
              <div
                key={rec.id}
                className="rounded-xl border border-amber-800/30 bg-amber-950/10 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <p className="text-sm font-semibold text-zinc-100">{rec.title}</p>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{rec.reasoning}</p>

                    {/* Evidence pills */}
                    {evidence && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-1 rounded-md bg-zinc-800/60 px-2 py-1">
                          <BarChart2 className="h-3 w-3 text-zinc-400" />
                          <span className="text-[10px] text-zinc-300">CTR {evidence.avgCtr.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-md bg-zinc-800/60 px-2 py-1">
                          <span className="text-[10px] text-zinc-300">{evidence.sampleSize} narrativas</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-md bg-amber-900/40 px-2 py-1">
                          <span className="text-[10px] text-amber-300">
                            {Math.round(rec.confidence * 100)}% confiança
                          </span>
                        </div>
                        {evidence.loserDimensions.length > 0 && (
                          <div className="flex items-center gap-1 rounded-md bg-red-900/20 px-2 py-1">
                            <span className="text-[10px] text-red-400">
                              {evidence.loserDimensions.length} dimensões saturadas
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested profile */}
                    {suggested && (
                      <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/40 px-3 py-2 mb-3">
                        <p className="text-[10px] text-zinc-500 mb-1">Perfil sugerido</p>
                        <p className="text-xs text-zinc-300">
                          {suggested.sex === "female" ? "Feminino" : "Masculino"} ·{" "}
                          {suggested.ageRange} anos ·{" "}
                          {suggested.hasChildren ? "com filhos" : "sem filhos"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-600 mr-auto">
                    Decisão final sempre sua — a Entidade nunca age sozinha
                  </span>
                  <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                    <Link href="/narradores/novo">
                      Criar Narrador
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {narrators.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center">
          <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">Nenhum Narrador ainda</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
            Crie seu primeiro Narrador respondendo um quiz rápido de 5 perguntas. A IA gera o nome e os experimentos iniciais automaticamente.
          </p>
          <Button asChild>
            <Link href="/narradores/novo">
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro Narrador
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {narrators.map((narrator) => {
            const description = describeNarrator(narrator);
            const winners = narrator.hypotheses.filter((h) => h.status === "winner");
            const testing = narrator.hypotheses.filter((h) => h.status === "testing");
            const topInsight = narrator.insights[0];

            const totalImp = narrator.totalImpressions;
            const ctr = totalImp > 0 ? (narrator.totalClicks / totalImp) * 100 : 0;

            return (
              <Link key={narrator.id} href={`/narradores/${narrator.id}`}>
                <div
                  className={`rounded-xl border p-4 transition-all hover:border-violet-800/50 hover:bg-zinc-900/80 cursor-pointer ${
                    narrator.status === "active"
                      ? "border-zinc-800 bg-zinc-900/40"
                      : "border-zinc-800/50 bg-zinc-900/20 opacity-60"
                  }`}
                >
                  {/* Name + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold text-zinc-100">{narrator.name}</span>
                        {narrator.status === "active" ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                            pausado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-600">histórias</p>
                      <p className="text-lg font-bold text-zinc-200">{narrator._count.trends}</p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "CTR", value: ctr > 0 ? `${ctr.toFixed(1)}%` : "—" },
                      { label: "Conversões", value: narrator.totalConversions > 0 ? narrator.totalConversions : "—" },
                      { label: "Campanhas", value: narrator._count.campaigns },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-zinc-950/50 px-2 py-1.5">
                        <p className="text-[10px] text-zinc-600">{label}</p>
                        <p className="text-sm font-semibold text-zinc-300">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Experiment status */}
                  <div className="flex items-center gap-3 text-xs mb-3">
                    {winners.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {winners.length} vencedor{winners.length > 1 ? "es" : ""}
                      </span>
                    )}
                    {testing.length > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="h-3 w-3" />
                        {testing.length} testando
                      </span>
                    )}
                    {winners.length === 0 && testing.length === 0 && (
                      <span className="text-zinc-600">Sem experimentos ainda</span>
                    )}
                  </div>

                  {/* Top insight */}
                  {topInsight && (
                    <div className="rounded-lg bg-violet-950/20 border border-violet-800/20 px-3 py-2">
                      <p className="text-[10px] text-violet-400 mb-0.5">última descoberta</p>
                      <p className="text-xs text-zinc-300">{topInsight.title}</p>
                    </div>
                  )}

                  {/* Winners preview */}
                  {winners.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {winners.slice(0, 4).map((w) => (
                        <span
                          key={w.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-800/20"
                        >
                          {w.value}
                        </span>
                      ))}
                      {winners.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-zinc-600">
                          +{winners.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
