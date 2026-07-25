import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CheckCircle, XCircle, Users, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { DisconnectThreadsButton } from "./threads-actions";
import { hasShopeeCredentials } from "@/lib/providers/shopee-client";


async function getAccounts(profileId: string) {
  const [socialAccounts, marketplaceAccounts, narrators] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { profileId, status: "active" },
      include: {
        accountNarrators: {
          where: { isActive: true },
          include: {
            narrator: {
              select: {
                id: true,
                name: true,
                sex: true,
              },
            },
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
    mock: false,
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

export default async function IntegracoesPage({ searchParams }: { searchParams: Promise<{ threads_connected?: string; threads_error?: string }> }) {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const { socialAccounts, marketplaceAccounts, narrators } = await getAccounts(
    session.user.profile.id
  );
  const params = await searchParams;
  const shopeeConfigured = hasShopeeCredentials();

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

      {params.threads_connected === "1" && (
        <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">Perfil do Threads conectado e autorizado para publicacao.</div>
      )}
      {params.threads_error && (
        <div className="rounded-lg border border-red-800/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">Nao foi possivel conectar: {params.threads_error}</div>
      )}

      {/* Connected accounts list */}
      {socialAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Contas conectadas</h2>
          <div className="space-y-3">
            {socialAccounts.map((account) => {
              const activeNarrator = account.accountNarrators?.[0]?.narrator ?? null;
              const hasInsightsScope = account.tokenScopes?.split(",").includes("threads_manage_insights") ?? false;
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
                            <Badge variant="secondary" className="text-xs capitalize">
                              {account.network}
                            </Badge>
                          </div>
                          {account.displayName && (
                            <p className="text-xs text-zinc-500 mt-0.5">{account.displayName}</p>
                          )}
                        </div>
                      </div>
                      {!account.isMock && account.accessToken ? (
                        <div className="flex items-center gap-2 shrink-0"><div className={`mr-1 flex items-center gap-2 ${hasInsightsScope ? "text-emerald-400" : "text-amber-400"}`}>{hasInsightsScope ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}<span className="text-xs">{hasInsightsScope ? "Publicação e métricas" : "Reautorize para ativar métricas"}</span></div><Button size="sm" variant="outline" asChild><a href="/api/integrations/threads/connect"><ExternalLink className="h-3.5 w-3.5" />{hasInsightsScope ? "Reautorizar" : "Ativar métricas"}</a></Button><DisconnectThreadsButton accountId={account.id} /></div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-400 shrink-0"><XCircle className="h-4 w-4" /><span className="text-xs">Cadastro local</span></div>
                      )}
                    </div>

                    {/* Narrator section — header and CTA depend on whether an active narrator exists */}
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                      {activeNarrator ? (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                              <span className="text-xs text-zinc-400 font-medium">Narrador ativo</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-zinc-500" asChild>
                              <Link href="/narradores">Gerenciar narradores</Link>
                            </Button>
                          </div>
                          <div className="mt-2 flex items-center justify-between rounded-lg border border-pink-800/20 bg-pink-950/10 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-6 w-6 rounded-full bg-pink-900/40 flex items-center justify-center text-[10px] font-bold text-pink-400 shrink-0">
                                {activeNarrator.name[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-zinc-200 truncate">
                                  {activeNarrator.sex === "male" ? "Homem" : "Mulher"}
                                </p>
                                <p className="text-[10px] text-zinc-600 truncate">
                                  Sexo do narrador (único atributo usado na geração)
                                </p>
                              </div>
                            </div>
                            <Link
                              href={`/narradores/${activeNarrator.id}`}
                              className="text-[10px] text-pink-400 hover:text-pink-300 underline underline-offset-2 shrink-0 ml-2"
                            >
                              Ver perfil
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                              <span className="text-xs text-zinc-400 font-medium">Nenhum narrador vinculado</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-pink-400" asChild>
                              <Link href={narrators.length > 0 ? "/narradores" : "/narradores/novo"}>
                                Vincular narrador
                              </Link>
                            </Button>
                          </div>
                          <div className="mt-2 rounded-lg border border-zinc-800/40 bg-zinc-900/30 px-3 py-2">
                            <p className="text-xs text-zinc-500">
                              Esta conta ainda não possui narrador vinculado. Vincule um narrador para gerar narrativas com identidade consistente.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Threads OAuth */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-1">Conectar nova conta</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Adicione contas de Threads ou X para publicar em múltiplos perfis.
        </p>
        <Card><CardContent className="p-5 flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-zinc-100">Threads</p><p className="text-xs text-zinc-500 mt-1">Autorize seu perfil pela API oficial da Meta.</p></div><Button asChild><a href="/api/integrations/threads/connect"><ExternalLink className="h-4 w-4" />Conectar com Threads</a></Button></CardContent></Card>
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
                      {connected || (mp.id === "shopee" && shopeeConfigured) ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-emerald-400"><CheckCircle className="h-4 w-4" /><span className="text-xs">API configurada</span></div>
                        </div>
                      ) : mp.available ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/produtos/oportunidades">Ver produtos</Link>
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
