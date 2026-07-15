import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CheckCircle, XCircle, AlertCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ConnectAccountForm } from "./connect-account-form";

async function getAccounts(profileId: string) {
  const [socialAccounts, marketplaceAccounts, narrators] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { profileId, status: "active" },
      include: {
        accountNarrators: {
          where: { isActive: true },
          include: {
            narrator: { select: { id: true, name: true, sex: true, ageRange: true } },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.marketplaceAccount.findMany({ where: { profileId } }),
    prisma.narrator.findMany({
      where: { profileId, status: "active" },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return { socialAccounts, marketplaceAccounts, narrators };
}

const MARKETPLACES = [
  {
    id: "shopee",
    name: "Shopee",
    description: "Marketplace principal — tracking de cliques e conversões",
    available: true,
    mock: true,
  },
  {
    id: "amazon",
    name: "Amazon Associates",
    description: "Amazon Brasil — desabilitado no MVP (DECISIONS #080)",
    available: false,
    mock: false,
    reason: "Desabilitado — aguardando onboarding simplificado",
  },
  {
    id: "mercadolivre",
    name: "MercadoLivre",
    description: "MercadoLivre Afiliados — desabilitado no MVP (DECISIONS #080)",
    available: false,
    mock: false,
    reason: "Desabilitado — aguardando integração com ML API",
  },
];

export default async function IntegracoesPage() {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const { socialAccounts, marketplaceAccounts, narrators } = await getAccounts(
    session.user.profile.id
  );

  function getMarketplaceStatus(marketplaceId: string) {
    return marketplaceAccounts.find((a) => a.marketplace === marketplaceId);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Integrações</h1>
        <p className="text-sm text-zinc-400">
          Conecte suas redes sociais e marketplaces para ativar a publicação automática
        </p>
      </div>

      {/* Simulated notice */}
      <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Modo de desenvolvimento</p>
            <p className="text-xs text-amber-500 mt-0.5">
              Todas as integrações marcadas como <strong>[SIMULADO]</strong> operam com
              dados mock. Nenhuma publicação ou transação real é realizada. OAuth e chaves
              de API reais serão necessários na versão de produção.
            </p>
          </div>
        </div>
      </div>

      {/* Connected accounts list */}
      {socialAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Contas conectadas</h2>
          <div className="space-y-3">
            {socialAccounts.map((account) => {
              const activeNarrator = account.accountNarrators?.[0]?.narrator ?? null;
              return (
                <Card key={account.id}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-300">
                          {account.network === "threads" ? "T" : "X"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-zinc-100">
                              @{account.username}
                            </h3>
                            <Badge variant="warning" className="text-xs">SIMULADO</Badge>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {account.network}
                            </Badge>
                          </div>
                          {account.displayName && (
                            <p className="text-xs text-zinc-500 mt-0.5">{account.displayName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 shrink-0">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Conectado</span>
                      </div>
                    </div>

                    {/* Narrator section */}
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <span className="text-xs text-zinc-400 font-medium">Narrador ativo</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-zinc-500" asChild>
                          <Link href="/narradores">Gerenciar Narradores</Link>
                        </Button>
                      </div>

                      {activeNarrator ? (
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-violet-800/20 bg-violet-950/10 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-violet-900/40 flex items-center justify-center text-[10px] font-bold text-violet-400">
                              {activeNarrator.name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-zinc-200">{activeNarrator.name}</p>
                              <p className="text-[10px] text-zinc-600">
                                {activeNarrator.sex === "female" ? "Feminino" : "Masculino"} · {activeNarrator.ageRange} anos
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/narradores/${activeNarrator.id}`}
                            className="text-[10px] text-violet-400 hover:text-violet-300 underline underline-offset-2"
                          >
                            Ver perfil
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-2 rounded-lg border border-zinc-800/40 bg-zinc-900/30 px-3 py-2">
                          <p className="text-xs text-zinc-600">
                            Nenhum Narrador vinculado —{" "}
                            {narrators.length > 0 ? (
                              <Link href="/narradores" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
                                vincular um Narrador
                              </Link>
                            ) : (
                              <Link href="/narradores/novo" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
                                criar o primeiro Narrador
                              </Link>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Connect new account form */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-1">Conectar nova conta</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Adicione contas de Threads ou X para publicar em múltiplos perfis.
        </p>
        <ConnectAccountForm narrators={narrators} />
      </div>

      <Separator />

      {/* Marketplaces */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Marketplaces</h2>
        <div className="space-y-3">
          {MARKETPLACES.map((mp) => {
            const connected = getMarketplaceStatus(mp.id);
            return (
              <Card key={mp.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-300">
                        {mp.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-zinc-100">{mp.name}</h3>
                          {mp.mock && (
                            <Badge variant="warning" className="text-xs">SIMULADO</Badge>
                          )}
                          {!mp.available && (
                            <Badge variant="outline" className="text-xs">Desabilitado</Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{mp.description}</p>
                        {mp.reason && (
                          <p className="text-xs text-zinc-600 mt-0.5 italic">{mp.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {connected ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Conectado</span>
                        </div>
                      ) : mp.available ? (
                        <Button size="sm" variant="outline">
                          Configurar
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">Indisponível</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
