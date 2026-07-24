"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Offer = {
  itemId: number; productName: string; commissionRate: number; sellerCommissionRate: number;
  shopeeCommissionRate: number; commission: number; priceMin: number; priceMax?: number | null;
  sales: number; ratingStar: number; imageUrl: string; productLink?: string; offerLink: string;
  shopId: number; shopName: string; periodEndTime?: number | null;
};

type CatalogResponse = {
  nodes: Offer[];
  pageInfo: { page: number; limit: number; hasNextPage: boolean };
  total: number;
  catalogTotal: number;
  lastSyncedAt: string | null;
  error?: string;
};

const CATEGORIES = [
  { id: "", name: "Todas as categorias" },
  { id: "100001", name: "Saúde e suplementos" },
  { id: "100630", name: "Beleza e cuidados pessoais" },
  { id: "100636", name: "Casa e decoração" },
  { id: "100017", name: "Moda feminina" },
  { id: "100011", name: "Moda masculina" },
  { id: "100532", name: "Calçados" },
  { id: "100009", name: "Acessórios" },
  { id: "100535", name: "Eletrônicos e áudio" },
  { id: "100631", name: "Produtos para pets" },
  { id: "100632", name: "Bebê e infantil" },
  { id: "100638", name: "Papelaria e escritório" },
];

export default function OportunidadesShopeePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [extraOnly, setExtraOnly] = useState(false);
  const [minCommission, setMinCommission] = useState(0);
  const [minSales, setMinSales] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [sort, setSort] = useState(2);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [total, setTotal] = useState(0);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const initialSyncStarted = useRef(false);

  const requestUrl = useCallback((targetPage: number) => {
    const params = new URLSearchParams({
      page: String(targetPage), limit: "48", q: query, category,
      extra: extraOnly ? "1" : "0", sort: String(sort),
      minPrice: String(minPrice), maxPrice: String(maxPrice),
      minCommission: String(minCommission), minSales: String(minSales), minRating: String(minRating),
    });
    return `/api/shopee/offers?${params}`;
  }, [category, extraOnly, maxPrice, minCommission, minPrice, minRating, minSales, query, sort]);

  const load = useCallback(async (reset = true) => {
    reset ? setLoading(true) : setLoadingMore(true);
    setError("");
    const targetPage = reset ? 1 : page + 1;
    try {
      const response = await fetch(requestUrl(targetPage), { cache: "no-store" });
      const data = await response.json() as CatalogResponse;
      if (!response.ok) throw new Error(data.error || "Erro ao consultar o catálogo");
      setOffers((current) => reset ? data.nodes : [...current, ...data.nodes.filter((offer) => !current.some((item) => item.itemId === offer.itemId))]);
      setPage(targetPage);
      setHasNextPage(data.pageInfo.hasNextPage);
      setTotal(data.total);
      setCatalogTotal(data.catalogTotal);
      setLastSyncedAt(data.lastSyncedAt);
      return data;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro ao consultar o catálogo");
      return null;
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, requestUrl]);

  const syncCatalog = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setError("");
    setMessage("");
    setSyncProgress(0);
    let nextPage: number | null = 1;
    let synchronized = 0;
    try {
      while (nextPage) {
        const response = await fetch("/api/shopee/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync", startPage: nextPage }),
        });
        const data = await response.json() as { synced?: number; nextPage?: number | null; complete?: boolean; error?: string };
        if (!response.ok) throw new Error(data.error || "Falha ao sincronizar a Shopee");
        synchronized += data.synced || 0;
        setSyncProgress(synchronized);
        nextPage = data.complete ? null : data.nextPage ?? null;
        await load(true);
      }
      const finalData = await load(true);
      setMessage(`Catálogo atualizado: ${finalData?.catalogTotal ?? synchronized} produtos disponíveis no Escriba.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao sincronizar a Shopee");
    } finally {
      setSyncing(false);
    }
  }, [load, syncing]);

  useEffect(() => {
    void (async () => {
      const data = await load(true);
      if (data?.catalogTotal === 0 && !initialSyncStarted.current) {
        initialSyncStarted.current = true;
        await syncCatalog();
      }
    })();
    // Initial catalog load only. Filters are applied explicitly by the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function importSelected() {
    const chosen = offers.filter((offer) => selected.has(offer.itemId));
    if (!chosen.length) return;
    setImporting(true);
    setMessage("");
    setError("");
    try {
      let imported = 0;
      for (let index = 0; index < chosen.length; index += 100) {
        const response = await fetch("/api/shopee/offers", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offers: chosen.slice(index, index + 100) }),
        });
        const data = await response.json() as { imported?: number; error?: string };
        if (!response.ok) throw new Error(data.error || "Falha ao importar produtos");
        imported += data.imported || 0;
      }
      setMessage(`${imported} produto(s) importado(s) para o Escriba.`);
      setSelected(new Set());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao importar produtos");
    } finally {
      setImporting(false);
    }
  }

  const allLoadedSelected = offers.length > 0 && offers.every((offer) => selected.has(offer.itemId));

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Catálogo de ofertas da Shopee</h1>
        <p className="text-sm text-zinc-400">Pesquise todo o catálogo sincronizado e importe somente os produtos que deseja usar.</p>
        <p className="mt-1 text-xs text-zinc-500">
          {catalogTotal} produtos sincronizados
          {lastSyncedAt ? ` · atualizado em ${new Date(lastSyncedAt).toLocaleString("pt-BR")}` : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" disabled={syncing} onClick={() => void syncCatalog()}>
          {syncing ? `Sincronizando… ${syncProgress} lidos` : "Atualizar catálogo da Shopee"}
        </Button>
        <Button variant="outline" asChild><Link href="/produtos">Meus produtos</Link></Button>
      </div>
    </div>

    <div className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 md:grid-cols-3 xl:grid-cols-6">
      <Input className="xl:col-span-2" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void load(true)} placeholder="Nome do produto" />
      <select className="rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select className="rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm" value={sort} onChange={(event) => setSort(Number(event.target.value))}>
        <option value={2}>Melhor desempenho</option><option value={5}>Maior comissão</option><option value={1}>Mais recentes</option><option value={4}>Menor preço</option><option value={3}>Maior preço</option>
      </select>
      <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={extraOnly} onChange={(event) => setExtraOnly(event.target.checked)} />Só comissão extra</label>
      <Input type="number" min="0" step="0.01" placeholder="Preço mínimo R$" value={minPrice || ""} onChange={(event) => setMinPrice(Number(event.target.value))} />
      <Input type="number" min="0" step="0.01" placeholder="Preço máximo R$" value={maxPrice || ""} onChange={(event) => setMaxPrice(Number(event.target.value))} />
      <Input type="number" min="0" placeholder="Comissão mínima %" value={minCommission || ""} onChange={(event) => setMinCommission(Number(event.target.value))} />
      <Input type="number" min="0" placeholder="Vendas mínimas" value={minSales || ""} onChange={(event) => setMinSales(Number(event.target.value))} />
      <Input type="number" min="0" max="5" step="0.1" placeholder="Avaliação mínima" value={minRating || ""} onChange={(event) => setMinRating(Number(event.target.value))} />
      <span className="self-center text-xs text-zinc-500">{total} ofertas encontradas</span>
      <Button className="md:col-start-3 xl:col-start-6" onClick={() => void load(true)}>Aplicar busca</Button>
    </div>

    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <span className="text-sm text-zinc-400">{selected.size} selecionado(s) · {offers.length} carregados</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setSelected((current) => { const next = new Set(current); allLoadedSelected ? offers.forEach((offer) => next.delete(offer.itemId)) : offers.forEach((offer) => next.add(offer.itemId)); return next; })}>{allLoadedSelected ? "Desmarcar carregados" : "Selecionar carregados"}</Button>
        <Button size="sm" disabled={!selected.size || importing} onClick={() => void importSelected()}>{importing ? "Importando…" : "Importar selecionados"}</Button>
      </div>
    </div>

    {message && <div className="rounded-lg border border-emerald-800 bg-emerald-950/20 p-3 text-sm text-emerald-300">{message} <Link href="/produtos" className="underline">Ver meus produtos</Link></div>}
    {error && <div className="rounded-lg border border-red-800 bg-red-950/20 p-3 text-sm text-red-300">{error}</div>}
    {syncing && <div className="rounded-lg border border-pink-800 bg-pink-950/20 p-3 text-sm text-pink-200">A Shopee está sendo percorrida página por página. Já foram lidas {syncProgress} ofertas nesta atualização.</div>}

    {loading ? <p className="text-zinc-400">Carregando catálogo…</p> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{offers.map((offer) => <div key={offer.itemId} className={`rounded-xl border bg-zinc-900/60 p-4 ${selected.has(offer.itemId) ? "border-pink-500" : "border-zinc-800"}`}>
        <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={selected.has(offer.itemId)} onChange={() => toggle(offer.itemId)} />Selecionar</label>
        <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-zinc-800"><Image src={offer.imageUrl} alt={offer.productName} fill className="object-cover" unoptimized /></div>
        <h2 className="line-clamp-2 min-h-10 text-sm font-medium text-zinc-100">{offer.productName}</h2>
        <p className="mt-1 text-xs text-zinc-500">{offer.shopName} · {offer.sales} vendas · ★ {Number(offer.ratingStar).toFixed(1)}</p>
        <div className="mt-3 rounded-lg bg-emerald-950/30 p-3 text-xs">
          <p className="font-semibold text-emerald-300">{(Number(offer.commissionRate) * 100).toFixed(1)}% total</p>
          <p className="text-zinc-400">Extra: {(Number(offer.sellerCommissionRate) * 100).toFixed(1)}% · Shopee: {(Number(offer.shopeeCommissionRate) * 100).toFixed(1)}%</p>
          <p className="text-zinc-400">R$ {Number(offer.commission).toFixed(2)} estimados por venda</p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2"><span className="text-sm text-zinc-200">R$ {Number(offer.priceMin).toFixed(2)}</span><Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(offer.offerLink); setMessage("Link afiliado copiado."); }}>Copiar link</Button></div>
      </div>)}</div>
      {hasNextPage && <div className="flex justify-center pt-2"><Button variant="outline" disabled={loadingMore} onClick={() => void load(false)}>{loadingMore ? "Carregando…" : `Carregar mais (${offers.length} de ${total})`}</Button></div>}
      {!offers.length && !syncing && <p className="py-12 text-center text-sm text-zinc-500">Nenhuma oferta encontrada com estes filtros.</p>}
    </>}
  </div>;
}
