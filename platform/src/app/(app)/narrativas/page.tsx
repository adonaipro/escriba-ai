import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Users,
  Zap,
  MapPin,
  Library,
  Lightbulb,
  Music2,
  Gauge,
  ShoppingBag,
  MessageCircle,
  Layers,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getSelectedAccountId } from "@/lib/account";

// ─── Dimension metadata ───────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  emotion:         { label: "Emoção",             icon: Heart,          color: "text-pink-400",    bg: "bg-pink-600/10" },
  role:            { label: "Papel Social",        icon: Users,          color: "text-blue-400",    bg: "bg-blue-600/10" },
  conflictObject:  { label: "Objeto de Conflito",  icon: Zap,            color: "text-amber-400",   bg: "bg-amber-600/10" },
  sceneMoment:     { label: "Momento de Cena",     icon: MapPin,         color: "text-emerald-400", bg: "bg-emerald-600/10" },
  family:          { label: "Família Narrativa",   icon: Library,        color: "text-pink-400",  bg: "bg-pink-600/10" },
  moralQuestion:   { label: "Pergunta Moral",      icon: Lightbulb,      color: "text-cyan-400",    bg: "bg-cyan-600/10" },
  setting:         { label: "Cenário",             icon: MapPin,         color: "text-teal-400",    bg: "bg-teal-600/10" },
  tone:            { label: "Tom",                 icon: Music2,         color: "text-rose-400",    bg: "bg-rose-600/10" },
  rhythm:          { label: "Ritmo",               icon: Gauge,          color: "text-orange-400",  bg: "bg-orange-600/10" },
  productStrategy: { label: "Estratégia",          icon: ShoppingBag,    color: "text-indigo-400",  bg: "bg-indigo-600/10" },
  questionType:    { label: "Tipo de Pergunta",    icon: MessageCircle,  color: "text-sky-400",     bg: "bg-sky-600/10" },
  openingStyle:    { label: "Abertura",            icon: Zap,            color: "text-yellow-400",  bg: "bg-yellow-600/10" },
  conflictType:    { label: "Tipo de Conflito",    icon: Layers,         color: "text-red-400",     bg: "bg-red-600/10" },
  structureType:   { label: "Estrutura",           icon: Library,        color: "text-fuchsia-400", bg: "bg-fuchsia-600/10" },
  character:       { label: "Personagem",          icon: Users,          color: "text-zinc-400",    bg: "bg-zinc-600/10" },
  object:          { label: "Objeto",              icon: Package,        color: "text-zinc-400",    bg: "bg-zinc-600/10" },
};

// Canonical order for dimension sections
const TYPE_ORDER = [
  "emotion", "role", "conflictObject", "sceneMoment", "family", "moralQuestion",
  "setting", "tone", "rhythm", "productStrategy", "questionType", "openingStyle",
  "conflictType", "structureType", "character", "object",
];

// ─── Classification helpers ───────────────────────────────────────────────────

function winRate(p: { evaluatedCount: number; winCount: number }) {
  return p.evaluatedCount > 0 ? p.winCount / p.evaluatedCount : 0;
}

function classify(p: { evaluatedCount: number; winCount: number }): "amplifier" | "suppressor" | "exploring" {
  if (p.evaluatedCount >= 3 && winRate(p) >= 0.6) return "amplifier";
  if (p.evaluatedCount >= 4 && winRate(p) <= 0.25) return "suppressor";
  return "exploring";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AprendizadosPage() {
  const session = await getSession();
  if (!session?.user.profile) return null;
  const accountId = await getSelectedAccountId(session.user.profile.id);

  const patterns = await prisma.narrativePattern.findMany({
    where: { profileId: session.user.profile.id, socialAccountId: accountId ?? "__no_selected_account__" },
    orderBy: [{ winCount: "desc" }, { usageCount: "desc" }],
  });

  const byType: Record<string, typeof patterns> = {};
  for (const p of patterns) {
    if (!byType[p.type]) byType[p.type] = [];
    byType[p.type].push(p);
  }

  const [evaluatedStories, publicationMetrics] = await Promise.all([
    prisma.trend.count({ where: { campaign: { profileId: session.user.profile.id, socialAccountId: accountId ?? "__no_selected_account__" }, metricsEvaluatedAt: { not: null } } }),
    prisma.publication.aggregate({
      where: { campaign: { profileId: session.user.profile.id, socialAccountId: accountId ?? "__no_selected_account__" }, status: "published" },
      _sum: { impressions: true, likes: true, replies: true, reposts: true, quotes: true, shares: true },
    }),
  ]);
  const totalViews = publicationMetrics._sum.impressions ?? 0;
  const totalEngagements = (publicationMetrics._sum.likes ?? 0) + (publicationMetrics._sum.replies ?? 0) +
    (publicationMetrics._sum.reposts ?? 0) + (publicationMetrics._sum.quotes ?? 0) + (publicationMetrics._sum.shares ?? 0);
  const amplifiers  = patterns.filter((p) => classify(p) === "amplifier");
  const suppressors = patterns.filter((p) => classify(p) === "suppressor");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Aprendizados</h1>
        <p className="text-sm text-zinc-400">
          O que a Entidade descobriu sobre o que funciona — e o que não funciona — para sua audiência
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Histórias avaliadas",   value: evaluatedStories,   icon: Brain,        color: "text-zinc-300",   bg: "bg-zinc-700/40" },
          { label: "Amplificadores",         value: amplifiers.length,  icon: TrendingUp,   color: "text-emerald-400", bg: "bg-emerald-600/10" },
          { label: "Supressores",            value: suppressors.length, icon: TrendingDown, color: "text-red-400",    bg: "bg-red-600/10" },
          { label: "Visualizações coletadas", value: totalViews,        icon: Zap,          color: "text-pink-400", bg: "bg-pink-600/10" },
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

      {/* Empty state */}
      {patterns.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-20">
          <Brain className="h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            A Entidade ainda não tem dados suficientes
          </h3>
          <p className="text-sm text-zinc-500 text-center max-w-sm">
            Os aprendizados crescem automaticamente conforme você gera narrativas no Laboratório
            e acompanha resultados nas Campanhas.
          </p>
        </div>
      )}

      {patterns.length > 0 && (
        <>
          {/* Entidade voice */}
          <div className="rounded-lg border border-l-2 border-pink-800/30 border-l-pink-500 bg-zinc-900/50 p-4">
            <p className="text-xs text-pink-400 font-mono mb-2 tracking-wide">A ENTIDADE</p>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              {evaluatedStories === 0
                ? "Ainda não há histórias com dados suficientes. Estou coletando visualizações e interações do Threads; nenhum elemento será classificado antes de existir evidência real."
                : `Analisei ${evaluatedStories} história${evaluatedStories > 1 ? "s" : ""}, com ${totalViews} visualizações e ${totalEngagements} interações. ${
                    amplifiers.length > 0
                      ? `Encontrei ${amplifiers.length} amplificador${amplifiers.length > 1 ? "es" : ""} — elemento${amplifiers.length > 1 ? "s" : ""} que consistentemente ${amplifiers.length > 1 ? "geram" : "gera"} resultado.`
                      : ""
                  }${
                    suppressors.length > 0
                      ? ` Identifiquei ${suppressors.length} supressor${suppressors.length > 1 ? "es" : ""} — estou evitando ${suppressors.length > 1 ? "eles" : "ele"} nas próximas gerações.`
                      : ""
                  }`
              }
            </p>
          </div>

          {/* ── AMPLIFICADORES ──────────────────────────────────────────────── */}
          {amplifiers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-200">
                  Amplificadores — o que gera resultado
                </h2>
                <span className="text-xs text-zinc-600">{amplifiers.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {amplifiers.map((p) => {
                  const meta = TYPE_META[p.type];
                  const wr = Math.round(winRate(p) * 100);
                  const avgCtr = p.evaluatedCount > 0 ? p.totalCtr / p.evaluatedCount : 0;
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border border-emerald-800/40 bg-emerald-950/10 p-3 flex items-start gap-3"
                    >
                      {meta && (
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                          <meta.icon className={`h-3.5 w-3.5 ${meta.color}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 leading-tight">{p.value}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {meta?.label ?? p.type}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                          <span className="text-emerald-400 font-medium">{wr}% vitórias</span>
                          <span className="text-zinc-500">{p.evaluatedCount} avaliações</span>
                          {avgCtr > 0 && <span className="text-zinc-400">{avgCtr.toFixed(1)}% engajamento</span>}
                        </div>
                      </div>
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SUPRESSORES ─────────────────────────────────────────────────── */}
          {suppressors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <h2 className="text-sm font-semibold text-zinc-200">
                  Supressores — o que não gera resultado
                </h2>
                <span className="text-xs text-zinc-600">{suppressors.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {suppressors.map((p) => {
                  const meta = TYPE_META[p.type];
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border border-red-800/30 bg-red-950/10 p-3 flex items-start gap-3 opacity-80"
                    >
                      {meta && (
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                          <meta.icon className={`h-3.5 w-3.5 ${meta.color}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-300 leading-tight">{p.value}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{meta?.label ?? p.type}</p>
                        <p className="text-[10px] text-red-400/70 mt-1">{p.evaluatedCount} avaliações · {p.winCount} acima da mediana</p>
                      </div>
                      <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── POR DIMENSÃO — tudo que está em descoberta ──────────────────── */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-200">Em descoberta</h2>
              <span className="text-xs text-zinc-600">elementos aguardando dados suficientes</span>
            </div>

            {TYPE_ORDER
              .filter((type) => byType[type]?.some((p) => classify(p) === "exploring"))
              .map((type) => {
                const meta = TYPE_META[type];
                const items = (byType[type] ?? []).filter((p) => classify(p) === "exploring");
                if (items.length === 0 || !meta) return null;
                const maxUsage = Math.max(...items.map((i) => i.usageCount), 1);
                const Icon = meta.icon;

                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-md ${meta.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-zinc-400">{meta.label}</span>
                      <span className="text-xs text-zinc-700">{items.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2 flex items-center justify-between gap-2"
                        >
                          <span className="text-xs text-zinc-300 leading-tight flex-1 min-w-0 truncate">
                            {p.value}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-pink-500/40"
                                style={{ width: `${(p.usageCount / maxUsage) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-zinc-600 font-mono w-16 text-right">
                              {p.evaluatedCount > 0 ? `${p.evaluatedCount} aval.` : "sem dados"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* Unknown types not in TYPE_META */}
            {Object.entries(byType)
              .filter(([type]) => !TYPE_META[type])
              .map(([type, items]) => {
                const exploring = items.filter((p) => classify(p) === "exploring");
                if (exploring.length === 0) return null;
                return (
                  <div key={type}>
                    <span className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">{type}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {exploring.map((p) => (
                        <span key={p.id} className="text-xs px-2 py-1 rounded border border-zinc-800/50 text-zinc-600">
                          {p.value} ({p.usageCount}×)
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
