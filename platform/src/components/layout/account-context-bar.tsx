interface Props {
  account: {
    id: string;
    network: string;
    username: string | null;
    displayName: string | null;
    activeNarrator?: { id: string; name: string } | null;
  } | null;
}

function NetworkChip({ network }: { network: string }) {
  if (network === "threads") {
    return (
      <span className="inline-flex items-center justify-center rounded border border-blue-600/30 bg-blue-600/20 px-1.5 py-0.5 text-[10px] font-bold leading-none text-blue-400">
        T
      </span>
    );
  }
  if (network === "x") {
    return (
      <span className="inline-flex items-center justify-center rounded border border-zinc-600/50 bg-zinc-700/50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-zinc-200">
        X
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center rounded border border-zinc-600/50 bg-zinc-700/50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-zinc-400">
      {network.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AccountContextBar({ account }: Props) {
  if (!account) return null;

  return (
    <div className="flex items-center gap-3 border-b border-zinc-800/50 bg-zinc-950/80 px-6 py-2">
      <span className="text-xs text-zinc-300">
        @{account.username ?? account.displayName ?? "conta"}
      </span>
      <span className="text-xs text-zinc-700">|</span>
      <NetworkChip network={account.network} />
    </div>
  );
}
