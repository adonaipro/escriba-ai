"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, Sparkles,
  Plus, Trash2, Download, Clock, X, Package, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditorialMode = "story-produto" | "story-organico" | "desabafo" | "polemica" | "pergunta";
type ContentMode = EditorialMode | "mix-editorial";

interface Product { name: string; url: string }

interface CatalogProduct {
  id: string; name: string; marketplace: string; imageUrl: string;
  commissionPct: number; analysisStatus: string;
  affiliateUrl: string; originalUrl: string;
}

// ─── Product Picker Modal ─────────────────────────────────────────────────────

function ProductPickerModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (selected: CatalogProduct[]) => void;
}) {
  const [products, setProducts]   = useState<CatalogProduct[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [search, setSearch]       = useState("");

  useEffect(() => {
    fetch("/api/produtos")
      .then((r) => r.json() as Promise<{ products?: CatalogProduct[] }>)
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.marketplace.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl flex flex-col max-h-[80vh]">

        <div className="p-5 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100 mb-1">Selecionar do catálogo</h2>
          <p className="text-xs text-zinc-500">Escolha os produtos que quer usar nesta campanha</p>
          {products.length > 0 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading && (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
              <ShoppingBag className="h-8 w-8 mb-2 text-zinc-700" />
              <p className="text-sm">
                {products.length === 0
                  ? "Nenhum produto no catálogo. Importe produtos primeiro."
                  : "Nenhum produto encontrado."}
              </p>
            </div>
          )}
          {!loading && filtered.map((p) => {
            const active = selected.has(p.id);
            const url = p.affiliateUrl || p.originalUrl;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProduct(p.id)}
                className={[
                  "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-pink-600 bg-pink-600/10"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-800/30",
                ].join(" ")}
              >
                <span className={[
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  active ? "border-pink-500 bg-pink-500" : "border-zinc-600",
                ].join(" ")}>
                  {active && (
                    <svg viewBox="0 0 8 8" className="h-2.5 w-2.5 fill-white">
                      <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    </svg>
                  )}
                </span>
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100 truncate">{p.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{url}</p>
                </div>
                {p.commissionPct > 0 && (
                  <span className="text-xs text-emerald-400 shrink-0">{p.commissionPct}%</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-zinc-800 flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1 border-zinc-700">
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={selected.size === 0}
            onClick={() => onConfirm(products.filter((p) => selected.has(p.id)))}
            className="flex-1 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 text-white"
          >
            Adicionar {selected.size > 0 ? `(${selected.size})` : ""} produto{selected.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

const CONTENT_MODE_OPTIONS: { value: ContentMode; label: string }[] = [
  { value: "story-produto",  label: "Story + Produto" },
  { value: "story-organico", label: "Story Orgânico" },
  { value: "desabafo",       label: "Desabafo" },
  { value: "polemica",       label: "Polêmica" },
  { value: "pergunta",       label: "Pergunta" },
  { value: "mix-editorial",  label: "Mix Editorial" },
];

const EDITORIAL_OPTIONS = CONTENT_MODE_OPTIONS.filter((option): option is { value: EditorialMode; label: string } => option.value !== "mix-editorial");

const NETWORKS = [
  { value: "threads",   label: "Threads" },
  { value: "instagram", label: "Instagram" },
  { value: "x",         label: "X (Twitter)" },
  { value: "tiktok",    label: "TikTok" },
  { value: "linkedin",  label: "LinkedIn" },
];

const DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

// ─── Schema (fields not handled by state arrays) ──────────────────────────────

const schema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  marketplace: z.string().min(1),
  language: z.string().min(1),
  approvalMode: z.string().min(1),
  trendsPerDay: z.number().int().min(1).max(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Generation Progress ──────────────────────────────────────────────────────

type GenerationState = {
  jobIds: string[];
  campaignId: string;
  status: string;
  statusLabel: string;
  progress: number;
  error?: string;
  expected: number;
};

function GenerationProgress({ state }: { state: GenerationState }) {
  const router = useRouter();
  const completed = state.status === "completed";
  const failed = state.status === "failed";

  useEffect(() => {
    if (completed && state.campaignId) {
      const t = setTimeout(() => router.push(`/campanhas/${state.campaignId}`), 1200);
      return () => clearTimeout(t);
    }
  }, [completed, state.campaignId, router]);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center gap-6">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
              completed ? "bg-emerald-600/15" : failed ? "bg-red-600/15" : "bg-pink-600/15"
            }`}>
              {completed ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              ) : failed ? (
                <XCircle className="h-8 w-8 text-red-400" />
              ) : (
                <Loader2 className="h-8 w-8 text-pink-400 animate-spin" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {completed ? "Geração concluída" : failed ? "Não foi possível concluir" : "Gerando…"}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {completed
                  ? "Redirecionando para a campanha..."
                  : failed
                    ? "Tente novamente em instantes."
                    : "Gerando…"}
              </p>
            </div>

            {!failed && !completed && (
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-pink-500 animate-pulse" />
              </div>
            )}

            {failed && (
              <Button variant="outline" onClick={() => router.push(`/campanhas/${state.campaignId}`)}>
                Ver campanha
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────



export default function NovaCampanhaPage() {
  const router = useRouter();
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [generation, setGeneration] = useState<GenerationState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Content mode ──────────────────────────────────────────────────
  const [contentMode, setContentMode] = useState<ContentMode>("story-produto");
  const [editorialModes, setEditorialModes] = useState<EditorialMode[]>(EDITORIAL_OPTIONS.map((option) => option.value));
  const needsProduct = contentMode === "story-produto" || (contentMode === "mix-editorial" && editorialModes.includes("story-produto"));

  function toggleEditorialMode(mode: EditorialMode) {
    setEditorialModes((current) => current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]);
  }

  // ── Products list ─────────────────────────────────────────────────
  const [products, setProducts]           = useState<Product[]>([{ name: "", url: "" }]);
  const [importing, setImporting]         = useState<Record<number, boolean>>({});
  const [importErrors, setImportErrors]   = useState<Record<number, string>>({});
  const [productErrors, setProductErrors] = useState<string | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);

  // ── Networks ──────────────────────────────────────────────────────
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(["threads"]);

  // ── Schedule ──────────────────────────────────────────────────────
  const [scheduleDays,  setScheduleDays]  = useState<number[]>([1, 2, 3, 4, 5]);
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(["09:00", "12:00", "20:00"]);
  const [newTime, setNewTime] = useState("12:00");

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Product helpers ───────────────────────────────────────────────

  function addProduct() {
    setProducts(p => [...p, { name: "", url: "" }]);
  }

  function handleCatalogConfirm(selected: CatalogProduct[]) {
    const toAdd = selected.map((p) => ({
      name: p.name,
      url: p.affiliateUrl || p.originalUrl,
    }));
    setProducts((prev) => {
      const isEmpty = prev.length === 1 && !prev[0]?.url && !prev[0]?.name;
      return isEmpty ? toAdd : [...prev, ...toAdd];
    });
    setShowProductPicker(false);
  }

  function removeProduct(idx: number) {
    setProducts(p => p.filter((_, i) => i !== idx));
  }

  function updateProduct(idx: number, field: keyof Product, value: string) {
    setProducts(p => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const importProductName = useCallback(async (idx: number) => {
    const url = products[idx]?.url;
    if (!url) return;
    setImporting(s => ({ ...s, [idx]: true }));
    setImportErrors(s => ({ ...s, [idx]: "" }));
    try {
      const res = await fetch(`/api/scrape-product?url=${encodeURIComponent(url)}`);
      const json = await res.json() as { name?: string; error?: string };
      if (json.name) {
        updateProduct(idx, "name", json.name);
      } else {
        setImportErrors(s => ({ ...s, [idx]: json.error ?? "Não encontrado" }));
      }
    } catch {
      setImportErrors(s => ({ ...s, [idx]: "Erro de conexão" }));
    } finally {
      setImporting(s => ({ ...s, [idx]: false }));
    }
  }, [products]);

  // ── Network helpers ───────────────────────────────────────────────

  function toggleNetwork(value: string) {
    setSelectedNetworks(n =>
      n.includes(value) ? n.filter(x => x !== value) : [...n, value]
    );
  }

  function toggleAllNetworks() {
    setSelectedNetworks(n =>
      n.length === NETWORKS.length ? [] : NETWORKS.map(x => x.value)
    );
  }

  // ── Day helpers ───────────────────────────────────────────────────

  function toggleDay(value: number) {
    setScheduleDays(d =>
      d.includes(value) ? d.filter(x => x !== value) : [...d, value].sort((a, b) => a - b)
    );
  }

  // ── Time helpers ──────────────────────────────────────────────────

  function addTime() {
    if (!newTime || scheduleTimes.includes(newTime)) return;
    setScheduleTimes(t => [...t, newTime].sort());
  }

  function removeTime(t: string) {
    setScheduleTimes(ts => ts.filter(x => x !== t));
  }

  // ── Poll ──────────────────────────────────────────────────────────

  async function pollJobs(jobIds: string[], campaignId: string, expected: number) {
    pollRef.current = setInterval(async () => {
      try {
        const results = await Promise.all(
          jobIds.map(async (id) => {
            const res = await fetch(`/api/generation-jobs/${id}`);
            if (!res.ok) return null;
            const { job } = await res.json() as {
              job: { status: string; statusLabel: string; progress: number; error?: string };
            };
            return job;
          }),
        );
        const jobs = results.filter(Boolean) as Array<{ status: string; progress: number }>;
        const done = jobs.filter((j) => j.status === "completed").length;
        const failed = jobs.filter((j) => j.status === "failed").length;
        const allSettled = jobs.length === jobIds.length && jobs.every((j) => j.status === "completed" || j.status === "failed");

        // User only sees "Gerando…" until the full batch is complete — no partial counts.
        if (allSettled && done === expected) {
          setGeneration({
            jobIds,
            campaignId,
            status: "completed",
            statusLabel: "Gerando…",
            progress: 100,
            expected,
          });
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }
        if (allSettled && done < expected) {
          setGeneration({
            jobIds,
            campaignId,
            status: "failed",
            statusLabel: "Gerando…",
            progress: 0,
            expected,
          });
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }
        setGeneration({
          jobIds,
          campaignId,
          status: "processing",
          statusLabel: "Gerando…",
          progress: Math.min(95, Math.round((done / Math.max(expected, 1)) * 100)),
          expected,
        });
        void failed; // failed attempts are retried server-side; UI stays on Gerando…
      } catch { /* silent */ }
    }, 1500);
  }

  // ── Form ──────────────────────────────────────────────────────────

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      marketplace: "shopee",
      language: "pt-BR",
      approvalMode: "manual",
      trendsPerDay: 2,
    },
  });

  async function onSubmit(data: FormData) {
    // Validate products if needed
    if (needsProduct) {
      const valid = products.every(p => p.url.trim() && p.name.trim());
      if (!valid || products.length === 0) {
        setProductErrors("Todos os produtos precisam ter link e nome preenchidos.");
        return;
      }
    }
    setProductErrors(null);

    if (selectedNetworks.length === 0) {
      setError("Selecione pelo menos uma rede social.");
      return;
    }
    if (contentMode === "mix-editorial" && editorialModes.length === 0) {
      setError("Selecione pelo menos um tipo de conteúdo para o Mix Editorial.");
      return;
    }
    let effectiveScheduleTimes = [...scheduleTimes];
    if (/^\d{2}:\d{2}$/.test(newTime) && !effectiveScheduleTimes.includes(newTime)) {
      effectiveScheduleTimes.push(newTime);
    }
    effectiveScheduleTimes = [...new Set(effectiveScheduleTimes.filter((t) => /^\d{2}:\d{2}$/.test(t)))].sort();
    if (effectiveScheduleTimes.length === 0) {
      setError("Adicione pelo menos um horário de publicação (ex.: 09:00, 12:00, 20:00).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          contentMode,
          editorialModes: contentMode === "mix-editorial" ? editorialModes : [contentMode],
          products: needsProduct ? products : [],
          // backward compat — first product
          productUrl: needsProduct ? (products[0]?.url ?? "") : "https://sem-produto.local",
          productName: needsProduct ? (products[0]?.name ?? "") : "Sem produto",
          targetNetworks: selectedNetworks,
          targetNetwork: selectedNetworks[0] ?? "threads",
          scheduleDays,
          scheduleTimes: effectiveScheduleTimes,
        }),
      });
      const json = await res.json() as {
        campaign?: { id: string };
        jobId?: string;
        jobIds?: string[];
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "Erro ao criar campanha.");
      } else if (json.campaign && (json.jobIds?.length || json.jobId)) {
        const jobIds = json.jobIds?.length ? json.jobIds : json.jobId ? [json.jobId] : [];
        setGeneration({
          jobIds,
          campaignId: json.campaign.id,
          status: "processing",
          statusLabel: "Gerando…",
          progress: 5,
          expected: jobIds.length,
        });
        await pollJobs(jobIds, json.campaign.id, jobIds.length);
      } else {
        router.push(`/campanhas/${json.campaign?.id}`);
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  if (generation) return <GenerationProgress state={generation} />;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {showProductPicker && (
        <ProductPickerModal
          onClose={() => setShowProductPicker(false)}
          onConfirm={handleCatalogConfirm}
        />
      )}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campanhas"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Nova campanha</h1>
          <p className="text-sm text-zinc-400">A Entidade vai criar a primeira narrativa automaticamente</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Tipo de conteúdo ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipo de conteúdo</CardTitle>
            <CardDescription>O formato dos posts que serão gerados nesta campanha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CONTENT_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setContentMode(opt.value)}
                  className={[
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    contentMode === opt.value
                      ? "border-pink-600 bg-pink-600/20 text-pink-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {contentMode === "mix-editorial" && (
              <div className="mt-4 rounded-xl border border-pink-800/40 bg-pink-950/10 p-4 space-y-3">
                <div><p className="text-sm font-medium text-zinc-200">Formatos da rotação</p><p className="text-xs text-zinc-500">O Escriba alternará os formatos nesta ordem.</p></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EDITORIAL_OPTIONS.map((option) => {
                    const active = editorialModes.includes(option.value);
                    return <button key={option.value} type="button" onClick={() => toggleEditorialMode(option.value)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${active ? "border-pink-600 bg-pink-600/15 text-pink-200" : "border-zinc-700 text-zinc-500"}`}>
                      <span className={`h-3.5 w-3.5 rounded border ${active ? "border-pink-500 bg-pink-500" : "border-zinc-600"}`} />{option.label}
                    </button>;
                  })}
                </div>
                <p className="text-xs text-zinc-500">Exemplo com 10 narrativas e todos os formatos: 2 de cada, publicadas alternadamente.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Produto(s) ── */}
        {needsProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Produto(s)</CardTitle>
              <CardDescription>
                Adicione os produtos que serão promovidos. Cada geração usa um produto diferente em rotação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {products.map((p, idx) => (
                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Produto {idx + 1}</span>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(idx)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="https://shopee.com.br/..."
                      value={p.url}
                      onChange={(e) => updateProduct(idx, "url", e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => importProductName(idx)}
                      disabled={!p.url || importing[idx]}
                      className="shrink-0 gap-1.5"
                    >
                      {importing[idx]
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Download className="h-3.5 w-3.5" />}
                      Importar
                    </Button>
                  </div>

                  {importErrors[idx] && (
                    <p className="text-xs text-amber-400">{importErrors[idx]} — preencha o nome manualmente</p>
                  )}

                  <Input
                    placeholder="Nome do produto"
                    value={p.name}
                    onChange={(e) => updateProduct(idx, "name", e.target.value)}
                    className="text-sm"
                  />
                </div>
              ))}

              {productErrors && (
                <p className="text-xs text-red-400">{productErrors}</p>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={addProduct} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar produto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProductPicker(true)}
                  className="gap-1.5"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Selecionar do catálogo
                </Button>
              </div>

              <div className="pt-2 space-y-3">
                <div className="space-y-2">
                  <Label>Nome da campanha</Label>
                  <Input placeholder="Ex: Tênis Runner Pro — Shopee" {...register("name")} />
                  {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Marketplace</Label>
                  <Select defaultValue="shopee" onValueChange={(v) => setValue("marketplace", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shopee">Shopee</SelectItem>
                      <SelectItem value="amazon">Amazon</SelectItem>
                      <SelectItem value="mercadolivre">MercadoLivre</SelectItem>
                      <SelectItem value="hotmart">Hotmart</SelectItem>
                      <SelectItem value="monetizze">Monetizze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Nome da campanha (modos sem produto) ── */}
        {!needsProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campanha</CardTitle>
              <CardDescription>Nome para identificar esta campanha</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Nome da campanha</Label>
                <Input
                  placeholder={
                    contentMode === "polemica" ? "Ex: Polêmicas do dia"
                    : contentMode === "pergunta" ? "Ex: Perguntas virais"
                    : "Ex: Desabafos do dia"
                  }
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Publicação ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publicação</CardTitle>
            <CardDescription>Onde os posts serão publicados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Redes sociais</Label>
                <button
                  type="button"
                  onClick={toggleAllNetworks}
                  className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
                >
                  {selectedNetworks.length === NETWORKS.length ? "Desmarcar tudo" : "Selecionar tudo"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {NETWORKS.map((n) => {
                  const active = selectedNetworks.includes(n.value);
                  return (
                    <button
                      key={n.value}
                      type="button"
                      onClick={() => toggleNetwork(n.value)}
                      className={[
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors text-left",
                        active
                          ? "border-pink-600 bg-pink-600/15 text-pink-300"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600",
                      ].join(" ")}
                    >
                      <span className={[
                        "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                        active ? "border-pink-500 bg-pink-500" : "border-zinc-600",
                      ].join(" ")}>
                        {active && <svg viewBox="0 0 8 8" className="h-2 w-2 fill-white"><path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                      </span>
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Idioma do conteúdo</Label>
              <Select defaultValue="pt-BR" onValueChange={(v) => setValue("language", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Cadência ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadência</CardTitle>
            <CardDescription>Quantas narrativas e quando publicar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Batch size for this generation (max 20); schedules distribute across days */}
            <div className="space-y-2">
              <Label htmlFor="trendsPerDay">Narrativas nesta geração</Label>
              <Input
                id="trendsPerDay"
                type="number"
                min={1}
                max={20}
                className="w-32"
                {...register("trendsPerDay", { valueAsNumber: true })}
              />
              <p className="text-xs text-zinc-500">
                Máximo 20. Os horários só distribuem as narrativas nos próximos slots disponíveis.
              </p>
            </div>

            {/* Days of week */}
            <div className="space-y-2">
              <Label>Dias da semana</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((d) => {
                  const active = scheduleDays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={[
                        "h-9 w-10 rounded-md text-xs font-medium border transition-colors",
                        active
                          ? "border-pink-600 bg-pink-600/20 text-pink-300"
                          : "border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-600",
                      ].join(" ")}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            <div className="space-y-2">
              <Label>Horários de publicação</Label>
              <div className="flex flex-wrap gap-2">
                {scheduleTimes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                  >
                    <Clock className="h-3 w-3 text-zinc-500" />
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTime(t)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-36"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTime} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar horário
                </Button>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de início</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  Data de encerramento
                  <span className="ml-1 text-xs text-zinc-500">(opcional)</span>
                </Label>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>
            </div>

            {/* Approval */}
            <div className="space-y-2">
              <Label>Aprovação das narrativas</Label>
              <Select defaultValue="manual" onValueChange={(v) => setValue("approvalMode", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual — revisar antes de publicar</SelectItem>
                  <SelectItem value="auto">Automático — publicar sem revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href="/campanhas">Cancelar</Link>
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</>
            ) : "Criar campanha"}
          </Button>
        </div>
      </form>
    </div>
  );
}
