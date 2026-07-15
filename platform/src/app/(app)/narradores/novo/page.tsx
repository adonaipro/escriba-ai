"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────
// Quiz definition
// ─────────────────────────────────────────────────────────────────

interface QuizStep {
  key: string;
  question: string;
  options: Array<{ value: string; label: string; description?: string }>;
}

const STEPS: QuizStep[] = [
  {
    key: "sex",
    question: "Qual é o sexo deste Narrador?",
    options: [
      { value: "female", label: "Mulher" },
      { value: "male", label: "Homem" },
    ],
  },
  {
    key: "ageRange",
    question: "Qual é a faixa etária?",
    options: [
      { value: "18-25", label: "18–25 anos", description: "jovem adulta" },
      { value: "26-35", label: "26–35 anos", description: "adulta" },
      { value: "36-45", label: "36–45 anos", description: "meia-idade" },
      { value: "46+",   label: "46+ anos",   description: "madura" },
    ],
  },
  {
    key: "maritalStatus",
    question: "Qual é o estado civil?",
    options: [
      { value: "single",   label: "Solteira/o" },
      { value: "dating",   label: "Namorando" },
      { value: "married",  label: "Casada/o" },
      { value: "divorced", label: "Divorciada/o" },
    ],
  },
  {
    key: "hasChildren",
    question: "Tem filhos?",
    options: [
      { value: "true",  label: "Sim" },
      { value: "false", label: "Não" },
    ],
  },
  {
    key: "livesAlone",
    question: "Mora sozinha/o?",
    options: [
      { value: "true",  label: "Sim" },
      { value: "false", label: "Não" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Quiz UI
// ─────────────────────────────────────────────────────────────────

type Answers = Record<string, string>;

export default function NarradorNovoPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; id: string } | null>(null);

  const current = STEPS[step];
  const selected = answers[current.key];
  const progress = ((step) / STEPS.length) * 100;

  function selectOption(value: string) {
    setAnswers((prev) => ({ ...prev, [current.key]: value }));
  }

  function next() {
    if (!selected) return;
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      void submit();
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        sex: answers.sex,
        ageRange: answers.ageRange,
        maritalStatus: answers.maritalStatus,
        hasChildren: answers.hasChildren === "true",
        livesAlone: answers.livesAlone === "true",
      };

      const res = await fetch("/api/narradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as { narrator?: { id: string; name: string }; error?: string };

      if (!res.ok) throw new Error(data.error ?? "Erro ao criar narrador");

      if (data.narrator) {
        setCreated({ name: data.narrator.name, id: data.narrator.id });
      }
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  // Success screen
  if (created) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/40 border border-emerald-800/40 mx-auto mb-6">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">{created.name} foi criada</h2>
          <p className="text-sm text-zinc-400 mb-2">
            A IA gerou automaticamente os experimentos iniciais.
          </p>
          <p className="text-xs text-zinc-600 mb-8">
            Tom · Ritmo · Estratégia de Produto · Pergunta Final · Tipo de Conflito · Abertura · Estrutura
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href={`/narradores/${created.id}`}>Ver {created.name}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/narradores">Voltar para Narradores</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Back */}
      <Link
        href="/narradores"
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Narradores
      </Link>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-600">
            {step + 1} de {STEPS.length}
          </span>
          <span className="text-xs text-zinc-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-300"
            style={{ width: `${((step + (selected ? 1 : 0)) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">{current.question}</h2>
        <p className="text-xs text-zinc-600">
          Essas respostas definem a identidade do Narrador. Tom, personalidade e estilo serão descobertos pela IA.
        </p>
      </div>

      {/* Options */}
      <div className={`grid gap-3 mb-8 ${current.options.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {current.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => selectOption(opt.value)}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              selected === opt.value
                ? "border-violet-500 bg-violet-950/30 text-zinc-100"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{opt.label}</p>
                {opt.description && (
                  <p className="text-[11px] text-zinc-500 mt-0.5">{opt.description}</p>
                )}
              </div>
              {selected === opt.value && (
                <div className="h-4 w-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-800/40 bg-red-950/20 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={back}
          disabled={step === 0}
          className="text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Button
          onClick={next}
          disabled={!selected || loading}
          className="text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : step === STEPS.length - 1 ? (
            <>
              Criar Narrador
              <Check className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Note */}
      <p className="text-center text-xs text-zinc-700 mt-8">
        Não existe resposta certa. A IA aprende a partir dos resultados — não das suas suposições.
      </p>
    </div>
  );
}
