"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package, Plus, Search, FlaskConical,
  Megaphone, BarChart3, ChevronRight, Loader2, Star,
  ShoppingBag, CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductMetrics {
  campaigns: number;
  narratives: number;
  clicks: number;
  impressions: number;
  conversions: number;
  revenueBrl: number;
  ctr: number;
}

interface ProductItem {
  id: string;
  name: string;
  marketplace: string;
  category: string;
  imageUrl: string;
  price: number;
  promotionalPrice: number | null;
  commission: number;
  commissionPct: number;
  rating: number | null;
  analysisStatus: string;
  lastSyncedAt: string | null;
  confidence: string | null;
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
    shopee: "Shopee",
    amazon: "Amazon",
    mercadolivre: "Mercado Livre",
    outro: "Outro",
  };
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-orange-950/40 text-orange-400 border border-orange-900/30">
      {labels[marketplace] ?? marketplace}
    </span>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: (id: string) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; category: string; confidence: string; missingFields: string[] } | null>(null);
  const [importedId, setImportedId] = useState<string | null>(null);

  async function handleImport() {
    if (!url.startsWith("http")) { setError("Cole um link válido (começa com http)"); return; }
    setLoading(true);
    setError(null);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-zinc-100 mb-1">Importar produto por link</h2>
        <p className="text-xs text-zinc-500 mb-4">Cole o link de afiliado da Shopee ou link público do produto.</p>

        {!result && (
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null); }}
              placeholder="https://shopee.com.br/produto-i.123.456"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="flex-1 border-zinc-700">Cancelar</Button>
              <Button onClick={handleImport} disabled={loading || !url} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
              </Button>
            </div>
          </div>
        )}

        {result && (
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
                  <p className="text-xs text-zinc-500 mt-1">
                    Você pode completar manualmente na página do produto.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="flex-1 border-zinc-700">Fechar</Button>
              {importedId && (
                <Button size="sm" onClick={() => onImported(importedId)} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
                  Ver produto
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: ProductItem }) {
  const router = useRouter();
  const displayPrice = product.promotionalPrice ?? product.price;
  const hasPromo = product.promotionalPrice !== null && product.promotionalPrice < product.price;

  return (
    <div className="group rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Image */}
      <div className="h-40 bg-zinc-800 flex items-center justify-center relative">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-10 w-10 text-zinc-700" />
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <MarketplaceBadge marketplace={product.marketplace} />
        </div>
        {product.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded px-1.5 py-0.5 bg-black/60 text-xs text-yellow-400">
            <Star className="h-2.5 w-2.5 fill-yellow-400" />
            {product.rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">{product.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{product.category}</p>
        </div>

        {/* Price + commission */}
        <div className="flex items-baseline justify-between">
          <div>
            {hasPromo && (
              <span className="text-xs text-zinc-600 line-through mr-1">R$ {product.price.toFixed(2)}</span>
            )}
            <span className="text-sm font-semibold text-zinc-100">R$ {displayPrice.toFixed(2)}</span>
          </div>
          <span className="text-xs text-emerald-400 font-medium">
            {product.commissionPct}% comissão
          </span>
        </div>

        {/* Metrics */}
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

        {/* Analysis status */}
        <div className="flex items-center justify-between">
          <AnalysisStatus status={product.analysisStatus} />
          {product.lastSyncedAt && (
            <span className="text-[10px] text-zinc-600">
              {new Date(product.lastSyncedAt).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs border-zinc-700 gap-1"
            onClick={() => router.push(`/laboratorio?productId=${product.id}`)}
          >
            <FlaskConical className="h-3 w-3" /> Lab
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs border-zinc-700 gap-1"
            onClick={() => router.push(`/campanhas/nova?productId=${product.id}`)}
          >
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

  return (
    <>
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={handleImported} />}

      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="h-5 w-5 text-violet-400" />
                <h1 className="text-lg font-semibold">Produtos</h1>
              </div>
              <p className="text-sm text-zinc-500">Catálogo de produtos afiliados com universo narrativo mapeado.</p>
            </div>
            <Button
              onClick={() => setShowImport(true)}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="h-4 w-4" /> Importar produto
            </Button>
          </div>

          {/* Summary stats */}
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
                    <Icon className="h-4 w-4 text-violet-400" />
                    <span className="text-xs text-zinc-500">{label}</span>
                  </div>
                  <p className="text-xl font-semibold text-zinc-100">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          {products.length > 0 && (
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, categoria ou marketplace…"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-3 gap-5">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingBag className="h-12 w-12 text-zinc-700 mb-4" />
              <h2 className="text-base font-medium text-zinc-300 mb-2">Nenhum produto cadastrado</h2>
              <p className="text-sm text-zinc-600 max-w-sm mb-6">
                Importe um produto por link para mapear seu universo narrativo e usá-lo nas campanhas e no Laboratório.
              </p>
              <Button onClick={() => setShowImport(true)} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="h-4 w-4" /> Importar primeiro produto
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-8 w-8 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Nenhum produto encontrado para &quot;{search}&quot;</p>
              <button onClick={() => setSearch("")} className="text-xs text-violet-400 mt-2 hover:underline">
                Limpar busca
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
