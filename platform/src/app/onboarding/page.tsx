"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Check } from "lucide-react";
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

const NICHES = [
  "Moda e Beleza",
  "Saúde e Bem-estar",
  "Tecnologia e Gadgets",
  "Casa e Decoração",
  "Fitness e Esporte",
  "Culinária e Alimentos",
  "Viagem e Turismo",
  "Finanças Pessoais",
  "Educação e Cursos",
  "Outros",
];

const NETWORKS = ["Threads", "X (Twitter)", "Instagram", "TikTok"];

const steps = [
  { id: 1, title: "Seu nicho", description: "Em qual nicho você atua como afiliado?" },
  { id: 2, title: "Rede social", description: "Qual rede social você quer usar primeiro?" },
  { id: 3, title: "Tudo certo!", description: "Sua conta está configurada." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [network, setNetwork] = useState("");

  async function handleFinish() {
    const finalNiche = niche === "Outros" ? customNiche : niche;
    await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche: finalNiche, preferredNetwork: network }),
    }).catch(() => {});
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all ${
                    step > s.id
                      ? "border-violet-600 bg-violet-600 text-white"
                      : step === s.id
                      ? "border-violet-500 bg-zinc-950 text-violet-400"
                      : "border-zinc-700 bg-zinc-950 text-zinc-600"
                  }`}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`mx-2 h-px w-16 transition-all ${
                      step > s.id ? "bg-violet-600" : "bg-zinc-800"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-100">
              Grok Platform
            </span>
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">
            {steps[step - 1].title}
          </h2>
          <p className="text-sm text-zinc-400">
            {steps[step - 1].description}
          </p>
        </div>

        {/* Steps */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nicho principal</Label>
                <Select value={niche} onValueChange={setNiche}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {NICHES.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {niche === "Outros" && (
                <div className="space-y-2">
                  <Label>Descreva seu nicho</Label>
                  <Input
                    placeholder="Ex: Suplementos, Games..."
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                  />
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!niche || (niche === "Outros" && !customNiche)}
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {NETWORKS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNetwork(n)}
                    className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                      network === n
                        ? "border-violet-500 bg-violet-600/10 text-violet-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                Todas as redes funcionam em modo simulado inicialmente.
              </p>
              <Button
                className="w-full"
                onClick={() => setStep(3)}
                disabled={!network}
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-600/20 border border-emerald-600/30">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-zinc-300 text-sm">
                  Nicho: <span className="text-zinc-100 font-medium">{niche === "Outros" ? customNiche : niche}</span>
                </p>
                <p className="text-zinc-300 text-sm">
                  Rede: <span className="text-zinc-100 font-medium">{network}</span>
                </p>
              </div>
              <p className="text-xs text-zinc-500">
                Você pode alterar essas configurações a qualquer momento em Configurações.
              </p>
              <Button className="w-full" onClick={handleFinish}>
                Ir para o Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
