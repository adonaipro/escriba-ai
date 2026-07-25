import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function NarradorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user.profile) return null;
  const { id } = await params;

  const narrator = await prisma.narrator.findFirst({
    where: { id, profileId: session.user.profile.id },
    select: {
      id: true,
      sex: true,
      status: true,
      name: true,
      _count: { select: { campaigns: true, trends: true } },
    },
  });
  if (!narrator) notFound();

  const label = narrator.sex === "male" ? "Homem" : "Mulher";

  return (
    <div className="space-y-6 max-w-lg">
      <Link href="/narradores" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
        <ArrowLeft className="h-3 w-3" /> Narradores
      </Link>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-300">
          {narrator.sex === "male" ? "H" : "M"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Narrador {label}</h1>
          <p className="text-xs text-zinc-500">Único atributo usado na geração: sexo</p>
        </div>
        <Badge className="ml-auto" variant={narrator.status === "active" ? "success" : "outline"}>
          {narrator.status}
        </Badge>
      </div>
      <Card>
        <CardContent className="p-5 space-y-2 text-sm text-zinc-400">
          <p>
            <span className="text-zinc-500">Sexo:</span>{" "}
            <span className="text-zinc-200">{label}</span>
          </p>
          <p>
            Campanhas: {narrator._count.campaigns} · Histórias: {narrator._count.trends}
          </p>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/laboratorio">Laboratório</Link>
        </Button>
        <Button asChild>
          <Link href="/campanhas/nova">Nova campanha</Link>
        </Button>
      </div>
    </div>
  );
}
