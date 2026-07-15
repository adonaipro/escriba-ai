"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

interface Props {
  narrators: Array<{ id: string; name: string }>;
}

export function ConnectAccountForm({ narrators }: Props) {
  const router = useRouter();
  const [network, setNetwork] = useState<"threads" | "x">("threads");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [narratorId, setNarratorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/social-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network,
          username: username.replace(/^@/, "").trim(),
          displayName: displayName.trim() || undefined,
          narratorId: narratorId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao conectar conta.");
        return;
      }

      setSuccess(true);
      setUsername("");
      setDisplayName("");
      setNarratorId("");
      router.refresh();
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-400">Conta conectada com sucesso!</p>
            <Button variant="ghost" size="sm" onClick={() => setSuccess(false)}>
              Conectar outra
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Network selector */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2">Rede social</label>
            <div className="flex gap-2">
              {(["threads", "x"] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNetwork(n)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    network === n
                      ? "border-violet-600 bg-violet-600/10 text-violet-400"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {n === "threads" ? "Threads" : "X (Twitter)"}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              @ Usuário <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuário (sem @)"
              required
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600/50"
            />
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Nome de exibição <span className="text-zinc-600">(opcional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Casa Real, Moda Atual…"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600/50"
            />
          </div>

          {/* Narrator */}
          {narrators.length > 0 && (
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                Narrador ativo <span className="text-zinc-600">(opcional)</span>
              </label>
              <select
                value={narratorId}
                onChange={(e) => setNarratorId(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600/50"
              >
                <option value="">Sem narrador (vincular depois)</option>
                {narrators.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading || !username.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Conectar conta [SIMULADO]
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
