"use client";

import { useState } from "react";
import { Cpu, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
};

export function LlmConfigSection({ initialConfig }: { initialConfig: LlmConfigData }) {
  const [provider, setProvider] = useState(initialConfig.provider || "simulated");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(initialConfig.model || "");
  const [baseUrl, setBaseUrl] = useState(initialConfig.baseUrl || "");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = PROVIDER_META[provider] ?? PROVIDER_META.simulated;
  const isSimulated = provider === "simulated";

  async function handleSave() {
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
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-violet-400" />
          <CardTitle className="text-base">Narrative Engine — IA</CardTitle>
        </div>
        <CardDescription>
          Configure qual LLM a Entidade usa para gerar narrativas. Sem configuração, usa o motor narrativo interno.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Provedor de IA</Label>
          <Select value={provider} onValueChange={(v) => { setProvider(v); setModel(""); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROVIDER_META).map(([key, m]) => (
                <SelectItem key={key} value={key}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isSimulated && (
          <>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={`${meta.placeholder || "Sua API key"} (deixe em branco para manter a atual)`}
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
                A chave é armazenada no servidor. Não é exibida após salvar.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Modelo</Label>
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
                <Label>Base URL (opcional)</Label>
                <Input
                  placeholder={provider === "openai" ? "https://api.openai.com/v1" : "https://openrouter.ai/api/v1"}
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        {isSimulated && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="text-xs text-zinc-400">
              O motor narrativo interno gera histórias usando templates avançados em português do Brasil.
              Para habilitar geração com LLM real, selecione um provedor acima e insira sua API key.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Salvando...</>
            ) : (
              "Salvar configuração"
            )}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Salvo com sucesso
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
