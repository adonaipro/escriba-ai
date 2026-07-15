"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Package, Star, RefreshCw, FlaskConical,
  Megaphone, ExternalLink, CheckCircle2, AlertCircle,
  Loader2, Brain, Eye, EyeOff, ShieldAlert, Sparkles,
  Users, Calendar, Wrench, MessageCircle, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductData {
  id: string;
  name: string;
  marketplace: string;
  category: string;
  subcategory: string;
  imageUrl: string;
  price: number;
  promotionalPrice: number | null;
  commission: number;
  commissionPct: number;
  rating: number | null;
  soldCount: number;
  shopName: string;
  originalUrl: string;
  affiliateUrl: string;
  description: string;
  dataSource: string;
  analysisStatus: string;
  lastSyncedAt: string | null;
  createdAt: string;
}

interface ProductAnalysisData {
  id: string;
  confirmedFacts: string[];
  aiInferences: string[];
  targetAudience: string[];
  usageOccasions: string[];
  pains: string[];
  benefits: string[];
  scenarios: string[];
  characters: string[];
  conflicts: string[];
  compatibleObjects: string[];
  bridgeTopics: string[];
  restrictions: string[];
  detectedCategory: string;
  categoryLabel: string;
  confidence: string;
  analysisVersion: number;
  updatedAt: string;
}

interface CampaignRef {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  narrativesCount: number;
  trends: Array<{
    id: string;
    hook: string;
    productStrategy: string;
    totalClicks: number;
    totalImpressions: number;
    totalConversions: number;
    totalRevenueBrl: number;
    createdAt: string;
  }>;
}

// ─── Section components ───────────────────────────────────────────────────────

function TagList({ items, color = "zinc" }: { items: string[]; color?: string }) {
  if (!items.length) return <span className="text-xs text-zinc-600">—</span>;
  const colorMap: Record<string, string> = {
    zinc:    "bg-zinc-800 text-zinc-300 border-zinc-700",
    violet:  "bg-violet-950/40 text-violet-300 border-violet-800/40",
    emerald: "bg-emerald-950/40 text-emerald-300 border-emerald-800/40",
    amber:   "bg-amber-950/40 text-amber-300 border-amber-800/40",
    red:     "bg-red-950/40 text-red-300 border-red-800/40",
    blue:    "bg-blue-950/40 text-blue-300 border-blue-800/40",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`rounded-full border px-2.5 py-0.5 text-xs ${colorMap[color] ?? colorMap.zinc}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function ProductDetailClient({
  product,
  analysis,
  campaigns,
}: {
  product: ProductData;
  analysis: ProductAnalysisData | null;
  campaigns: CampaignRef[];
}) {
  const router = useRouter();
  const [showAiInferences, setShowAiInferences] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const displayPrice = product.promotionalPrice ?? product.price;
  const hasPromo = product.promotionalPrice !== null && product.promotionalPrice < product.price;

  const totalClicks = campaigns.reduce((s, c) => s + c.trends.reduce((ts, t) => ts + t.totalClicks, 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.trends.reduce((ts, t) => ts + t.totalRevenueBrl, 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.trends.reduce((ts, t) => ts + t.totalConversions, 0), 0);

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      await fetch(`/api/produtos/${product.id}/analyze`, { method: "POST" });
      router.refresh();
    } finally { setReanalyzing(false); }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch(`/api/produtos/${product.id}/sync`, { method: "POST" });
      router.refresh();
    } finally { setSyncing(false); }
  }

  const confidenceLabel: Record<string, string> = { high: "Alta", medium: "Média", low: "Baixa" };
  const confidenceColor: Record<string, string> = {
    high: "text-emerald-400", medium: "text-amber-400", low: "text-zinc-500",
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/produtos" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-4 w-4" /> Produtos
        </Link>

        {/* Product header */}
        <div className="flex gap-6 mb-8">
          <div className="h-28 w-28 shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-10 w-10 text-zinc-700" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-zinc-100 leading-snug">{product.name}</h1>
                <p className="text-sm text-zinc-500 mt-1">{product.shopName} · {product.marketplace} · {product.category}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing} className="border-zinc-700 text-xs gap-1">
                  {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Sync
                </Button>
                <Button size="sm" variant="outline" onClick={handleReanalyze} disabled={reanalyzing} className="border-zinc-700 text-xs gap-1">
                  {reanalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />} Reanalisar
                </Button>
              </div>
            </div>

            {/* Price + commission */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-baseline gap-2">
                {hasPromo && <span className="text-sm text-zinc-600 line-through">R$ {product.price.toFixed(2)}</span>}
                <span className="text-xl font-bold text-zinc-100">R$ {displayPrice.toFixed(2)}</span>
              </div>
              <span className="rounded-full bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                {product.commissionPct}% comissão · R$ {product.commission.toFixed(2)}
              </span>
              {product.rating && (
                <span className="flex items-center gap-1 text-xs text-yellow-400">
                  <Star className="h-3 w-3 fill-yellow-400" /> {product.rating.toFixed(1)}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => router.push(`/laboratorio?productId=${product.id}`)}>
                <FlaskConical className="h-3.5 w-3.5" /> Testar no Lab
              </Button>
              <Button size="sm" variant="outline" className="border-zinc-700 gap-1.5 text-xs"
                onClick={() => router.push(`/campanhas/nova?productId=${product.id}`)}>
                <Megaphone className="h-3.5 w-3.5" /> Nova Campanha
              </Button>
              <a href={product.affiliateUrl || product.originalUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="border-zinc-700 gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" /> Ver produto
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Metrics bar */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Campanhas", value: campaigns.length },
            { label: "Narrativas", value: campaigns.reduce((s, c) => s + c.narrativesCount, 0) },
            { label: "Conversões", value: totalConversions },
            { label: "Comissão acum.", value: `R$ ${totalRevenue.toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
              <p className="text-lg font-semibold text-zinc-100">{value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          {/* Description */}
          {product.description && (
            <Section icon={Globe} title="Descrição">
              <p className="text-sm text-zinc-400 leading-relaxed">{product.description}</p>
            </Section>
          )}

          {/* Confirmed facts */}
          {analysis && analysis.confirmedFacts.length > 0 && (
            <Section icon={CheckCircle2} title="Fatos Confirmados">
              <div className="space-y-1.5">
                {analysis.confirmedFacts.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{f}</span>
                  </div>
                ))}
              </div>

              {/* AI Inferences toggle */}
              {analysis.aiInferences.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setShowAiInferences(!showAiInferences)}
                    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
                  >
                    {showAiInferences ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showAiInferences ? "Ocultar" : "Ver"} inferências da IA ({analysis.aiInferences.length})
                  </button>
                  {showAiInferences && (
                    <div className="mt-3 rounded-lg border border-amber-800/30 bg-amber-950/10 p-3 space-y-1.5">
                      <p className="text-xs text-amber-400 flex items-center gap-1.5 mb-2">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Estas são inferências da IA — não afirme como fato nas narrativas.
                      </p>
                      {analysis.aiInferences.map((inf, i) => (
                        <div key={i} className="text-xs text-zinc-400">{inf}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Analysis meta */}
              <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-3 text-xs text-zinc-600">
                <span>Confiança: <span className={confidenceColor[analysis.confidence] ?? "text-zinc-400"}>{confidenceLabel[analysis.confidence] ?? analysis.confidence}</span></span>
                <span>·</span>
                <span>v{analysis.analysisVersion}</span>
                <span>·</span>
                <span>{new Date(analysis.updatedAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </Section>
          )}

          {/* Universo Narrativo */}
          {analysis && (
            <div className="rounded-xl border border-violet-800/30 bg-violet-950/10 p-5">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Universo Narrativo</h3>
                <span className="ml-auto text-xs text-zinc-600">{analysis.categoryLabel}</span>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Dores</p>
                  <TagList items={analysis.pains} color="amber" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Benefícios</p>
                  <TagList items={analysis.benefits} color="emerald" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Cenários Naturais</p>
                  <TagList items={analysis.scenarios} color="blue" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Ocasiões de Uso</p>
                  <TagList items={analysis.usageOccasions} color="zinc" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Personagens Possíveis</p>
                  <TagList items={analysis.characters} color="violet" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Objetos Compatíveis</p>
                  <TagList items={analysis.compatibleObjects} color="zinc" />
                </div>
              </div>

              {analysis.bridgeTopics.length > 0 && (
                <div className="mt-5 pt-5 border-t border-violet-800/20">
                  <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Pontes para Narrativa Híbrida</p>
                  <TagList items={analysis.bridgeTopics} color="violet" />
                </div>
              )}
            </div>
          )}

          {/* Recommended strategies */}
          {analysis && (
            <Section icon={Wrench} title="Estratégias Recomendadas">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { strategy: "clickbait", label: "Clickbait", desc: "História independente, produto no post 5. Liberdade total de conflito.", color: "zinc" },
                  { strategy: "contextual", label: "Contextual", desc: `Situações ligadas diretamente ao uso de ${analysis.categoryLabel}.`, color: "violet" },
                  { strategy: "hybrid", label: "Híbrida", desc: "Conflito humano com ponte lógica para o produto via tópicos de transição.", color: "blue" },
                ].map(({ strategy, label, desc, color }) => (
                  <div key={strategy} className={`rounded-lg border p-3 ${
                    color === "violet" ? "border-violet-800/40 bg-violet-950/20" :
                    color === "blue" ? "border-blue-800/40 bg-blue-950/20" :
                    "border-zinc-700 bg-zinc-800/50"
                  }`}>
                    <p className={`text-xs font-semibold mb-1 ${
                      color === "violet" ? "text-violet-300" :
                      color === "blue" ? "text-blue-300" :
                      "text-zinc-300"
                    }`}>{label}</p>
                    <p className="text-xs text-zinc-500">{desc}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Restrictions */}
          {analysis && analysis.restrictions.length > 0 && (
            <Section icon={ShieldAlert} title="Restrições e Afirmações Proibidas">
              <div className="space-y-2">
                {analysis.restrictions.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-zinc-400">{r}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Target audience */}
          {analysis && analysis.targetAudience.length > 0 && (
            <Section icon={Users} title="Público Provável">
              <TagList items={analysis.targetAudience} color="zinc" />
            </Section>
          )}

          {/* Campaigns */}
          {campaigns.length > 0 && (
            <Section icon={Megaphone} title="Campanhas relacionadas">
              <div className="space-y-3">
                {campaigns.map((c) => {
                  const cClicks = c.trends.reduce((s, t) => s + t.totalClicks, 0);
                  const cImpr = c.trends.reduce((s, t) => s + t.totalImpressions, 0);
                  const ctr = cImpr > 0 ? ((cClicks / cImpr) * 100).toFixed(1) : "—";
                  return (
                    <Link key={c.id} href={`/campanhas/${c.id}`} className="flex items-center justify-between rounded-lg border border-zinc-800 p-3 hover:border-zinc-700 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{c.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{c.narrativesCount} narrativas</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-zinc-100">{ctr}% CTR</p>
                        <p className="text-xs text-zinc-500">{c.status}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Section>
          )}

          {/* No analysis state */}
          {!analysis && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
              <Brain className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 mb-3">Universo narrativo ainda não mapeado.</p>
              <Button size="sm" onClick={handleReanalyze} disabled={reanalyzing} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                {reanalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                Analisar agora
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
