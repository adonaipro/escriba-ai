import Link from "next/link";

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

export function AccountContextBar({ account }: Props) {
  if (!account) return null;

  return (
    <div className="flex items-center gap-3 border-b border-zinc-800/50 bg-zinc-950/80 px-6 py-2">
      {/* Active account username */}
      <span className="text-xs text-zinc-300">
        @{account.username ?? account.displayName ?? "conta"}
      </span>

      <span className="text-xs text-zinc-700">|</span>

      {/* Network pill */}
      <NetworkChip network={account.network} />

      <span className="text-xs text-zinc-700">|</span>

      {/* Active narrator or link to connect one */}
      {account.activeNarrator ? (
        <span className="text-xs text-zinc-500">
          Narrador ativo:{" "}
          <Link href={`/narradores/${account.activeNarrator.id}`} className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
            {account.activeNarrator.name}
          </Link>
        </span>
      ) : (
        <span className="text-xs text-zinc-500">
          Nenhum Narrador ativo —{" "}
          <Link
            href="/narradores"
            className="text-violet-400 underline underline-offset-2 transition-colors hover:text-violet-300"
          >
            Vincular Narrador
          </Link>
        </span>
      )}
    </div>
  );
}
