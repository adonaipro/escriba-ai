import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Brain, TrendingUp, TrendingDown, CheckCircle2, Clock, Minus, Zap, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

async function getLearnings(profileId: string) {
  return prisma.learning.findMany({
    where: { profileId, state: "active" },
    include: { campaign: { select: { id: true, name: true } } },
    orderBy: { recordedAt: "desc" },
  });
}

const TYPE_LABELS: Record<string, string> = {
  format: "Formato narrativo",
  tone: "Tom",
  timing: "Horario",
  hook: "Gancho",
  cta: "Chamada",
  audience: "Audiencia",
  other: "Observacao",
};

const TYPE_COLORS: Record<string, string> = {
  format: "text-violet-300 bg-violet-600/15 border-violet-800/40",
  tone: "text-blue-300 bg-blue-600/15 border-blue-800/40",
  timing: "text-amber-300 bg-amber-600/15 border-amber-800/40",
  hook: "text-emerald-300 bg-emerald-600/15 border-emerald-800/40",
  cta: "text-pink-300 bg-pink-600/15 border-pink-800/40",
  audience: "text-cyan-300 bg-cyan-600/15 border-cyan-800/40",
  other: "text-zinc-300 bg-zinc-700/30 border-zinc-800",
};

type Learning = Awaited<ReturnType<typeof getLearnings>>[0];

function impactMeta(impact: string) {
  if (impact === "positive")
    return { Icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-600/10", label: "Amplificador", bar: "bg-emerald-500" };
  if (impact === "negative")
    return { Icon: TrendingDown, color: "text-red-400", bg: "bg-red-600/10", label: "Supressor", bar: "bg-red-500" };
  return { Icon: Minus, color: "text-zinc-400", bg: "bg-zinc-700/30", label: "Neutro", bar: "bg-zinc-600" };
}


function LearningCard({ l }: { l: Learning }) {
  const im = impactMeta(l.impact);
  const typeColor = TYPE_COLORS[l.type] ?? TYPE_COLORS.other;
  const typeLabel = TYPE_LABELS[l.type] ?? "Observacao";

  return (
    <Card className="group hover:border-zinc-700 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Impact icon */}
          <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 mt-0.5 ${im.bg}`}>
            <im.Icon className={`h-4 w-4 ${im.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Tags row */}
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor}`}>
                {typeLabel}
              </span>
              <span className="text-xs text-zinc-600">{im.label}</span>
              {l.autoApplied && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 ml-auto">
                  <CheckCircle2 className="h-3 w-3" />
                  Aplicado
                </span>
              )}
            </div>

            {/* Summary */}
            <p className="text-sm text-zinc-100 leading-relaxed">{l.summary}</p>

            {/* Magnitude bar — fixed visual indicator, confidence not in schema */}
            <div className="mt-3 space-y-1">
              <span className="text-xs text-zinc-500">Magnitude do sinal</span>
              <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${l.impact === "positive" ? "w-3/4" : l.impact === "negative" ? "w-1/2" : "w-1/3"} ${im.bar}`} />
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                {format(new Date(l.recordedAt), "dd 'de' MMMM", { locale: ptBR })}
              </span>
              {l.campaign && (
                <span className="text-xs text-zinc-500">
                  <Eye className="h-3 w-3 inline mr-1" />
                  {l.campaign.name}
                </span>
              )}
              {!l.autoApplied && (
                <span className="text-xs text-amber-400">Aguardando revisao</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function groupByType(learnings: Learning[]) {
  const groups: Record<string, Learning[]> = {};
  for (const l of learnings) {
    const key = l.type || "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(l);
  }
  return groups;
}

export default async function AprendizadosPage() {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const learnings = await getLearnings(session.user.profile.id);

  const positive = learnings.filter((l) => l.impact === "positive");
  const negative = learnings.filter((l) => l.impact === "negative");
  const neutral = learnings.filter((l) => l.impact === "neutral");
  const autoApplied = learnings.filter((l) => l.autoApplied);
  const groups = groupByType(learnings);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Padroes Narrativos</h1>
        <p className="text-sm text-zinc-400">
          O que a Entidade descobriu sobre o comportamento da sua audiencia
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Padroes detectados", value: learnings.length, icon: Brain, color: "text-zinc-300", bg: "bg-zinc-700/40" },
          { label: "Amplificadores", value: positive.length, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-600/10" },
          { label: "Supressores", value: negative.length, icon: TrendingDown, color: "text-red-400", bg: "bg-red-600/10" },
          { label: "Ja aplicados", value: autoApplied.length, icon: Zap, color: "text-violet-400", bg: "bg-violet-600/10" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2 shrink-0 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-400">{s.label}</p>
                <p className="text-xl font-bold text-zinc-100">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {learnings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20">
          <Brain className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            A Entidade ainda nao detectou padroes
          </h3>
          <p className="text-sm text-zinc-500 text-center max-w-sm">
            Padroes narrativos emergem automaticamente conforme as campanhas acumulam dados de desempenho.
            As primeiras descobertas aparecem depois de algumas semanas de publicacoes.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top signals */}
          {positive.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Amplificadores — o que gera resultado</h2>
                <span className="text-xs text-zinc-600">{positive.length}</span>
              </div>
              <div className="space-y-3">
                {positive.map((l) => <LearningCard key={l.id} l={l} />)}
              </div>
            </div>
          )}

          {negative.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Supressores — o que inibe resultado</h2>
                <span className="text-xs text-zinc-600">{negative.length}</span>
              </div>
              <div className="space-y-3">
                {negative.map((l) => <LearningCard key={l.id} l={l} />)}
              </div>
            </div>
          )}

          {neutral.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-200">Observacoes — sinais ainda em analise</h2>
                <span className="text-xs text-zinc-600">{neutral.length}</span>
              </div>
              <div className="space-y-3">
                {neutral.map((l) => <LearningCard key={l.id} l={l} />)}
              </div>
            </div>
          )}

          {/* By type breakdown */}
          {Object.keys(groups).length > 1 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h2 className="text-sm font-semibold text-zinc-300 mb-3">Distribuicao por dimensao</h2>
              <div className="space-y-2">
                {Object.entries(groups).map(([type, items]) => {
                  const label = TYPE_LABELS[type] ?? "Outro";
                  const pct = Math.round((items.length / learnings.length) * 100);
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-36 shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500 w-6 text-right">{items.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
