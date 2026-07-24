"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Unplug } from "lucide-react";

export function DisconnectThreadsButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function disconnect() {
    if (!window.confirm("Desconectar este perfil do Threads?")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/threads/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao desconectar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao desconectar");
    } finally { setLoading(false); }
  }
  return <div className="text-right"><Button size="sm" variant="outline" onClick={() => void disconnect()} disabled={loading}>{loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}Desconectar</Button>{error && <p className="mt-1 text-xs text-red-400">{error}</p>}</div>;
}
