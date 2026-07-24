"use client";

import { useState } from "react";
import { Cpu, Eye, EyeOff, CheckCircle2, Loader2, ChevronDown, ChevronUp, Zap, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVIDER_META } from "@/lib/llm";

type LlmConfigData = {
  provider: string;
  model: string;
  baseUrl: string;
  hasByok: boolean;
};

const VISIBLE_PROVIDERS = Object.entries(PROVIDER_META).filter(([key]) => key !== "simulated");

export function LlmConfigSection({ initialConfig }: { initialConfig: LlmConfigData }) {
  const [hasByok, setHasByok] = useState(initialConfig.hasByok);
  const [open, setOpen] = useState(false);

  const defaultProvider = initialConfig.provider && initialConfig.provider !== "simulated"
    ? initialConfig.provider
    : "groq";
  const [provider, setProvider] = useState(defaultProvider);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(initialConfig.model || "");
  const [baseUrl, setBaseUrl] = useState(initialConfig.baseUrl || "");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = PROVIDER_META[provider] ?? PROVIDER_META.groq;

  async function handleSave() {
    if (!apiKey.trim()) {
      setError("Insira uma API key para conectar sua infraestrutura.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/llm-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, model, baseUrl }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Erro ao salvar.");
      } else {
        setSaved(true);
        setApiKey("");
        setHasByok(true);
        setOpen(false);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch("/api/llm-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "groq", apiKey: "", model: "", baseUrl: "" }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Erro ao remover.");
      } else {
        setHasByok(false);
        setApiKey("");
        setOpen(false);
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-pink-400" />
            <CardTitle className="text-base">Motor Narrativo</CardTitle>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/30 border border-emerald-800/30 px-2.5 py-1 rounded-full">
            <Zap className="h-3 w-3" />
            Escriba AI — Ativo
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 px-4 py-3">
          <p className="text-sm text-zinc-300">
            {hasByok
              ? "Gerando com sua infraestrutura própria conectada."
              : "A Inteligência Narrativa Escriba está ativa e inclusa no seu plano. Nenhuma configuração necessária."}
          </p>
          {hasByok && (
            <p className="text-xs text-zinc-500 mt-1">
              Usando chave API própria · {provider}
            </p>
          )}
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
        >
          <span className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            {hasByok
              ? "Infraestrutura própria conectada"
              : "Conectar infraestrutura própria (recurso avançado)"}
          </span>
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {open && (
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            {hasByok ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Sua infraestrutura própria está conectada. Remova para voltar a usar o plano Escriba.
                </p>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <Button
                  onClick={handleRemove}
                  disabled={removing}
                  variant="outline"
                  size="sm"
                  className="border-red-800/40 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                >
                  {removing ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Removendo...</>
                  ) : (
                    "Remover e usar plano Escriba"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-500">
                  Conecte sua própria chave de API para usar sua infraestrutura no lugar da Escriba.
                </p>

                <div className="space-y-2">
                  <Label className="text-xs">Provedor</Label>
                  <Select value={provider} onValueChange={(v) => { setProvider(v); setModel(""); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBLE_PROVIDERS.map(([key, m]) => (
                        <SelectItem key={key} value={key}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {meta.helpUrl && (
                    <p className="text-xs text-zinc-500">
                      <a
                        href={meta.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-400 hover:text-pink-300 underline underline-offset-2"
                      >
                        Obter chave gratuitamente
                      </a>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">API Key</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      placeholder={meta.placeholder || "Sua API key"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Armazenada com segurança. Não exibida após salvar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Modelo</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {meta.models.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(provider === "openrouter" || provider === "openai") && (
                  <div className="space-y-2">
                    <Label className="text-xs">Base URL (opcional)</Label>
                    <Input
                      placeholder={
                        provider === "openai"
                          ? "https://api.openai.com/v1"
                          : "https://openrouter.ai/api/v1"
                      }
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                    />
                  </div>
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex items-center gap-3">
                  <Button onClick={handleSave} disabled={saving} size="sm">
                    {saving ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Salvando...</>
                    ) : (
                      "Conectar infraestrutura própria"
                    )}
                  </Button>
                  {saved && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Conectado com sucesso
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
