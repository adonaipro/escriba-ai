"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package, Plus, Search, FlaskConical,
  Megaphone, BarChart3, ChevronRight, Loader2, Star,
  ShoppingBag, CheckCircle2, AlertCircle, Clock, List, Link as LinkIcon, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductMetrics {
  campaigns: number; narratives: number; clicks: number;
  impressions: number; conversions: number; revenueBrl: number; ctr: number;
}

interface ProductItem {
  id: string; name: string; marketplace: string; category: string;
  imageUrl: string; price: number; promotionalPrice: number | null;
  commission: number; commissionPct: number; rating: number | null;
  analysisStatus: string; lastSyncedAt: string | null; confidence: string | null;
  metrics: ProductMetrics;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AnalysisStatus({ status }: { status: string }) {
  if (status === "ready") return (
    <span className="flex items-center gap-1 text-emerald-400 text-xs">
      <CheckCircle2 className="h-3 w-3" /> Analisado
    </span>
  );
  if (status === "analyzing") return (
    <span className="flex items-center gap-1 text-amber-400 text-xs">
      <Loader2 className="h-3 w-3 animate-spin" /> Analisando
    </span>
  );
  if (status === "failed") return (
    <span className="flex items-center gap-1 text-red-400 text-xs">
      <AlertCircle className="h-3 w-3" /> Falhou
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-zinc-500 text-xs">
      <Clock className="h-3 w-3" /> Pendente
    </span>
  );
}

function MarketplaceBadge({ marketplace }: { marketplace: string }) {
  const labels: Record<string, string> = {
    shopee: "Shopee", amazon: "Amazon", mercadolivre: "Mercado Livre", outro: "Outro",
  };
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-orange-950/40 text-orange-400 border border-orange-900/30">
      {labels[marketplace] ?? marketplace}
    </span>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

type ImportMode = "single" | "bulk";
type BulkResult = { url: string; name?: string; error?: string };

function ImportModal({ onClose, onImported }: {
  onClose: () => void;
  onImported: (id: string) => void;
}) {
  const [mode, setMode] = useState<ImportMode>("single");

  // Single mode
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; category: string; confidence: string; missingFields: string[] } | null>(null);
  const [importedId, setImportedId] = useState<string | null>(null);

  // Bulk mode
  const [bulkText, setBulkText] = useState("");
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; results: BulkResult[]; done: boolean } | null>(null);

  async function handleSingleImport() {
    if (!url.startsWith("http")) { setError("Cole um link válido (começa com http)"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json() as { error?: string; productId?: string; name?: string; category?: string; confidence?: string; missingFields?: string[] };
      if (!res.ok) { setError(data.error ?? "Erro ao importar"); return; }
      setResult({ name: data.name ?? "", category: data.category ?? "", confidence: data.confidence ?? "low", missingFields: data.missingFields ?? [] });
      setImportedId(data.productId ?? null);
    } catch { setError("Erro de rede"); } finally { setLoading(false); }
  }

  async function handleBulkImport() {
    const urls = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("http"));

    if (urls.length === 0) return;

    setBulkProgress({ current: 0, total: urls.length, results: [], done: false });

    for (let i = 0; i < urls.length; i++) {
      const u = urls[i]!;
      let entry: BulkResult;
      try {
        const res = await fetch("/api/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: u }),
        });
        const data = await res.json() as { name?: string; error?: string };
        entry = { url: u, name: res.ok ? (data.name ?? "") : undefined, error: res.ok ? undefined : (data.error ?? "Erro") };
      } catch {
        entry = { url: u, error: "Erro de rede" };
      }
      setBulkProgress((prev) => prev ? {
        ...prev,
        current: i + 1,
        results: [...prev.results, entry],
        done: i === urls.length - 1,
      } : null);
      // Small delay to avoid rate-limiting
      if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 300));
    }
  }

  const successCount = bulkProgress?.results.filter((r) => !r.error).length ?? 0;
  const failCount    = bulkProgress?.results.filter((r) => !!r.error).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="p-5 pb-4">
          <h2 className="text-base font-semibold text-zinc-100 mb-3">Importar produto(s)</h2>

          {/* Mode tabs */}
          {!bulkProgress && !result && (
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={[
                  "flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                  mode === "single" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-400",
                ].join(" ")}
              >
                <LinkIcon className="h-3 w-3" /> Link único
              </button>
              <button
                type="button"
                onClick={() => setMode("bulk")}
                className={[
                  "flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors",
                  mode === "bulk" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-400",
                ].join(" ")}
              >
                <List className="h-3 w-3" /> Importação em massa
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">

          {/* ── Single mode ── */}
          {mode === "single" && !result && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">Cole o link de afiliado da Shopee ou link público do produto.</p>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                placeholder="https://shopee.com.br/produto-i.123.456"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="flex-1 border-zinc-700">Cancelar</Button>
                <Button onClick={handleSingleImport} disabled={loading || !url} className="flex-1 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
                </Button>
              </div>
            </div>
          )}

          {/* Single mode result */}
          {mode === "single" && result && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{result.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{result.category} · Confiança {result.confidence}</p>
                  </div>
                </div>
                {result.missingFields.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-800/30">
                    <p className="text-xs text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Dados não encontrados: {result.missingFields.join(", ")}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Complete manualmente na página do produto.</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="flex-1 border-zinc-700">Fechar</Button>
                {importedId && (
                  <Button size="sm" onClick={() => onImported(importedId)} className="flex-1 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 text-white">
                    Ver produto
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── Bulk mode — input ── */}
          {mode === "bulk" && !bulkProgress && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">Cole um link por linha. Podem ser links de afiliado, links diretos da Shopee, Amazon, etc.</p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"https://shopee.com.br/produto-1\nhttps://shopee.com.br/produto-2\nhttps://shopee.com.br/produto-3"}
                rows={8}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none font-mono"
              />
              <p className="text-xs text-zinc-600">
                {bulkText.split("\n").filter((l) => l.trim().startsWith("http")).length} links detectados
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose} className="flex-1 border-zinc-700">Cancelar</Button>
                <Button
                  onClick={handleBulkImport}
                  disabled={!bulkText.split("\n").some((l) => l.trim().startsWith("http"))}
                  className="flex-1 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 text-white"
                >
                  Importar todos
                </Button>
              </div>
            </div>
          )}

          {/* Bulk mode — progress */}
          {mode === "bulk" && bulkProgress && (
            <div className="space-y-4">
              {!bulkProgress.done && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Importando {bulkProgress.current} de {bulkProgress.total}...</span>
                    <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-pink-500 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {bulkProgress.done && (
                <div className={`rounded-lg border p-3 text-sm ${
                  failCount === 0
                    ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-400"
                    : "border-amber-800/40 bg-amber-950/20 text-amber-400"
                }`}>
                  {successCount} produto{successCount !== 1 ? "s" : ""} importado{successCount !== 1 ? "s" : ""} com sucesso
                  {failCount > 0 && ` · ${failCount} falhou`}
                </div>
              )}

              {/* Per-item results */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {bulkProgress.results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {r.error
                      ? <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                      : <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />}
                    <span className="text-zinc-300 truncate flex-1">{r.name ?? r.url}</span>
                    {r.error && <span className="text-red-400 shrink-0">{r.error}</span>}
                  </div>
                ))}
                {!bulkProgress.done && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    <span>Buscando...</span>
                  </div>
                )}
              </div>

              {bulkProgress.done && (
                <Button size="sm" onClick={onClose} className="w-full border-zinc-700" variant="outline">
                  Fechar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, selected, onToggle }: { product: ProductItem; selected: boolean; onToggle: () => void }) {
  const router = useRouter();
  const displayPrice = product.promotionalPrice ?? product.price;
  const hasPromo = product.promotionalPrice !== null && product.promotionalPrice < product.price;

  return (
    <div className="group rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-zinc-700 transition-colors">
      <div className="h-40 bg-zinc-800 flex items-center justify-center relative">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-10 w-10 text-zinc-700" />
        )}
        <div className="absolute top-2 left-2"><MarketplaceBadge marketplace={product.marketplace} /></div>
        <label className="absolute right-2 top-2 z-10 flex cursor-pointer items-center gap-1.5 rounded-md bg-black/75 px-2 py-1 text-[10px] text-zinc-200">
          <input type="checkbox" checked={selected} onChange={onToggle} /> Selecionar
        </label>
        {product.rating && (
          <div className="absolute top-10 right-2 flex items-center gap-1 rounded px-1.5 py-0.5 bg-black/60 text-xs text-yellow-400">
            <Star className="h-2.5 w-2.5 fill-yellow-400" />
            {product.rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">{product.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{product.category}</p>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            {hasPromo && (
              <span className="text-xs text-zinc-600 line-through mr-1">R$ {product.price.toFixed(2)}</span>
            )}
            <span className="text-sm font-semibold text-zinc-100">R$ {displayPrice.toFixed(2)}</span>
          </div>
          <span className="text-xs text-emerald-400 font-medium">{product.commissionPct}% comissão</span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800">
          <div className="text-center">
            <p className="text-xs font-medium text-zinc-100">{product.metrics.campaigns}</p>
            <p className="text-[10px] text-zinc-600">camp.</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-zinc-100">{product.metrics.narratives}</p>
            <p className="text-[10px] text-zinc-600">narrat.</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-zinc-100">{product.metrics.ctr}%</p>
            <p className="text-[10px] text-zinc-600">CTR</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <AnalysisStatus status={product.analysisStatus} />
          {product.lastSyncedAt && (
            <span className="text-[10px] text-zinc-600">
              {new Date(product.lastSyncedAt).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs border-zinc-700 gap-1"
            onClick={() => router.push(`/laboratorio?productId=${product.id}`)}>
            <FlaskConical className="h-3 w-3" /> Lab
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs border-zinc-700 gap-1"
            onClick={() => router.push(`/campanhas/nova?productId=${product.id}`)}>
            <Megaphone className="h-3 w-3" /> Campanha
          </Button>
          <Link href={`/produtos/${product.id}`}>
            <Button size="sm" className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 gap-1">
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function ProdutosClient({ products }: { products: ProductItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [deletingProducts, setDeletingProducts] = useState(false);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.marketplace.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = products.reduce((s, p) => s + p.metrics.revenueBrl, 0);
  const totalConversions = products.reduce((s, p) => s + p.metrics.conversions, 0);

  function handleImported(id: string) {
    setShowImport(false);
    router.push(`/produtos/${id}`);
  }

  async function deleteSelectedProducts() {
    if (!selectedProducts.size || !window.confirm(`Excluir ${selectedProducts.size} produto(s) do catálogo? As campanhas existentes serão preservadas.`)) return;
    setDeletingProducts(true);
    const results = await Promise.all([...selectedProducts].map((id) => fetch(`/api/produtos/${id}`, { method: "DELETE" })));
    const failed = results.filter((response) => !response.ok).length;
    setDeletingProducts(false);
    if (failed) window.alert(`${failed} produto(s) não puderam ser excluídos.`);
    setSelectedProducts(new Set());
    router.refresh();
  }

  return (
    <>
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={handleImported} />}

      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="h-5 w-5 text-pink-400" />
                <h1 className="text-lg font-semibold">Produtos</h1>
              </div>
              <p className="text-sm text-zinc-500">Catálogo de produtos afiliados com universo narrativo mapeado.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild><Link href="/produtos/oportunidades"><ShoppingBag className="h-4 w-4" /> Buscar na Shopee</Link></Button>
              <Button onClick={() => setShowImport(true)} className="gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 text-white"><Plus className="h-4 w-4" /> Importar produto</Button>
            </div>
          </div>

          {products.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Produtos", value: products.length, icon: Package },
                { label: "Campanhas", value: products.reduce((s, p) => s + p.metrics.campaigns, 0), icon: Megaphone },
                { label: "Conversões", value: totalConversions, icon: BarChart3 },
                { label: "Comissão acumulada", value: `R$ ${totalRevenue.toFixed(2)}`, icon: BarChart3 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-pink-400" />
                    <span className="text-xs text-zinc-500">{label}</span>
                  </div>
                  <p className="text-xl font-semibold text-zinc-100">{value}</p>
                </div>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div className="mb-6 flex gap-2">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, categoria ou marketplace…"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
              /></div>
              <Button variant="outline" onClick={() => setSelectedProducts((current) => current.size === filtered.length ? new Set() : new Set(filtered.map((product) => product.id)))}>{selectedProducts.size === filtered.length ? "Desmarcar todos" : "Selecionar"}</Button>
              {selectedProducts.size > 0 && <Button variant="destructive" disabled={deletingProducts} onClick={() => void deleteSelectedProducts()}><Trash2 className="h-4 w-4" />{deletingProducts ? "Excluindo..." : `Excluir (${selectedProducts.size})`}</Button>}
            </div>
          )}

          {filtered.length > 0 ? (
            <div className="grid grid-cols-3 gap-5">
              {filtered.map((p) => <ProductCard key={p.id} product={p} selected={selectedProducts.has(p.id)} onToggle={() => setSelectedProducts((current) => { const next = new Set(current); next.has(p.id) ? next.delete(p.id) : next.add(p.id); return next; })} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingBag className="h-12 w-12 text-zinc-700 mb-4" />
              <h2 className="text-base font-medium text-zinc-300 mb-2">Nenhum produto cadastrado</h2>
              <p className="text-sm text-zinc-600 max-w-sm mb-6">
                Importe um produto por link para mapear seu universo narrativo e usá-lo nas campanhas e no Laboratório.
              </p>
              <Button onClick={() => setShowImport(true)} className="gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:opacity-90 text-white">
                <Plus className="h-4 w-4" /> Importar primeiro produto
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-8 w-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Nenhum produto encontrado para &quot;{search}&quot;</p>
              <button onClick={() => setSearch("")} className="text-xs text-pink-400 mt-2 hover:underline">
                Limpar busca
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
