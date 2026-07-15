"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Plus, ChevronDown, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  accounts: Array<{
    id: string;
    network: string;
    username: string | null;
    displayName: string | null;
    status: string;
    isMock: boolean;
    activeNarrator?: { id: string; name: string } | null;
  }>;
  selectedAccountId: string | null;
}

function NetworkChip({ network }: { network: string }) {
  if (network === "threads") {
    return (
      <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none bg-blue-600/20 text-blue-400 border border-blue-600/30">
        T
      </span>
    );
  }
  if (network === "x") {
    return (
      <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none bg-zinc-700/50 text-zinc-200 border border-zinc-600/50">
        X
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold leading-none bg-zinc-700/50 text-zinc-400 border border-zinc-600/50">
      {network.slice(0, 1).toUpperCase()}
    </span>
  );
}

function getAvatarLetters(
  displayName: string | null,
  username: string | null
): string {
  const source = displayName || username || "?";
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AccountSelector({ accounts, selectedAccountId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;

  // Close dropdown when clicking outside the component
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  async function handleSelect(accountId: string) {
    if (accountId === selectedAccountId || loading) return;
    setLoading(true);
    try {
      await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left transition-colors hover:bg-zinc-800",
          loading && "cursor-not-allowed opacity-60"
        )}
      >
        {/* Avatar circle */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-xs font-semibold text-violet-300">
          {selectedAccount
            ? getAvatarLetters(
                selectedAccount.displayName,
                selectedAccount.username
              )
            : "?"}
        </span>

        {/* Username */}
        <span className="flex-1 truncate text-xs text-zinc-300">
          {selectedAccount
            ? `@${selectedAccount.username ?? selectedAccount.displayName ?? "conta"}`
            : "Sem conta"}
        </span>

        {/* Network chip */}
        {selectedAccount && <NetworkChip network={selectedAccount.network} />}

        {/* Chevron or spinner */}
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-500" />
        ) : (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl">
          {/* Account list */}
          {accounts.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">
              Nenhuma conta conectada
            </p>
          ) : (
            accounts.map((account) => {
              const isSelected = account.id === selectedAccountId;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleSelect(account.id)}
                  disabled={loading}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-zinc-800",
                    isSelected && "bg-zinc-800/50"
                  )}
                >
                  {/* Network chip */}
                  <NetworkChip network={account.network} />

                  {/* Labels */}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-xs font-medium text-zinc-200">
                      @{account.username ?? account.displayName ?? "conta"}
                    </span>
                    {account.displayName && (
                      <span className="truncate text-[10px] text-zinc-500">
                        {account.displayName}
                      </span>
                    )}
                  </span>

                  {/* Checkmark for selected */}
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                  )}
                </button>
              );
            })
          )}

          {/* Divider */}
          <div className="my-1 border-t border-zinc-800" />

          {/* Fixed links */}
          <Link
            href="/workspace"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            Visão geral do Workspace
          </Link>

          <Link
            href="/integracoes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            Conectar nova conta
          </Link>
        </div>
      )}
    </div>
  );
}
