"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Loader2,
  Rocket,
  X,
  BarChart3,
  GitCompare,
  Zap,
  User,
  ShoppingBag,
  Plus,
  Package,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductItem {
  id: string;
  name: string;
  marketplace: string;
  category: string;
  imageUrl: string;
  price: number;
  commissionPct: number;
  affiliateUrl: string;
  analysisStatus: string;
}

interface NarratorData {
  id: string;
  name: string;
  sex: string;
  ageRange: string;
  maritalStatus: string;
  hasChildren: boolean;
  livesAlone: boolean;
  status: string;
  totalNarratives: number;
  totalClicks: number;
  totalImpressions: number;
  hypotheses: Array<{ id: string; dimension: string; value: string; status: string; confidence: number }>;
  insights: Array<{ id: string; title: string; body: string; confidence: number; impact: string }>;
}

interface StoryScore {
  humanness: number;
  conflictClarity: number;
  productNaturalness: number;
  discussionPotential: number;
  total: number;
  issues: string[];
}

interface PipelineDebug {
  kind: "story";
  withLink: boolean;
  examplesUsed: number;
  posts: Array<{ position: number; content: string }>;
  score: StoryScore;
  callCount: number;
  totalTokens: number;
  durationMs: number;
  provider: string;
  model: string;
}

interface LabNarrative {
  id: string;
  narratorId: string;
  narratorName: string;
  role: string;
  emotion: string;
  conflictObject: string;
  sceneMoment: string;
  moralQuestion: string;
  family: string;
  setting: string;
  twist: string;
  hook: string;
  narrativeSummary: string;
  productPosition: number;
  productStrategy: string;
  tone: string;
  rhythm: string;
  conflictType: string;
  structureType: string;
  openingStyle: string;
  questionType: string;
  posts: Array<{ position: number; content: string; hasMedia: boolean }>;
  isSimulated?: boolean;
  pipelineDebug?: PipelineDebug;
}

interface EntityExplanation {
  narrator: string;
  hypothesesActive: string[];
  structure: string;
  conflict: string;
  strategy: string;
  tone: string;
  rhythm: string;
  objective: string;
  reasoning: string;
  product?: { name: string; category?: string };
}

interface BenchmarkData {
  total: number;
  avgSimilarity: number;
  diversity: {
    emotions: Record<string, number>;
    rhythms: Record<string, number>;
    strategies: Record<string, number>;
    structures: Record<string, number>;
    openings: Record<string, number>;
    conflicts: Record<string, number>;
  };
}

interface LabResult {
  narratives: LabNarrative[];
  benchmark?: BenchmarkData;
  entityExplanation?: EntityExplanation;
}

interface PromoteModal {
  narrative: LabNarrative;
  campaignName: string;
  marketplace: string;
  targetNetwork: string;
}

// ─── Section tabs ────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "testar",     label: "Testar Narrador",      icon: FlaskConical },
  { id: "benchmark",  label: "Benchmark",             icon: BarChart3 },
  { id: "comparar",   label: "Comparar Narradores",   icon: GitCompare },
  { id: "estrategias",label: "Testar Estratégias",    icon: Zap },
  { id: "voz",        label: "Voz do Narrador",       icon: User },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

// ─── NarrativeCard ───────────────────────────────────────────────────────────

function NarrativeCard({
  narrative,
  strategyLabel,
  onPromote,
}: {
  narrative: LabNarrative;
  strategyLabel?: string;
  onPromote: (n: LabNarrative) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const strategyColor: Record<string, string> = {
    clickbait: "text-orange-400 bg-orange-950/30 border-orange-800/30",
    contextual: "text-violet-400 bg-violet-950/30 border-violet-800/30",
    hybrid:     "text-emerald-400 bg-emerald-950/30 border-emerald-800/30",
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-mono text-zinc-500">{narrative.narratorName}</span>
            {(strategyLabel ?? narrative.productStrategy) && (
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                  strategyColor[narrative.productStrategy] ?? "text-zinc-400 bg-zinc-800 border-zinc-700"
                )}
              >
                {strategyLabel ?? narrative.productStrategy}
              </span>
            )}
            <span className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
              {narrative.conflictType}
            </span>
            <span className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
              {narrative.rhythm}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-100 line-clamp-2">{narrative.hook}</p>
          <p className="text-xs text-zinc-500 mt-1 font-mono">{narrative.narrativeSummary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPromote(narrative)}
            className="text-violet-400 border-violet-800/40 hover:bg-violet-950/30 hover:text-violet-300 text-xs gap-1"
          >
            <Rocket className="h-3 w-3" />
            Promover
          </Button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
          {/* Posts */}
          <div className="space-y-2">
            {narrative.posts.map((post) => (
              <div key={post.position} className="rounded-lg bg-zinc-800/50 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono text-zinc-500">
                    Post {post.position}/{narrative.posts.length}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
              </div>
            ))}
          </div>
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-zinc-800/60 pt-3">
            {[
              ["Papel", narrative.role],
              ["Emoção", narrative.emotion],
              ["Objeto", narrative.conflictObject],
              ["Tom", narrative.tone],
              ["Abertura", narrative.openingStyle],
              ["Pergunta", narrative.questionType],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2 text-[11px]">
                <span className="text-zinc-600 shrink-0">{k}</span>
                <span className="text-zinc-400 font-mono">{v}</span>
              </div>
            ))}
          </div>
          {/* Pipeline debug panel — only when pipeline was used */}
          {narrative.pipelineDebug && (
            <PipelineDebugPanel debug={narrative.pipelineDebug} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── PipelineDebugPanel ──────────────────────────────────────────────────────

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color =
    pct >= 80 ? "bg-emerald-500" :
    pct >= 50 ? "bg-yellow-500" :
    "bg-red-500";
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-zinc-500 w-40 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
        <div className={cn("h-1.5 rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-zinc-400 font-mono w-12 text-right">{value}/{max}</span>
    </div>
  );
}

function PipelineDebugPanel({ debug }: { debug: PipelineDebug }) {
  const [open, setOpen] = useState(false);
  const totalSec = (debug.durationMs / 1000).toFixed(1);

  return (
    <div className="mt-3 rounded-lg border border-zinc-700/60 bg-zinc-900">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <span>
          Story Engine · score {debug.score.total}/100 · {debug.examplesUsed} exemplos RAG · {debug.totalTokens.toLocaleString()} tokens · {totalSec}s · {debug.model}
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-3 pb-3 space-y-4 pt-3">

          {/* RAG info */}
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Geração</p>
            <div className="rounded bg-zinc-800/50 p-2 space-y-1 text-[11px]">
              <p>
                <span className="text-zinc-600">arquitetura:</span>{" "}
                <span className="text-zinc-400">RAG — exemplos estilo concorrente → prompt único → LLM</span>
              </p>
              <p>
                <span className="text-zinc-600">exemplos usados:</span>{" "}
                <span className="text-zinc-300">{debug.examplesUsed}</span>
              </p>
              <p>
                <span className="text-zinc-600">link:</span>{" "}
                <span className={debug.withLink ? "text-emerald-400" : "text-zinc-500"}>
                  {debug.withLink ? "incluído" : "sem link"}
                </span>
              </p>
            </div>
          </div>

          {/* Score breakdown */}
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Score</p>
            <div className="space-y-1.5">
              <ScoreBar label="Humanidade"          value={debug.score.humanness} />
              <ScoreBar label="Clareza do conflito" value={debug.score.conflictClarity} />
              <ScoreBar label="Produto natural"     value={debug.score.productNaturalness} />
              <ScoreBar label="Potencial de debate" value={debug.score.discussionPotential} />
              <ScoreBar label="Total"               value={debug.score.total} max={100} />
            </div>
            {debug.score.issues.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {debug.score.issues.map((issue, i) => (
                  <p key={i} className="text-[10px] text-yellow-500/80 flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    {issue}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Performance */}
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Performance</p>
            <div className="rounded bg-zinc-800/50 p-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <p><span className="text-zinc-600">modelo:</span> <span className="text-zinc-400">{debug.model}</span></p>
              <p><span className="text-zinc-600">provider:</span> <span className="text-zinc-400">{debug.provider}</span></p>
              <p><span className="text-zinc-600">tokens:</span> <span className="text-zinc-400">{debug.totalTokens.toLocaleString()}</span></p>
              <p><span className="text-zinc-600">tempo:</span> <span className="text-zinc-400">{totalSec}s</span></p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── DiversityBar ─────────────────────────────────────────────────────────────

function DiversityBar({ label, data }: { label: string; data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <p className="text-xs font-medium text-zinc-400 mb-2">{label}</p>
      <div className="space-y-1">
        {sorted.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 w-28 shrink-0 font-mono truncate">{k}</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
              <div
                className="h-1.5 rounded-full bg-violet-600"
                style={{ width: `${total > 0 ? (v / total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 w-6 text-right">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EntityBox ───────────────────────────────────────────────────────────────

function EntityBox({ explanation }: { explanation: EntityExplanation }) {
  return (
    <div className="rounded-xl border border-violet-800/30 bg-violet-950/10 p-4 mt-4">
      <p className="text-[10px] font-mono text-violet-400 uppercase tracking-widest mb-2">
        A Entidade · Explicação
      </p>
      <p className="text-xs text-zinc-300 leading-relaxed mb-3">{explanation.reasoning}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
        <div>
          <span className="text-zinc-600">Narrador </span>
          <span className="text-zinc-400 font-mono">{explanation.narrator}</span>
        </div>
        <div>
          <span className="text-zinc-600">Estrutura </span>
          <span className="text-zinc-400 font-mono">{explanation.structure}</span>
        </div>
        <div>
          <span className="text-zinc-600">Conflito </span>
          <span className="text-zinc-400 font-mono">{explanation.conflict}</span>
        </div>
        <div>
          <span className="text-zinc-600">Tom </span>
          <span className="text-zinc-400 font-mono">{explanation.tone}</span>
        </div>
        <div>
          <span className="text-zinc-600">Estratégia </span>
          <span className="text-zinc-400 font-mono">{explanation.strategy}</span>
        </div>
        <div>
          <span className="text-zinc-600">Ritmo </span>
          <span className="text-zinc-400 font-mono">{explanation.rhythm}</span>
        </div>
      </div>
      {explanation.hypothesesActive.length > 0 && (
        <div className="mt-3 border-t border-violet-800/20 pt-2">
          <p className="text-[10px] text-zinc-600 mb-1">Hipóteses aplicadas</p>
          <div className="flex flex-wrap gap-1">
            {explanation.hypothesesActive.map((h) => (
              <span key={h} className="text-[10px] font-mono text-violet-300 bg-violet-950/30 border border-violet-800/30 px-1.5 py-0.5 rounded">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PromoteModal ─────────────────────────────────────────────────────────────

function PromoteModal({
  data,
  onCancel,
  onSubmit,
  promoting,
}: {
  data: PromoteModal;
  onCancel: () => void;
  onSubmit: (d: PromoteModal) => void;
  promoting: boolean;
}) {
  const [form, setForm] = useState(data);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Promover para Campanha</h2>
            <p className="text-xs text-zinc-500 mt-0.5">A narrativa será salva como narrativa aprovada na nova campanha.</p>
          </div>
          <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">Nome da campanha</label>
            <input
              type="text"
              value={form.campaignName}
              onChange={(e) => setForm((f) => ({ ...f, campaignName: e.target.value }))}
              placeholder="Ex: Shopee — Novembro 2026"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Marketplace</label>
              <select
                value={form.marketplace}
                onChange={(e) => setForm((f) => ({ ...f, marketplace: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="shopee">Shopee</option>
                <option value="amazon">Amazon</option>
                <option value="hotmart">Hotmart</option>
                <option value="kiwify">Kiwify</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Rede social</label>
              <select
                value={form.targetNetwork}
                onChange={(e) => setForm((f) => ({ ...f, targetNetwork: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="threads">Threads</option>
                <option value="twitter">Twitter/X</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3 mt-1">
            <p className="text-[10px] font-mono text-zinc-500 mb-1">Narrativa selecionada</p>
            <p className="text-xs text-zinc-300 line-clamp-1">{data.narrative.hook}</p>
            <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{data.narrative.narrativeSummary}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={promoting}>
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => onSubmit(form)}
            disabled={!form.campaignName.trim() || promoting}
          >
            {promoting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
            {promoting ? "Criando…" : "Criar campanha"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── ProductSelector ─────────────────────────────────────────────────────────

type ProductMode = "select" | "import" | "temp";

function ProductSelector({
  products,
  selectedId,
  tempName,
  tempUrl,
  mode,
  onSelectId,
  onSetTempName,
  onSetTempUrl,
  onSetMode,
}: {
  products: ProductItem[];
  selectedId: string;
  tempName: string;
  tempUrl: string;
  mode: ProductMode;
  onSelectId: (id: string) => void;
  onSetTempName: (v: string) => void;
  onSetTempUrl: (v: string) => void;
  onSetMode: (m: ProductMode) => void;
}) {
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const selected = products.find((p) => p.id === selectedId);

  async function handleImport() {
    if (!importUrl.startsWith("http")) { setImportError("Link inválido"); return; }
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await res.json() as { error?: string; productId?: string };
      if (!res.ok || !data.productId) { setImportError(data.error ?? "Erro ao importar"); return; }
      // Reload page to pick up new product
      window.location.reload();
    } catch { setImportError("Erro de rede"); } finally { setImporting(false); }
  }

  return (
    <div className="space-y-2">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-zinc-800/60 border border-zinc-700">
        {([
          ["select", products.length > 0 ? "Selecionar produto" : "Sem produtos", ShoppingBag],
          ["import", "Importar por link", Plus],
          ["temp", "Teste temporário", FlaskConical],
        ] as [ProductMode, string, React.ElementType][]).map(([m, label, Icon]) => (
          <button
            key={m}
            onClick={() => onSetMode(m)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              mode === m
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Select existing product */}
      {mode === "select" && (
        products.length === 0 ? (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-center">
            <Package className="h-6 w-6 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500 mb-2">Nenhum produto no catálogo ainda.</p>
            <button onClick={() => onSetMode("import")} className="text-xs text-violet-400 hover:underline">
              Importar um produto
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <select
              value={selectedId}
              onChange={(e) => onSelectId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">— Selecione um produto —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.category} · {p.commissionPct}%
                </option>
              ))}
            </select>
            {selected && (
              <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2">
                <Package className="h-4 w-4 text-zinc-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-200 truncate">{selected.name}</p>
                  <p className="text-[10px] text-zinc-500">{selected.category} · R$ {selected.price.toFixed(2)} · {selected.commissionPct}% comissão</p>
                </div>
                {selected.analysisStatus === "ready" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-label="Análise pronta" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-label="Análise pendente" />
                )}
                <Link href={`/produtos/${selected.id}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-400 shrink-0" />
                </Link>
              </div>
            )}
          </div>
        )
      )}

      {/* Import new product */}
      {mode === "import" && (
        <div className="space-y-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => { setImportUrl(e.target.value); setImportError(null); }}
            placeholder="https://shopee.com.br/produto-i.123.456"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          {importError && <p className="text-xs text-red-400">{importError}</p>}
          <Button
            onClick={handleImport}
            disabled={importing || !importUrl}
            size="sm"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {importing ? "Importando…" : "Importar e usar"}
          </Button>
        </div>
      )}

      {/* Temporary free-text */}
      {mode === "temp" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">Produto (temporário)</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => onSetTempName(e.target.value)}
              placeholder="Nome do produto"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-1">URL</label>
            <input
              type="url"
              value={tempUrl}
              onChange={(e) => onSetTempUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <p className="col-span-2 text-[10px] text-zinc-600">
            Modo temporário: usa detecção de categoria por palavras-chave, sem análise profunda do produto.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main LabClient component ─────────────────────────────────────────────────

export function LabClient({ narrators, products }: { narrators: NarratorData[]; products: ProductItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resolve initial product from URL param (?productId=xxx from /produtos page)
  const urlProductId = searchParams.get("productId");
  const hasUrlProduct = urlProductId ? products.some((p) => p.id === urlProductId) : false;
  const initialProductId = hasUrlProduct ? urlProductId! : (products[0]?.id ?? "");
  const initialMode: ProductMode = products.length > 0 ? "select" : "temp";

  const [section, setSection] = useState<SectionId>("testar");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LabResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Product selector state
  const [productMode, setProductMode] = useState<ProductMode>(initialMode);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [tempProductName, setTempProductName] = useState("");
  const [tempProductUrl, setTempProductUrl] = useState("");

  // For backward compat with promote flow
  const productName = productMode === "select"
    ? (products.find((p) => p.id === selectedProductId)?.name ?? "")
    : tempProductName;
  const productUrl = productMode === "select"
    ? (products.find((p) => p.id === selectedProductId)?.affiliateUrl ?? "")
    : tempProductUrl;

  // Per-section narrator selects
  const [narratorId, setNarratorId] = useState(narrators[0]?.id ?? "");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [benchmarkCount, setBenchmarkCount] = useState(10);

  // Promote modal
  const [promoteData, setPromoteData] = useState<PromoteModal | null>(null);
  const [promoting, setPromoting] = useState(false);

  const selectedNarrator = narrators.find((n) => n.id === narratorId) ?? null;

  function toggleCompareId(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  }

  async function generate(mode: string) {
    const hasProduct = productMode === "select"
      ? !!selectedProductId
      : (tempProductName.trim() && tempProductUrl.trim());

    if (!hasProduct) {
      setError(productMode === "select"
        ? "Selecione um produto do catálogo ou mude para modo temporário."
        : "Preencha o nome e URL do produto antes de gerar."
      );
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const body: Record<string, unknown> = productMode === "select"
        ? { mode, productId: selectedProductId }
        : { mode, productName: tempProductName, productUrl: tempProductUrl };

      if (mode === "single")      { body.narratorId = narratorId; body.count = count; }
      if (mode === "benchmark")   { body.narratorId = narratorId; body.count = benchmarkCount; }
      if (mode === "compare")     { body.narratorIds = compareIds; }
      if (mode === "strategy")    { body.narratorId = narratorId; }

      const res = await fetch("/api/laboratorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? "Erro ao gerar");
      }
      const data = await res.json() as LabResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  function openPromote(narrative: LabNarrative) {
    setPromoteData({
      narrative,
      campaignName: `${productName} — Lab`,
      marketplace: "shopee",
      targetNetwork: "threads",
    });
  }

  async function submitPromote(data: PromoteModal) {
    setPromoting(true);
    try {
      const res = await fetch("/api/laboratorio/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: data.campaignName,
          marketplace: data.marketplace,
          targetNetwork: data.targetNetwork,
          productName,
          productUrl,
          narratorId: data.narrative.narratorId || undefined,
          hook: data.narrative.hook,
          narrativeSummary: data.narrative.narrativeSummary,
          productStrategy: data.narrative.productStrategy,
          tone: data.narrative.tone,
          rhythm: data.narrative.rhythm,
          structureType: data.narrative.structureType,
          openingStyle: data.narrative.openingStyle,
          conflictType: data.narrative.conflictType,
          questionType: data.narrative.questionType,
          posts: data.narrative.posts,
        }),
      });
      if (!res.ok) throw new Error("Falha ao promover");
      const { campaignId } = await res.json() as { campaignId: string };
      setPromoteData(null);
      router.push(`/campanhas/${campaignId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setPromoting(false);
    }
  }

  // ── Product selector (shared across all sections) ────────────────────────
  const ProductSelectorComponent = (
    <ProductSelector
      products={products}
      selectedId={selectedProductId}
      tempName={tempProductName}
      tempUrl={tempProductUrl}
      mode={productMode}
      onSelectId={(id) => { setSelectedProductId(id); setResult(null); }}
      onSetTempName={(v) => { setTempProductName(v); setResult(null); }}
      onSetTempUrl={(v) => { setTempProductUrl(v); setResult(null); }}
      onSetMode={(m) => { setProductMode(m); setResult(null); }}
    />
  );

  // ── Narrator select ─────────────────────────────────────────────────────
  const NarratorSelect = (
    <div>
      <label className="text-xs font-medium text-zinc-400 block mb-1">Narrador</label>
      <select
        value={narratorId}
        onChange={(e) => { setNarratorId(e.target.value); setResult(null); }}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        {narrators.length === 0 && <option value="">Nenhum narrador cadastrado</option>}
        {narrators.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name} · {n.ageRange} · {n.sex === "female" ? "F" : "M"}
          </option>
        ))}
      </select>
    </div>
  );

  // ── Sandbox notice ──────────────────────────────────────────────────────
  const SandboxNotice = (
    <div className="flex items-center gap-2 rounded-lg border border-amber-800/30 bg-amber-950/10 px-3 py-2 text-xs text-amber-400">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
      Nada gerado aqui afeta campanhas, métricas ou a base de conhecimento da IA.
    </div>
  );

  return (
    <>
      {promoteData && (
        <PromoteModal
          data={promoteData}
          onCancel={() => setPromoteData(null)}
          onSubmit={submitPromote}
          promoting={promoting}
        />
      )}

      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="h-5 w-5 text-violet-400" />
              <h1 className="text-lg font-semibold text-zinc-100">Laboratório Narrativo</h1>
            </div>
            <p className="text-sm text-zinc-500">
              Ambiente sandbox para testar, comparar e explorar narrativas sem afetar o sistema de aprendizado.
            </p>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 mb-6 border-b border-zinc-800 pb-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => { setSection(s.id); setResult(null); setError(null); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                    section === s.id
                      ? "border-violet-500 text-violet-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* ── SECTION: Testar Narrador ─────────────────────────────── */}
          {section === "testar" && (
            <div className="space-y-4">
              {SandboxNotice}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
                {NarratorSelect}
                {ProductSelectorComponent}
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1">Quantidade</label>
                  <div className="flex gap-2">
                    {[1, 3, 5, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setCount(n)}
                        className={cn(
                          "w-10 h-8 rounded-lg text-sm font-medium border transition-colors",
                          count === n
                            ? "border-violet-600 bg-violet-600/20 text-violet-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => void generate("single")}
                  disabled={loading || narrators.length === 0}
                  className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                  {loading ? "Gerando…" : `Gerar ${count} narrativa${count > 1 ? "s" : ""}`}
                </Button>
              </div>

              {error && <p className="text-sm text-red-400 px-1">{error}</p>}

              {result && (
                <div className="space-y-3">
                  {result.narratives.map((n) => (
                    <NarrativeCard key={n.id} narrative={n} onPromote={openPromote} />
                  ))}
                  {result.entityExplanation && <EntityBox explanation={result.entityExplanation} />}
                </div>
              )}
            </div>
          )}

          {/* ── SECTION: Benchmark ──────────────────────────────────── */}
          {section === "benchmark" && (
            <div className="space-y-4">
              {SandboxNotice}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
                {NarratorSelect}
                {ProductSelectorComponent}
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1">Quantidade</label>
                  <div className="flex gap-2">
                    {[10, 20, 50].map((n) => (
                      <button
                        key={n}
                        onClick={() => setBenchmarkCount(n)}
                        className={cn(
                          "w-12 h-8 rounded-lg text-sm font-medium border transition-colors",
                          benchmarkCount === n
                            ? "border-violet-600 bg-violet-600/20 text-violet-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => void generate("benchmark")}
                  disabled={loading || narrators.length === 0}
                  className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                  {loading ? "Analisando…" : `Analisar diversidade (${benchmarkCount} narrativas)`}
                </Button>
              </div>

              {error && <p className="text-sm text-red-400 px-1">{error}</p>}

              {result?.benchmark && (
                <div className="space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                      <p className="text-2xl font-bold text-zinc-100">{result.benchmark.total}</p>
                      <p className="text-xs text-zinc-500 mt-1">Narrativas</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                      <p className={cn("text-2xl font-bold", result.benchmark.avgSimilarity > 40 ? "text-amber-400" : "text-emerald-400")}>
                        {result.benchmark.avgSimilarity}%
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Similaridade média</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                      <p className="text-2xl font-bold text-violet-400">
                        {Object.keys(result.benchmark.diversity.emotions).length}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Emoções distintas</p>
                    </div>
                  </div>
                  {/* Diversity charts */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 grid grid-cols-2 gap-6">
                    <DiversityBar label="Emoções" data={result.benchmark.diversity.emotions} />
                    <DiversityBar label="Estratégias" data={result.benchmark.diversity.strategies} />
                    <DiversityBar label="Ritmos" data={result.benchmark.diversity.rhythms} />
                    <DiversityBar label="Conflitos" data={result.benchmark.diversity.conflicts} />
                    <DiversityBar label="Estruturas" data={result.benchmark.diversity.structures} />
                    <DiversityBar label="Aberturas" data={result.benchmark.diversity.openings} />
                  </div>
                  {/* Narrative list */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-500 px-1">Narrativas geradas ({result.narratives.length})</p>
                    {result.narratives.map((n) => (
                      <NarrativeCard key={n.id} narrative={n} onPromote={openPromote} />
                    ))}
                  </div>
                  {result.entityExplanation && <EntityBox explanation={result.entityExplanation} />}
                </div>
              )}
            </div>
          )}

          {/* ── SECTION: Comparar Narradores ────────────────────────── */}
          {section === "comparar" && (
            <div className="space-y-4">
              {SandboxNotice}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
                {ProductSelectorComponent}
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1">
                    Selecionar narradores (até 5)
                  </label>
                  <div className="space-y-1.5">
                    {narrators.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => toggleCompareId(n.id)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                          compareIds.includes(n.id)
                            ? "border-violet-600/50 bg-violet-950/20 text-zinc-100"
                            : "border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:border-zinc-700"
                        )}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                            compareIds.includes(n.id) ? "border-violet-500 bg-violet-600" : "border-zinc-600"
                          )}
                        >
                          {compareIds.includes(n.id) && (
                            <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium">{n.name}</span>
                        <span className="text-xs text-zinc-500">
                          {n.ageRange} · {n.sex === "female" ? "F" : "M"} ·{" "}
                          {n.hypotheses.filter((h) => h.status === "winner").length} hipóteses vencedoras
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => void generate("compare")}
                  disabled={loading || compareIds.length < 2}
                  className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
                  {loading ? "Gerando…" : `Comparar ${compareIds.length} narrador${compareIds.length !== 1 ? "es" : ""}`}
                </Button>
              </div>

              {error && <p className="text-sm text-red-400 px-1">{error}</p>}

              {result && (
                <div className="space-y-3">
                  {result.narratives.map((n) => (
                    <div key={n.id}>
                      <p className="text-xs font-semibold text-violet-400 mb-1.5 px-1">
                        {n.narratorName}
                      </p>
                      <NarrativeCard narrative={n} onPromote={openPromote} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SECTION: Testar Estratégias ─────────────────────────── */}
          {section === "estrategias" && (
            <div className="space-y-4">
              {SandboxNotice}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
                {NarratorSelect}
                {ProductSelectorComponent}
                <Button
                  onClick={() => void generate("strategy")}
                  disabled={loading || narrators.length === 0}
                  className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {loading ? "Gerando…" : "Gerar as 3 estratégias"}
                </Button>
              </div>

              {error && <p className="text-sm text-red-400 px-1">{error}</p>}

              {result && (
                <div className="space-y-3">
                  {result.narratives.map((n, idx) => {
                    const labels = ["Clickbait", "Contextual", "Hybrid"];
                    return (
                      <div key={n.id}>
                        <p className="text-xs font-semibold text-zinc-400 mb-1.5 px-1 uppercase tracking-wide">
                          {labels[idx] ?? n.productStrategy}
                        </p>
                        <NarrativeCard
                          narrative={n}
                          strategyLabel={labels[idx]}
                          onPromote={openPromote}
                        />
                      </div>
                    );
                  })}
                  {result.entityExplanation && <EntityBox explanation={result.entityExplanation} />}
                </div>
              )}
            </div>
          )}

          {/* ── SECTION: Voz do Narrador ────────────────────────────── */}
          {section === "voz" && (
            <div className="space-y-4">
              {NarratorSelect}

              {selectedNarrator ? (
                <div className="space-y-4">
                  {/* Identity card */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-base font-semibold text-zinc-100">{selectedNarrator.name}</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {selectedNarrator.ageRange} ·{" "}
                          {selectedNarrator.sex === "female" ? "Feminino" : "Masculino"} ·{" "}
                          {selectedNarrator.maritalStatus} ·{" "}
                          {selectedNarrator.hasChildren ? "com filhos" : "sem filhos"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                          selectedNarrator.status === "active"
                            ? "text-emerald-400 bg-emerald-950/30 border-emerald-800/30"
                            : "text-zinc-500 bg-zinc-800 border-zinc-700"
                        )}
                      >
                        {selectedNarrator.status === "active" ? "ativo" : "pausado"}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="rounded-lg bg-zinc-800/60 p-3 text-center">
                        <p className="text-lg font-bold text-zinc-100">{selectedNarrator.totalNarratives}</p>
                        <p className="text-[10px] text-zinc-500">narrativas</p>
                      </div>
                      <div className="rounded-lg bg-zinc-800/60 p-3 text-center">
                        <p className="text-lg font-bold text-zinc-100">
                          {selectedNarrator.totalImpressions > 0
                            ? `${Math.round((selectedNarrator.totalClicks / selectedNarrator.totalImpressions) * 100)}%`
                            : "—"}
                        </p>
                        <p className="text-[10px] text-zinc-500">CTR médio</p>
                      </div>
                      <div className="rounded-lg bg-zinc-800/60 p-3 text-center">
                        <p className="text-lg font-bold text-violet-400">
                          {selectedNarrator.hypotheses.filter((h) => h.status === "winner").length}
                        </p>
                        <p className="text-[10px] text-zinc-500">hipóteses ganhas</p>
                      </div>
                    </div>

                    {/* Insights */}
                    {selectedNarrator.insights.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] font-mono text-violet-400 uppercase tracking-widest mb-2">
                          A Entidade observou
                        </p>
                        <div className="space-y-2">
                          {selectedNarrator.insights.map((ins) => (
                            <div key={ins.id} className="flex items-start gap-2.5">
                              <div className="h-1 w-1 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                              <div className="min-w-0">
                                <p className="text-xs text-zinc-300">{ins.body}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="h-1 bg-zinc-700 rounded-full flex-1">
                                    <div
                                      className="h-1 rounded-full bg-violet-600"
                                      style={{ width: `${ins.confidence}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                                    {ins.confidence}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Winning hypotheses */}
                    {selectedNarrator.hypotheses.filter((h) => h.status === "winner").length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-2">
                          Hipóteses confirmadas
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedNarrator.hypotheses
                            .filter((h) => h.status === "winner")
                            .map((h) => (
                              <span
                                key={h.id}
                                className="text-[10px] font-mono text-emerald-300 bg-emerald-950/30 border border-emerald-800/30 px-2 py-0.5 rounded"
                              >
                                {h.dimension}: {h.value}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Testing hypotheses */}
                    {selectedNarrator.hypotheses.filter((h) => h.status === "testing").length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-2">
                          Em teste
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedNarrator.hypotheses
                            .filter((h) => h.status === "testing")
                            .map((h) => (
                              <span
                                key={h.id}
                                className="text-[10px] font-mono text-amber-300 bg-amber-950/20 border border-amber-800/20 px-2 py-0.5 rounded"
                              >
                                {h.dimension}: {h.value}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {selectedNarrator.insights.length === 0 && selectedNarrator.hypotheses.length === 0 && (
                      <p className="text-xs text-zinc-600 text-center py-4">
                        A Entidade ainda não observou padrões suficientes para {selectedNarrator.name}.
                        Gere narrativas reais em campanhas para alimentar o aprendizado.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-600 text-center py-8">Nenhum narrador disponível.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
