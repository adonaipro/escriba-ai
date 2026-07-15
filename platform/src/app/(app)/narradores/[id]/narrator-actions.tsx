"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  narratorId: string;
  currentStatus: string;
}

export function NarratorActions({ narratorId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleStatusChange(newStatus: "active" | "paused") {
    setLoading("status");
    try {
      const res = await fetch(`/api/narradores/${narratorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  async function handleDuplicate() {
    setLoading("duplicate");
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/narradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateFrom: narratorId }),
      });
      if (!res.ok) throw new Error("Falha ao duplicar narrador");
      setSuccessMessage("Narrador duplicado com sucesso.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {successMessage && (
        <span className="text-xs text-emerald-400 mr-1">{successMessage}</span>
      )}

      {currentStatus === "active" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleStatusChange("paused")}
        >
          <Pause className="h-3.5 w-3.5" />
          {loading === "status" ? "Pausando…" : "Pausar"}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleStatusChange("active")}
        >
          <Play className="h-3.5 w-3.5" />
          {loading === "status" ? "Ativando…" : "Ativar"}
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={loading !== null}
        onClick={handleDuplicate}
      >
        <Copy className="h-3.5 w-3.5" />
        {loading === "duplicate" ? "Duplicando…" : "Duplicar"}
      </Button>
    </div>
  );
}
