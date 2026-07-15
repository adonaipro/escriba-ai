"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccountNarrator {
  id: string;
  isActive: boolean;
  socialAccountId: string;
  socialAccount: { id: string; network: string; username: string | null };
}

interface AvailableAccount {
  id: string;
  network: string;
  username: string | null;
  displayName: string | null;
}

interface Props {
  narratorId: string;
  accountNarrators: AccountNarrator[];
  availableAccounts: AvailableAccount[];
}

export function AccountNarratorActions({
  narratorId,
  accountNarrators,
  availableAccounts,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const linkedAccountIds = new Set(accountNarrators.map((an) => an.socialAccountId));
  const unlinkedAccounts = availableAccounts.filter((a) => !linkedAccountIds.has(a.id));

  async function handleUnlink(accountNarratorId: string) {
    setLoading(`unlink-${accountNarratorId}`);
    try {
      const res = await fetch(`/api/account-narrators/${accountNarratorId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao desvincular conta");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  async function handleReactivate(accountNarratorId: string) {
    setLoading(`reactivate-${accountNarratorId}`);
    try {
      const res = await fetch(`/api/account-narrators/${accountNarratorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error("Falha ao reativar conta");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  async function handleLink() {
    if (!selectedAccountId) return;
    setLoading("link");
    try {
      const res = await fetch(`/api/narradores/${narratorId}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialAccountId: selectedAccountId }),
      });
      if (!res.ok) throw new Error("Falha ao vincular conta");
      setSelectedAccountId("");
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      {accountNarrators.length === 0 && (
        <p className="text-xs text-zinc-600 py-2">Nenhuma conta vinculada ainda.</p>
      )}

      {accountNarrators.map((an) => {
        const isRowLoading =
          loading === `unlink-${an.id}` || loading === `reactivate-${an.id}`;

        return (
          <div
            key={an.id}
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-2.5",
              an.isActive
                ? "border-emerald-800/30 bg-emerald-950/10"
                : "border-zinc-800/40 bg-zinc-900/30 opacity-70"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  an.isActive
                    ? "bg-emerald-900/40 text-emerald-400"
                    : "bg-zinc-800 text-zinc-500"
                )}
              >
                {an.socialAccount.network[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-200 capitalize">
                    {an.socialAccount.network}
                  </span>
                  {an.socialAccount.username && (
                    <span className="text-[10px] text-zinc-500">
                      @{an.socialAccount.username}
                    </span>
                  )}
                  {an.isActive && (
                    <span className="text-[9px] px-1.5 py-0 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                      ativo
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {an.isActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRowLoading || loading !== null}
                  onClick={() => handleUnlink(an.id)}
                  className="text-red-400 border-red-900/40 hover:bg-red-950/20 hover:text-red-300"
                >
                  {loading === `unlink-${an.id}` ? "Desvinculando…" : "Desvincular"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isRowLoading || loading !== null}
                  onClick={() => handleReactivate(an.id)}
                >
                  {loading === `reactivate-${an.id}` ? "Reativando…" : "Reativar"}
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {unlinkedAccounts.length > 0 && (
        <div className="flex items-center gap-2 pt-3 mt-1 border-t border-zinc-800/40">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={loading !== null}
            className="flex-1 min-w-0 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50"
          >
            <option value="">Selecionar conta…</option>
            {unlinkedAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.network}
                {acc.username ? ` · @${acc.username}` : ""}
                {acc.displayName ? ` (${acc.displayName})` : ""}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedAccountId || loading !== null}
            onClick={handleLink}
            className="shrink-0"
          >
            {loading === "link" ? "Vinculando…" : "Vincular conta"}
          </Button>
        </div>
      )}
    </div>
  );
}
