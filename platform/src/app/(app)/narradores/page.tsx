import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function NarradoresPage() {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const narrators = await prisma.narrator.findMany({
    where: { profileId: session.user.profile.id },
    select: {
      id: true,
      name: true,
      sex: true,
      status: true,
      _count: { select: { trends: true, campaigns: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const hasMale = narrators.some((n) => n.sex === "male" && n.status === "active");
  const hasFemale = narrators.some((n) => n.sex === "female" && n.status === "active");

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Narradores</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Apenas o sexo importa: Homem ou Mulher. Define pronomes nas histórias.
          </p>
        </div>
        {(!hasMale || !hasFemale) && (
          <Button asChild>
            <Link href="/narradores/novo">
              <Plus className="h-4 w-4" /> Novo
            </Link>
          </Button>
        )}
      </div>

      {narrators.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Users className="h-8 w-8 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400">Nenhum narrador ainda.</p>
            <Button asChild>
              <Link href="/narradores/novo">Escolher Homem ou Mulher</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {narrators.map((n) => (
            <Link key={n.id} href={`/narradores/${n.id}`}>
              <Card className="hover:border-zinc-700 transition-colors mb-2">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">
                      {n.sex === "male" ? "H" : "M"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        {n.sex === "male" ? "Homem" : "Mulher"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {n._count.campaigns} campanhas · {n._count.trends} histórias
                      </p>
                    </div>
                  </div>
                  <Badge variant={n.status === "active" ? "success" : "outline"}>
                    {n.status === "active" ? "ativo" : n.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {hasMale && hasFemale && (
        <p className="text-xs text-zinc-600">
          Você já tem um narrador homem e uma mulher ativos. Use-os nas campanhas e no Laboratório.
        </p>
      )}
    </div>
  );
}
