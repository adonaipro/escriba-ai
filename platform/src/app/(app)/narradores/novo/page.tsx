"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NarradorNovoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<"male" | "female" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; id: string; sex: string } | null>(null);

  async function create(sex: "male" | "female") {
    setLoading(sex);
    setError(null);
    try {
      const res = await fetch("/api/narradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sex }),
      });
      const data = (await res.json()) as {
        narrator?: { id: string; name: string; sex: string };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar narrador");
      if (data.narrator) {
        setDone({
          id: data.narrator.id,
          name: data.narrator.name,
          sex: data.narrator.sex,
        });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  }

  if (done) {
    const label = done.sex === "male" ? "Homem" : "Mulher";
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/40 border border-emerald-800/40 mx-auto">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">Narrador {label} pronto</h2>
          <p className="text-sm text-zinc-400">
            Disponível para campanhas e Laboratório. Apenas o sexo é usado na geração.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" asChild>
              <Link href="/narradores">Ver narradores</Link>
            </Button>
            <Button asChild>
              <Link href="/laboratorio">Abrir Laboratório</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      <Link href="/narradores" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
        <ArrowLeft className="h-3 w-3" /> Narradores
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Novo narrador</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Escolha apenas o sexo. Isso define pronomes e coerência de relacionamentos nas histórias.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800/40 bg-red-950/20 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          size="lg"
          className="h-24 text-base"
          disabled={!!loading}
          onClick={() => void create("female")}
        >
          {loading === "female" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Mulher"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-24 text-base"
          disabled={!!loading}
          onClick={() => void create("male")}
        >
          {loading === "male" ? <Loader2 className="h-5 w-5 animate-spin" /> : "Homem"}
        </Button>
      </div>
      <p className="text-xs text-zinc-600 text-center">
        Já existe um narrador ativo do mesmo sexo? Ele será reutilizado.
      </p>
    </div>
  );
}
