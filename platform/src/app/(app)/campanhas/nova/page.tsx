"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
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

const schema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  productUrl: z.string().url("URL inválida"),
  productName: z.string().min(2, "Nome do produto obrigatório"),
  marketplace: z.string().min(1, "Selecione o marketplace"),
  targetNetwork: z.string().min(1, "Selecione uma rede"),
  objective: z.string().min(1, "Selecione o objetivo"),
  language: z.string().min(1),
  aiModel: z.string().min(1),
  approvalMode: z.string().min(1),
  trendsPerDay: z.number().int().min(1).max(10),
  postsPerDay: z.number().int().min(0).max(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type GenerationState = {
  jobId: string;
  campaignId: string;
  status: string;
  statusLabel: string;
  progress: number;
  error?: string;
};

const STEPS = [
  { label: "Analisando produto", minProgress: 0 },
  { label: "Planejando narrativa", minProgress: 25 },
  { label: "Gerando história", minProgress: 50 },
  { label: "Salvando narrativa", minProgress: 70 },
  { label: "Registrando padrões", minProgress: 85 },
];

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
              completed ? "bg-emerald-600/15" : failed ? "bg-red-600/15" : "bg-violet-600/15"
            }`}>
              {completed ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              ) : failed ? (
                <XCircle className="h-8 w-8 text-red-400" />
              ) : (
                <Sparkles className="h-8 w-8 text-violet-400 animate-pulse" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {completed
                  ? "Narrativa gerada"
                  : failed
                    ? "Falha na geração"
                    : "A Entidade está trabalhando"}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {completed
                  ? "Redirecionando para a campanha..."
                  : failed
                    ? (state.error ?? "Ocorreu um erro. Tente novamente.")
                    : state.statusLabel}
              </p>
            </div>

            {!failed && (
              <div className="w-full space-y-3">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{state.statusLabel}</span>
                  <span>{state.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      completed ? "bg-emerald-500" : "bg-violet-500"
                    }`}
                    style={{ width: `${state.progress}%` }}
                  />
                </div>

                <div className="flex flex-col gap-1.5 pt-2">
                  {STEPS.map((step) => {
                    const done = state.progress > step.minProgress + 20;
                    const active = state.progress >= step.minProgress && !done;
                    return (
                      <div key={step.label} className="flex items-center gap-2">
                        <div
                          className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                            done
                              ? "bg-emerald-500"
                              : active
                                ? "bg-violet-400 animate-pulse"
                                : "bg-zinc-700"
                          }`}
                        />
                        <span
                          className={`text-xs transition-colors ${
                            done
                              ? "text-emerald-400"
                              : active
                                ? "text-zinc-200"
                                : "text-zinc-600"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {failed && (
              <Button
                variant="outline"
                onClick={() => router.push(`/campanhas/${state.campaignId}`)}
              >
                Ver campanha mesmo assim
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NovaCampanhaPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generation, setGeneration] = useState<GenerationState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function pollJob(jobId: string, campaignId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/generation-jobs/${jobId}`);
        if (!res.ok) return;
        const { job } = await res.json() as {
          job: { status: string; statusLabel: string; progress: number; error?: string };
        };

        setGeneration({
          jobId,
          campaignId,
          status: job.status,
          statusLabel: job.statusLabel,
          progress: job.progress,
          error: job.error,
        });

        if (job.status === "completed" || job.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // polling errors are silent
      }
    }, 1500);
  }

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      marketplace: "shopee",
      objective: "sales",
      language: "pt-BR",
      aiModel: "simulated",
      approvalMode: "manual",
      trendsPerDay: 2,
      postsPerDay: 7,
    },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { campaign?: { id: string }; jobId?: string; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erro ao criar campanha.");
      } else if (json.campaign && json.jobId) {
        setGeneration({
          jobId: json.jobId,
          campaignId: json.campaign.id,
          status: "pending",
          statusLabel: "Iniciando...",
          progress: 5,
        });
        await pollJob(json.jobId, json.campaign.id);
      } else {
        router.push(`/campanhas/${json.campaign?.id}`);
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  if (generation) {
    return <GenerationProgress state={generation} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/campanhas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
        {/* Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produto</CardTitle>
            <CardDescription>O produto que você vai promover como afiliado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da campanha</Label>
              <Input id="name" placeholder="Ex: Tênis Runner Pro — Shopee" {...register("name")} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nome do produto</Label>
                <Input id="productName" placeholder="Ex: Tênis Runner Pro" {...register("productName")} />
                {errors.productName && <p className="text-xs text-red-400">{errors.productName.message}</p>}
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

            <div className="space-y-2">
              <Label htmlFor="productUrl">Link de afiliado</Label>
              <Input id="productUrl" type="url" placeholder="https://shopee.com.br/..." {...register("productUrl")} />
              {errors.productUrl && <p className="text-xs text-red-400">{errors.productUrl.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição</CardTitle>
            <CardDescription>Onde e como as Trends serão publicadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rede social</Label>
                <Select onValueChange={(v) => setValue("targetNetwork", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="threads">Threads [Simulado]</SelectItem>
                    <SelectItem value="x">X (Twitter) [Simulado]</SelectItem>
                    <SelectItem value="instagram">Instagram [Simulado]</SelectItem>
                    <SelectItem value="linkedin">LinkedIn [Simulado]</SelectItem>
                    <SelectItem value="tiktok">TikTok [Simulado]</SelectItem>
                  </SelectContent>
                </Select>
                {errors.targetNetwork && <p className="text-xs text-red-400">{errors.targetNetwork.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Select defaultValue="sales" onValueChange={(v) => setValue("objective", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Vendas diretas</SelectItem>
                    <SelectItem value="leads">Geração de leads</SelectItem>
                    <SelectItem value="awareness">Reconhecimento</SelectItem>
                    <SelectItem value="engagement">Engajamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Modelo de IA</Label>
                <Select defaultValue="simulated" onValueChange={(v) => setValue("aiModel", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simulated">Simulado (padrão)</SelectItem>
                    <SelectItem value="llm">Configuração de LLM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadência</CardTitle>
            <CardDescription>Quantas Trends e posts por dia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trendsPerDay">Trends por dia</Label>
                <Input id="trendsPerDay" type="number" min={1} max={10} {...register("trendsPerDay", { valueAsNumber: true })} />
                <p className="text-xs text-zinc-500">Quantas threads novas gerar por dia</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postsPerDay">Posts por dia</Label>
                <Input id="postsPerDay" type="number" min={0} max={20} {...register("postsPerDay", { valueAsNumber: true })} />
                <p className="text-xs text-zinc-500">Total de posts publicados diariamente</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de início</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de encerramento</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aprovação das Trends</Label>
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

        <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-3">
          <p className="text-xs text-amber-400">
            Todas as redes sociais operam em <strong>modo simulado</strong>. Nenhuma publicação real será feita.
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href="/campanhas">Cancelar</Link>
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando...</>
            ) : (
              "Criar campanha"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
