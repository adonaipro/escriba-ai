"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pause,
  Play,
  TrendingUp,
  MousePointerClick,
  Eye,
  DollarSign,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  BookOpen,
  FlaskConical,
  Copy,
  Send,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber, formatPercent, campaignStatusLabel } from "@/lib/utils";
import { formatLabel } from "@/lib/engines/trend-engine";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type TrendPost = {
  id: string;
  position: number;
  content: string;
  hasMedia: boolean;
  mediaType?: string | null;
};

type Trend = {
  id: string;
  format: string;
  contentMode: string | null;
  hook: string;
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
};

type Learning = {
  id: string;
  summary: string;
  type: string;
  impact: string;
  autoApplied: boolean;
  recordedAt: string;
};

type CampaignEvent = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  metadata?: string | null;
  createdAt: string;
};

type GenerationJob = {
  id: string;
  status: string;
  statusLabel: string;
  progress: number;
  trendId?: string | null;
  error?: string | null;
  createdAt: string;
};

type Campaign = {
  id: string;
  name: string;
  productName: string;
  productUrl: string;
  marketplace: string;
  targetNetwork: string;
  status: string;
  mode: string;
  objective: string;
  trendsPerDay: number;
  postsPerDay: number;
  createdAt: string;
  customSchedule: string | null;
  approvalMode: string;
  startDate: string | null;
  metrics: {
    totalClicks: number;
    totalImpressions: number;
    totalRevenue: number;
    totalConversions: number;
  };
  trends: Trend[];
  learnings: Learning[];
  events: CampaignEvent[];
  generationJobs: GenerationJob[];
  socialAccount: { id: string; username: string | null; network: string; isMock: boolean } | null;
  narrator: { id: string; name: string } | null;
};

const CONTENT_MODE_LABELS: Record<string, string> = {
  "story-produto": "Story + Produto",
  "story-organico": "Story Orgânico",
  desabafo: "Desabafo",
  polemica: "Polêmica",
  pergunta: "Pergunta",
  "mix-editorial": "Mix Editorial",
};

function campaignSchedule(campaign: Campaign) {
  try { return JSON.parse(campaign.customSchedule || "{}") as { contentMode?: string; editorialModes?: string[]; scheduleTimes?: string[]; scheduleDays?: number[] }; }
  catch { return {}; }
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    testing: "secondary",
    scale_eligible: "success",
    scaling: "default",
    monitoring: "info",
    saturating: "warning",
    paused: "outline",
    ended: "outline",
  };
  return (map[status] || "secondary") as Parameters<typeof Badge>[0]["variant"];
}

function trendStatusColor(status: string) {
  const map: Record<string, string> = {
    draft: "secondary",
    approved: "success",
    scheduled: "info",
    published: "default",
    rejected: "destructive",
  };
  return (map[status] || "secondary") as Parameters<typeof Badge>[0]["variant"];
}

function trendStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Rascunho",
    approved: "Aprovada",
    scheduled: "Agendada",
    published: "Publicada",
    rejected: "Rejeitada",
  };
  return map[status] ?? status;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  created: <Sparkles className="h-3.5 w-3.5 text-pink-400" />,
  generated: <Sparkles className="h-3.5 w-3.5 text-pink-400" />,
  approved: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  rejected: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  published: <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />,
  learning_detected: <BookOpen className="h-3.5 w-3.5 text-amber-400" />,
  scale_started: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
  saturation_detected: <Eye className="h-3.5 w-3.5 text-amber-400" />,
  strategy_changed: <FlaskConical className="h-3.5 w-3.5 text-pink-400" />,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      title="Copiar post"
      className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
    >
      {copied
        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function JobProgressCard({ job }: { job: GenerationJob }) {
  const completed = job.status === "completed";
  const failed = job.status === "failed";
  const active = !completed && !failed;

  return (
    <div className={`rounded-lg border p-3 ${
      completed ? "border-emerald-800/40 bg-emerald-950/10" :
      failed ? "border-red-800/40 bg-red-950/10" :
      "border-pink-800/40 bg-pink-950/10"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {active && <Loader2 className="h-3.5 w-3.5 animate-spin text-pink-400" />}
        {completed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
        {failed && <XCircle className="h-3.5 w-3.5 text-red-400" />}
        <span className="text-xs font-medium text-zinc-200">{job.statusLabel}</span>
        <span className="text-xs text-zinc-500 ml-auto">{job.progress}%</span>
      </div>
      {active && (
        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-pink-500 transition-all"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      )}
      {failed && job.error && (
        <p className="text-xs text-red-400 mt-1">{job.error}</p>
      )}
    </div>
  );
}

function TrendRow({ trend }: { trend: Trend }) {
  const [open, setOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState(() => format(new Date(Date.now() + 10 * 60_000), "yyyy-MM-dd'T'HH:mm"));
  const [scheduling, setScheduling] = useState(false);

  async function publishNow() {
    setPublishing(true);
    setPublishError(null);
    try {
      const response = await fetch(`/api/trends/${trend.id}/publish`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao publicar");
      window.location.reload();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Falha ao publicar");
    } finally {
      setPublishing(false);
    }
  }

  async function schedulePublication() {
    setScheduling(true);
    setPublishError(null);
    try {
      const response = await fetch(`/api/trends/${trend.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule", status: "scheduled", scheduledAt: new Date(scheduleAt).toISOString() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao agendar");
      window.location.reload();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Falha ao agendar");
    } finally { setScheduling(false); }
  }

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-5 py-4 hover:bg-zinc-800/30 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant={trendStatusColor(trend.status)} className="text-xs">
              {trendStatusLabel(trend.status)}
            </Badge>
            <span className="text-xs text-pink-300">{trend.contentMode ? CONTENT_MODE_LABELS[trend.contentMode] ?? trend.contentMode : formatLabel(trend.format)}</span>
            {trend.qualityScore && (
              <span className="text-xs text-pink-400">
                {Math.round(trend.qualityScore * 100)}% qualidade
              </span>
            )}
            <span className="text-xs text-zinc-600 ml-auto">
              {trend.postsCount} posts
            </span>
          </div>
          <p className="text-sm text-zinc-200 line-clamp-2">{trend.hook}</p>
          {trend.publishedAt && (
            <p className="text-xs text-zinc-500 mt-1">
              Publicada em {format(new Date(trend.publishedAt), "dd/MM/yyyy", { locale: ptBR })}
              {trend.totalClicks > 0 && (
                <span className="ml-2 text-zinc-400">
                  · {formatNumber(trend.totalClicks)} cliques · {formatCurrency(trend.totalRevenueBrl)}
                </span>
              )}
            </p>
          )}
          {trend.scheduledAt && !trend.publishedAt && (
            <p className="text-xs text-zinc-500 mt-1">
              Agendada para {format(new Date(trend.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
          {trend.status === "approved" && !trend.scheduledAt && (
            <p className="text-xs text-amber-400 mt-1">Aprovada, mas ainda não agendada</p>
          )}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-3 ml-7">
          {trend.status !== "published" && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-pink-800/30 bg-pink-950/10 p-3">
              <div><p className="text-sm font-medium text-zinc-200">Publicar esta historia no Threads</p>{publishError && <p className="mt-1 text-xs text-red-400">{publishError}</p>}</div>
              <Button size="sm" onClick={() => void publishNow()} disabled={publishing}>{publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{publishing ? "Publicando..." : "Publicar agora"}</Button>
            </div>
          )}
          {trend.status !== "published" && (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <label className="flex-1 min-w-56 text-xs text-zinc-400">Data e horário
                <input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200" />
              </label>
              <Button variant="outline" size="sm" onClick={() => void schedulePublication()} disabled={scheduling || !scheduleAt}>
                {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Agendar
              </Button>
            </div>
          )}
          {trend.posts.map((p) => (
            <div key={p.id} className="rounded-lg bg-zinc-800/40 p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs text-zinc-600 font-mono">Post {p.position}/{trend.postsCount}</span>
                <div className="flex items-center gap-2">
                  {p.hasMedia && (
                    <Badge variant="outline" className="text-xs">
                      {p.mediaType ?? "mídia"}
                    </Badge>
                  )}
                  <CopyButton text={p.content} />
                </div>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{p.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineEvent({ event }: { event: CampaignEvent }) {
  const icon = EVENT_ICONS[event.type] ?? <Clock className="h-3.5 w-3.5 text-zinc-400" />;

  let meta: Record<string, string> | null = null;
  try {
    if (event.metadata) meta = JSON.parse(event.metadata) as Record<string, string>;
  } catch { /* ignore */ }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 shrink-0">
          {icon}
        </div>
        <div className="flex-1 w-px bg-zinc-800 mt-1" />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-zinc-200">{event.title}</p>
          <span className="text-xs text-zinc-600 shrink-0">
            {formatDistanceToNow(new Date(event.createdAt), { locale: ptBR, addSuffix: true })}
          </span>
        </div>
        {event.description && (
          <p className="text-xs text-zinc-400 mt-0.5">{event.description}</p>
        )}
        {meta && (meta.family || meta.emotion) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {meta.family && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-pink-600/10 border border-pink-800/30 text-pink-300">
                {meta.family}
              </span>
            )}
            {meta.emotion && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600/10 border border-blue-800/30 text-blue-300">
                {meta.emotion}
              </span>
            )}
            {meta.character && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700/40 border border-zinc-700 text-zinc-400">
                {meta.character}
              </span>
            )}
            {meta.provider && meta.provider !== "simulated" && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-600/10 border border-emerald-800/30 text-emerald-400">
                {meta.provider}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LaboratorioTab({ campaign }: { campaign: Campaign }) {
  // Extract narrative elements from events
  const generatedEvents = campaign.events.filter((e) => e.type === "generated");

  const families: Record<string, number> = {};
  const emotions: Record<string, number> = {};
  const characters: Record<string, number> = {};

  for (const ev of generatedEvents) {
    try {
      if (!ev.metadata) continue;
      const m = JSON.parse(ev.metadata) as { family?: string; emotion?: string; character?: string };
      if (m.family) families[m.family] = (families[m.family] || 0) + 1;
      if (m.emotion) emotions[m.emotion] = (emotions[m.emotion] || 0) + 1;
      if (m.character) characters[m.character] = (characters[m.character] || 0) + 1;
    } catch { /* ignore */ }
  }

  const totalGenerated = generatedEvents.length;
  const published = campaign.trends.filter((t) => t.status === "published");
  const approved = campaign.trends.filter((t) => t.status === "approved" || t.status === "scheduled");
  const rejected = campaign.trends.filter((t) => t.status === "rejected");
  const pending = campaign.trends.filter((t) => t.status === "draft");

  return (
    <div className="space-y-6">
      {/* Status counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Geradas", value: totalGenerated, color: "text-pink-400" },
          { label: "Publicadas", value: published.length, color: "text-blue-400" },
          { label: "Aprovadas", value: approved.length, color: "text-emerald-400" },
          { label: "Rejeitadas", value: rejected.length, color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI voice box */}
      {totalGenerated === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <FlaskConical className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">O laboratório começa a funcionar após a primeira geração</p>
        </div>
      ) : (
        <div className="rounded-lg border border-pink-800/30 border-l-2 border-l-pink-500 bg-zinc-900/50 p-4">
          <p className="text-xs text-pink-400 font-mono mb-2 tracking-wide">A ENTIDADE</p>
          <p className="text-sm text-zinc-300 font-mono leading-relaxed">
            {totalGenerated === 1
              ? `Primeira narrativa desta campanha gerada. Aguardando dados de performance para detectar padrões.`
              : `Analisei ${totalGenerated} narrativas nesta campanha. ${
                  Object.keys(families).length > 1
                    ? `Famílias testadas: ${Object.keys(families).join(", ")}.`
                    : `Família principal: ${Object.keys(families)[0] ?? "—"}.`
                } ${pending.length > 0 ? `${pending.length} narrativa${pending.length > 1 ? "s" : ""} aguardando sua revisão.` : ""}`}
          </p>
        </div>
      )}

      {/* Narrative elements breakdown */}
      {totalGenerated > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Famílias usadas", data: families },
            { label: "Emoções exploradas", data: emotions },
            { label: "Personagens testados", data: characters },
          ].map(({ label, data }) => (
            <Card key={label}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {Object.keys(data).length === 0 ? (
                  <p className="text-xs text-zinc-600">Nenhum dado ainda</p>
                ) : (
                  Object.entries(data)
                    .sort(([, a], [, b]) => b - a)
                    .map(([key, count]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-zinc-300 flex-1 truncate">{key}</span>
                        <span className="text-xs text-zinc-500 shrink-0">{count}×</span>
                        <div className="w-12 h-1 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-pink-500"
                            style={{ width: `${(count / totalGenerated) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchCampaign = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${params.id as string}`);
    if (res.ok) {
      const data = await res.json() as { campaign: Campaign };
      setCampaign(data.campaign);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    void fetchCampaign();
  }, [fetchCampaign]);

  // Poll if there's an active generation job
  useEffect(() => {
    if (!campaign) return;
    const activeJob = campaign.generationJobs.find(
      (j) => j.status !== "completed" && j.status !== "failed"
    );
    if (!activeJob) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/generation-jobs/${activeJob.id}`);
      if (res.ok) {
        const data = await res.json() as { job: { status: string } };
        if (data.job.status === "completed" || data.job.status === "failed") {
          clearInterval(interval);
          void fetchCampaign();
        } else {
          void fetchCampaign();
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [campaign, fetchCampaign]);

  async function updateStatus(status: string) {
    setActionLoading(true);
    const res = await fetch(`/api/campaigns/${params.id as string}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await fetchCampaign();
    setActionLoading(false);
  }

  async function generateNew() {
    setGenerating(true);
    await fetch("/api/generation-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: params.id }),
    });
    await fetchCampaign();
    setGenerating(false);
  }

  async function deleteCampaign() {
    if (!window.confirm("Excluir esta campanha e todas as narrativas e agendamentos? Publicações já feitas no Threads não serão apagadas.")) return;
    setActionLoading(true);
    const response = await fetch(`/api/campaigns/${params.id as string}`, { method: "DELETE" });
    if (response.ok) router.push("/campanhas");
    else setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">Campanha não encontrada.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/campanhas">Voltar</Link>
        </Button>
      </div>
    );
  }

  const ctr =
    campaign.metrics.totalImpressions > 0
      ? (campaign.metrics.totalClicks / campaign.metrics.totalImpressions) * 100
      : 0;

  const publishedTrends = campaign.trends.filter((t) => t.status === "published");
  const scheduledTrends = campaign.trends.filter((t) => t.status === "scheduled");
  const draftTrends = campaign.trends.filter((t) => t.status === "draft" || t.status === "approved");
  const schedule = campaignSchedule(campaign);
  const editorialLabel = schedule.contentMode === "mix-editorial"
    ? `Mix Editorial (${(schedule.editorialModes ?? []).map((mode) => CONTENT_MODE_LABELS[mode] ?? mode).join(", ")})`
    : CONTENT_MODE_LABELS[schedule.contentMode ?? ""] ?? schedule.contentMode ?? "Não informado";
  const nextScheduled = scheduledTrends.filter((trend) => trend.scheduledAt).sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];

  const activeJob = campaign.generationJobs.find(
    (j) => j.status !== "completed" && j.status !== "failed"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campanhas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-100">{campaign.name}</h1>
              <Badge variant={statusColor(campaign.status)}>
                {campaignStatusLabel(campaign.status)}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">
              {campaign.productName} · {campaign.marketplace} · {campaign.targetNetwork}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              {campaign.socialAccount ? `@${campaign.socialAccount.username}` : "Sem conta vinculada"}
              {campaign.narrator ? ` · Narrador ${campaign.narrator.name}` : " · Sem narrador"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {campaign.status === "scale_eligible" && (
            <Button size="sm" onClick={() => updateStatus("scaling")} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
              <TrendingUp className="h-4 w-4" />
              Ativar escala
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={generateNew}
            disabled={generating || !!activeJob}
          >
            {generating || activeJob ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {activeJob ? "Gerando..." : "Nova narrativa"}
          </Button>
          {["testing", "scale_eligible", "scaling", "monitoring"].includes(campaign.status) ? (
            <Button variant="outline" size="sm" onClick={() => updateStatus("paused")} disabled={actionLoading}>
              <Pause className="h-4 w-4" />
            </Button>
          ) : campaign.status === "paused" ? (
            <Button variant="outline" size="sm" onClick={() => updateStatus("testing")} disabled={actionLoading}>
              <Play className="h-4 w-4" />
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={deleteCampaign} disabled={actionLoading} className="border-red-900/60 text-red-400 hover:bg-red-950/30">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active job progress */}
      {activeJob && (
        <JobProgressCard job={activeJob} />
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Cliques", value: formatNumber(campaign.metrics.totalClicks), icon: MousePointerClick, color: "text-blue-400" },
          { label: "Impressões", value: formatNumber(campaign.metrics.totalImpressions), icon: Eye, color: "text-pink-400" },
          { label: "CTR", value: formatPercent(ctr), icon: TrendingUp, color: "text-amber-400" },
          { label: "Receita", value: formatCurrency(campaign.metrics.totalRevenue), icon: DollarSign, color: "text-emerald-400" },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <span className="text-xs text-zinc-400">{m.label}</span>
              </div>
              <p className="text-xl font-bold text-zinc-100">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="narrativas">
        <TabsList>
          <TabsTrigger value="narrativas">Narrativas ({campaign.trends.length})</TabsTrigger>
          <TabsTrigger value="laboratorio">Laboratório</TabsTrigger>
          <TabsTrigger value="timeline">Timeline ({campaign.events.length})</TabsTrigger>
          <TabsTrigger value="aprendizados">Aprendizados ({campaign.learnings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="narrativas" className="mt-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex gap-2 text-xs text-zinc-500">
              <span>{publishedTrends.length} publicadas</span>
              <span>·</span>
              <span>{scheduledTrends.length} agendadas</span>
              <span>·</span>
              <span>{draftTrends.length} em rascunho</span>
            </div>
          </div>
          {campaign.trends.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
              <Sparkles className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Nenhuma narrativa ainda.</p>
              <p className="text-xs text-zinc-600 mt-1">Clique em &quot;Nova narrativa&quot; para gerar a primeira.</p>
            </div>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {campaign.trends.map((t) => (
                  <TrendRow key={t.id} trend={t} />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* Config tab removed — moved inline below */}

        <TabsContent value="laboratorio" className="mt-4">
          <LaboratorioTab campaign={campaign} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          {campaign.events.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">Nenhum evento registrado ainda.</p>
            </div>
          ) : (
            <div className="pt-2">
              {campaign.events.map((ev) => (
                <TimelineEvent key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aprendizados" className="mt-4 space-y-3">
          {campaign.learnings.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-8">Nenhum aprendizado desta campanha ainda.</p>
          ) : (
            campaign.learnings.map((l) => (
              <Card key={l.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">{l.type}</Badge>
                    <Badge variant={l.impact === "positive" ? "success" : l.impact === "negative" ? "destructive" : "outline"} className="text-xs">
                      {l.impact === "positive" ? "positivo" : l.impact === "negative" ? "negativo" : "neutro"}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{l.summary}</p>
                  <p className="text-xs text-zinc-500 mt-2">
                    {format(new Date(l.recordedAt), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

      </Tabs>

      {/* Campaign config — inline, below tabs */}
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-4 py-3">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
          {[
            { label: "Conteúdo", value: editorialLabel },
            { label: "Publicação", value: campaign.approvalMode === "auto" ? "Automática" : "Revisão manual" },
            { label: "Horários", value: schedule.scheduleTimes?.length ? schedule.scheduleTimes.join(", ") : "Nenhum horário" },
            { label: "Próxima publicação", value: nextScheduled?.scheduledAt ? format(new Date(nextScheduled.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Não agendada" },
            { label: "Narrativas/dia", value: campaign.trendsPerDay },
            { label: "Posts/dia", value: campaign.postsPerDay },
            { label: "Criada em", value: format(new Date(campaign.createdAt), "dd/MM/yyyy", { locale: ptBR }) },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <dt className="text-zinc-600">{item.label}:</dt>
              <dd className="text-zinc-400">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
