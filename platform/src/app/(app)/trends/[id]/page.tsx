"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Check, Calendar, Loader2, Image as ImageIcon, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLabel } from "@/lib/engines/trend-engine";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TrendPost = {
  id: string;
  position: number;
  content: string;
  hasMedia: boolean;
  mediaType?: string | null;
  publishedAt?: string | null;
};

type Trend = {
  id: string;
  format: string;
  hook: string;
  narrativeSummary: string;
  status: string;
  qualityScore: number | null;
  postsCount: number;
  scheduledAt: string | null;
  publishedAt: string | null;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  totalRevenueBrl: number;
  createdAt: string;
  posts: TrendPost[];
  campaign: {
    id: string;
    name: string;
    productName: string;
    marketplace: string;
    targetNetwork: string;
  };
};

const STATUS_CONFIG: Record<string, { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  approved: { label: "Aprovada", variant: "success" },
  scheduled: { label: "Agendada", variant: "info" },
  published: { label: "Publicada", variant: "default" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

export default function TrendDetailPage() {
  const params = useParams();
  const [trend, setTrend] = useState<Trend | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrend = useCallback(async () => {
    const res = await fetch(`/api/trends/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setTrend(data.trend);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTrend();
  }, [fetchTrend]);

  async function doAction(body: Record<string, string>) {
    setActionLoading(true);
    const res = await fetch(`/api/trends/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) await fetchTrend();
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!trend) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Trend não encontrada.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/trends">Voltar</Link>
        </Button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[trend.status] ?? { label: trend.status, variant: "secondary" as const };
  const ctr = trend.totalImpressions > 0 ? (trend.totalClicks / trend.totalImpressions) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/trends">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            <span className="text-xs text-zinc-500">{formatLabel(trend.format)}</span>
            {trend.qualityScore && (
              <span className="text-xs text-violet-400">
                {Math.round(trend.qualityScore * 100)}% qualidade
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400">{trend.campaign.name} · {trend.campaign.targetNetwork}</p>
        </div>
      </div>

      {/* Actions */}
      {(trend.status === "draft" || trend.status === "approved") && (
        <div className="flex gap-2 flex-wrap">
          {trend.status === "draft" && (
            <Button size="sm" onClick={() => doAction({ status: "approved" })} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
              <Check className="h-4 w-4" />
              Aprovar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => doAction({ action: "regenerate" })} disabled={actionLoading}>
            <RefreshCw className="h-4 w-4" />
            Regenerar
          </Button>
          {trend.status === "approved" && (
            <Button variant="outline" size="sm" onClick={() => doAction({ status: "scheduled", scheduledAt: new Date(Date.now() + 86400000).toISOString() })} disabled={actionLoading}>
              <Calendar className="h-4 w-4" />
              Agendar para amanhã
            </Button>
          )}
        </div>
      )}

      {/* Metrics for published */}
      {trend.status === "published" && trend.totalClicks > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Cliques", value: formatNumber(trend.totalClicks) },
            { label: "Impressões", value: formatNumber(trend.totalImpressions) },
            { label: "CTR", value: formatPercent(ctr) },
            { label: "Receita", value: formatCurrency(trend.totalRevenueBrl) },
          ].map((m) => (
            <Card key={m.label}>
              <CardContent className="p-3">
                <p className="text-xs text-zinc-500">{m.label}</p>
                <p className="text-base font-bold text-zinc-100">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Posts — thread view */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Thread completa — {trend.posts.length} posts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {trend.posts.map((post, idx) => (
            <div key={post.id} className="relative">
              {/* Connector line */}
              {idx < trend.posts.length - 1 && (
                <div className="absolute left-[2.25rem] top-[3.5rem] bottom-0 w-0.5 bg-zinc-800 z-0" />
              )}
              <div className="flex gap-4 px-5 py-4 relative z-10">
                {/* Post number avatar */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 shrink-0">
                  {post.position}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                  {post.hasMedia && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                      {post.mediaType === "video" ? (
                        <Video className="h-3.5 w-3.5" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" />
                      )}
                      <span>Recomenda {post.mediaType === "video" ? "vídeo" : "imagem"}</span>
                    </div>
                  )}
                  {post.publishedAt && (
                    <p className="text-xs text-zinc-600 mt-1">
                      Publicado {format(new Date(post.publishedAt), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Meta */}
      <Card>
        <CardContent className="p-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Campanha", value: trend.campaign.name },
              { label: "Formato", value: formatLabel(trend.format) },
              { label: "Rede", value: trend.campaign.targetNetwork },
              { label: "Marketplace", value: trend.campaign.marketplace },
              ...(trend.scheduledAt
                ? [{ label: "Agendada para", value: format(new Date(trend.scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) }]
                : []),
              ...(trend.publishedAt
                ? [{ label: "Publicada em", value: format(new Date(trend.publishedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) }]
                : []),
              { label: "Criada em", value: format(new Date(trend.createdAt), "dd/MM/yyyy", { locale: ptBR }) },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-xs text-zinc-500">{item.label}</dt>
                <dd className="text-zinc-200 mt-0.5">{item.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
