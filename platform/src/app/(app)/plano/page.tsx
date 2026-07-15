import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreditCard, Zap, BarChart, BookOpen, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

async function getUsageData(profileId: string) {
  const [campaignCount, trendCount, publicationCount, learningCount] =
    await Promise.all([
      prisma.campaign.count({ where: { profileId } }),
      prisma.trend.count({ where: { campaign: { profileId } } }),
      prisma.publication.count({ where: { campaign: { profileId } } }),
      prisma.learning.count({ where: { profileId } }),
    ]);
  return { campaignCount, trendCount, publicationCount, learningCount };
}

const PLAN_LIMITS = {
  campaigns: 10,
  trends: 500,
  publications: 2000,
};

export default async function PlanoPage() {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const usage = await getUsageData(session.user.profile.id);

  const metrics = [
    {
      label: "Campanhas",
      current: usage.campaignCount,
      limit: PLAN_LIMITS.campaigns,
      icon: Megaphone,
      color: "text-violet-400",
    },
    {
      label: "Trends geradas",
      current: usage.trendCount,
      limit: PLAN_LIMITS.trends,
      icon: Zap,
      color: "text-blue-400",
    },
    {
      label: "Publicações",
      current: usage.publicationCount,
      limit: PLAN_LIMITS.publications,
      icon: BarChart,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Plano & Uso</h1>
        <p className="text-sm text-zinc-400">
          Acompanhe seu consumo e gerencie sua assinatura
        </p>
      </div>

      {/* Current plan */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20">
                <CreditCard className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="font-semibold text-zinc-100">Plano Desenvolvimento</h2>
                <p className="text-xs text-zinc-400">Versão local — sem cobrança</p>
              </div>
            </div>
            <Badge variant="success">Ativo</Badge>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
            Este é um ambiente de desenvolvimento local. Os planos reais (Starter, Growth,
            Scale) estarão disponíveis na versão SaaS em produção.
          </div>
        </CardContent>
      </Card>

      {/* Usage metrics */}
      <div>
        <h2 className="text-base font-semibold text-zinc-200 mb-4">
          Uso do período
        </h2>
        <div className="space-y-4">
          {metrics.map((m) => {
            const pct = Math.min(100, (m.current / m.limit) * 100);
            return (
              <Card key={m.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                      <span className="text-sm text-zinc-300">{m.label}</span>
                    </div>
                    <span className="text-sm font-medium text-zinc-200">
                      {m.current}{" "}
                      <span className="text-zinc-500">/ {m.limit}</span>
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    {pct.toFixed(0)}% utilizado
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Extra stats */}
      <div>
        <h2 className="text-base font-semibold text-zinc-200 mb-4">
          Estatísticas gerais
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-zinc-400">Aprendizados</span>
              </div>
              <p className="text-2xl font-bold text-zinc-100 mt-2">
                {usage.learningCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-zinc-400">Publicações totais</span>
              </div>
              <p className="text-2xl font-bold text-zinc-100 mt-2">
                {usage.publicationCount}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Future plans preview */}
      <div>
        <h2 className="text-base font-semibold text-zinc-200 mb-4">
          Planos disponíveis em produção
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Starter", price: "R$97/mês", campaigns: 3, trends: 100 },
            { name: "Growth", price: "R$197/mês", campaigns: 10, trends: 500, highlight: true },
            { name: "Scale", price: "R$397/mês", campaigns: 30, trends: 2000 },
          ].map((p) => (
            <Card
              key={p.name}
              className={p.highlight ? "border-violet-600" : ""}
            >
              <CardContent className="p-4">
                {p.highlight && (
                  <Badge variant="default" className="text-xs mb-2">Popular</Badge>
                )}
                <h3 className="font-semibold text-zinc-100">{p.name}</h3>
                <p className="text-lg font-bold text-violet-400 mt-1">{p.price}</p>
                <div className="text-xs text-zinc-500 mt-2 space-y-1">
                  <p>{p.campaigns} campanhas</p>
                  <p>{p.trends} trends</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
