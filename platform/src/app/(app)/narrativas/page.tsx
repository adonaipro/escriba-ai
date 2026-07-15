import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Library, TrendingUp, Users, MapPin, Package, Heart, Zap, Lightbulb, Music2, Gauge, ShoppingBag, MessageCircle, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; description: string }> = {
  emotion:        { label: "Emoções",             icon: Heart,       color: "text-pink-400",    bg: "bg-pink-600/10",    description: "A emoção dominante que entra primeiro — antes da história" },
  role:           { label: "Papéis Sociais",      icon: Users,       color: "text-blue-400",    bg: "bg-blue-600/10",    description: "Quem aparece na história: minha sogra, meu marido, minha diarista" },
  conflictObject: { label: "Objetos de Conflito", icon: Zap,         color: "text-amber-400",   bg: "bg-amber-600/10",   description: "O objeto cotidiano que inicia o conflito: interfone, Pix, controle remoto" },
  sceneMoment:    { label: "Momentos de Cena",    icon: MapPin,      color: "text-emerald-400", bg: "bg-emerald-600/10", description: "Quando acontece: sábado de manhã, domingo de almoço" },
  family:         { label: "Famílias Narrativas", icon: Library,     color: "text-violet-400",  bg: "bg-violet-600/10",  description: "A arquitetura profunda da história" },
  moralQuestion:  { label: "Perguntas Morais",    icon: Lightbulb,   color: "text-cyan-400",    bg: "bg-cyan-600/10",    description: "A pergunta final que divide opiniões e gera comentários" },
  setting:        { label: "Cenários",            icon: MapPin,      color: "text-teal-400",    bg: "bg-teal-600/10",    description: "O espaço físico onde a cena acontece" },
  character:      { label: "Personagens (legado)", icon: Users,      color: "text-zinc-400",    bg: "bg-zinc-600/10",    description: "Registros de gerações anteriores" },
  object:         { label: "Objetos (legado)",    icon: Package,     color: "text-zinc-400",    bg: "bg-zinc-600/10",    description: "Registros de gerações anteriores" },
  // Narrator experiment dimensions
  tone:           { label: "Tom Narrativo",        icon: Music2,      color: "text-rose-400",    bg: "bg-rose-600/10",    description: "Emocional, objetivo, reflexivo, leve ou intenso — testado por narrador" },
  rhythm:         { label: "Ritmo",                icon: Gauge,       color: "text-orange-400",  bg: "bg-orange-600/10",  description: "Velocidade da narrativa: rápido, médio ou lento" },
  productStrategy:{ label: "Estratégia de Produto",icon: ShoppingBag, color: "text-indigo-400",  bg: "bg-indigo-600/10",  description: "Como o produto entra: Clickbait, Contextual ou Híbrida" },
  questionType:   { label: "Tipo de Pergunta",     icon: MessageCircle, color: "text-sky-400",   bg: "bg-sky-600/10",     description: "A pergunta final que gera engajamento" },
  openingStyle:   { label: "Estilo de Abertura",   icon: Zap,         color: "text-yellow-400",  bg: "bg-yellow-600/10",  description: "Como a história começa: ação direta, contexto primeiro ou emoção primeiro" },
  conflictType:   { label: "Tipo de Conflito",     icon: Layers,      color: "text-red-400",     bg: "bg-red-600/10",     description: "Familiar, financeiro, relacionamento, trabalho ou cotidiano" },
  structureType:  { label: "Estrutura",            icon: Library,     color: "text-fuchsia-400", bg: "bg-fuchsia-600/10", description: "Arquitetura da história: escadaria, flash, reflexão ou decisão" },
};

export default async function NarrativasPage() {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const patterns = await prisma.narrativePattern.findMany({
    where: { profileId: session.user.profile.id },
    orderBy: [{ winCount: "desc" }, { usageCount: "desc" }],
  });

  const byType: Record<string, typeof patterns> = {};
  for (const p of patterns) {
    if (!byType[p.type]) byType[p.type] = [];
    byType[p.type].push(p);
  }

  const totalUsage = patterns.reduce((s, p) => s + p.usageCount, 0);
  const totalTypes = Object.keys(byType).length;
  const topPattern = patterns[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Biblioteca Narrativa</h1>
        <p className="text-sm text-zinc-400">
          O que a Entidade aprendeu a contar — cada elemento nasce do uso real e evolui com os resultados
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Elementos registrados", value: patterns.length },
          { label: "Categorias descobertas", value: totalTypes },
          { label: "Gerações totais", value: totalUsage },
          { label: "Elemento vencedor", value: topPattern?.value ?? "—", small: true },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className={`font-bold text-zinc-100 ${s.small ? "text-sm mt-1.5" : "text-2xl"}`}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI voice */}
      {patterns.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-20 text-center">
          <Library className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">Biblioteca ainda vazia</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            A biblioteca cresce automaticamente conforme a Entidade gera narrativas.
            Crie sua primeira campanha para começar.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-l-2 border-violet-800/30 border-l-violet-500 bg-zinc-900/50 p-4">
            <p className="text-xs text-violet-400 font-mono mb-2 tracking-wide">A ENTIDADE</p>
            <p className="text-sm text-zinc-300 font-mono leading-relaxed">
              {patterns.length === 1
                ? `Registrei meu primeiro elemento: "${patterns[0].value}". A história começa aqui.`
                : (() => {
                    const winners = patterns.filter((p) => p.winCount > 0);
                    const roles = byType["role"] ?? [];
                    const emotions = byType["emotion"] ?? [];
                    return `Aprendi ${patterns.length} elementos em ${totalTypes} dimensões. ${
                      winners.length > 0
                        ? `${winners.length} deles já venceram — estou priorizando.`
                        : "Ainda sem vencedores. Preciso de mais dados de performance."
                    }${roles.length > 0 ? ` Conheço ${roles.length} papel${roles.length > 1 ? "is" : ""} social${roles.length > 1 ? "is" : ""}.` : ""}${emotions.length > 0 ? ` Domino ${emotions.length} emoção${emotions.length > 1 ? "ões" : ""}.` : ""} ${
                      topPattern?.winCount
                        ? `Meu elemento mais eficaz: "${topPattern.value}".`
                        : "Cada história que conto adiciona camadas ao que sei."
                    }`;
                  })()}
            </p>
          </div>

          {/* By type */}
          <div className="space-y-6">
            {Object.entries(TYPE_META)
              .filter(([type]) => byType[type]?.length > 0)
              .map(([type, meta]) => {
                const items = byType[type] ?? [];
                const maxUsage = Math.max(...items.map((i) => i.usageCount), 1);
                const Icon = meta.icon;

                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.bg}`}>
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </div>
                      <h2 className="text-sm font-semibold text-zinc-200">{meta.label}</h2>
                      <span className="text-xs text-zinc-600">{items.length} elementos</span>
                    </div>
                    {meta.description && (
                      <p className="text-xs text-zinc-600 mb-3 ml-9">{meta.description}</p>
                    )}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((p) => {
                        const avgCtr = p.usageCount > 0 ? p.totalCtr / p.usageCount : 0;
                        const winRate = p.usageCount > 0 ? (p.winCount / p.usageCount) * 100 : 0;
                        const isWinner = p.winCount > 0 && winRate > 50;

                        return (
                          <div
                            key={p.id}
                            className={`rounded-lg border p-3 ${
                              isWinner
                                ? "border-emerald-800/40 bg-emerald-950/10"
                                : "border-zinc-800 bg-zinc-900/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-sm font-medium text-zinc-200 leading-tight">
                                {p.value}
                              </span>
                              {isWinner && (
                                <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                              <span>{p.usageCount}× usado</span>
                              {p.winCount > 0 && (
                                <span className="text-emerald-400">{p.winCount} vitória{p.winCount > 1 ? "s" : ""}</span>
                              )}
                              {avgCtr > 0 && (
                                <span className="text-zinc-400">CTR médio {avgCtr.toFixed(2)}%</span>
                              )}
                            </div>
                            <div className="mt-2 h-1 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isWinner ? "bg-emerald-500" : "bg-violet-500/50"
                                }`}
                                style={{ width: `${(p.usageCount / maxUsage) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {/* Other types not in TYPE_META — show as simple tags */}
            {Object.entries(byType)
              .filter(([type]) => !TYPE_META[type])
              .map(([type, items]) => (
                <div key={type}>
                  <h2 className="text-xs font-semibold text-zinc-600 mb-2 uppercase tracking-widest">{type}</h2>
                  <div className="flex flex-wrap gap-2">
                    {items.map((p) => (
                      <span key={p.id} className="text-xs px-2 py-1 rounded border border-zinc-800/50 text-zinc-600">
                        {p.value} ({p.usageCount}×)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
