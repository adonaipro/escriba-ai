import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LlmConfigSection } from "./llm-config-section";
import { ProfileSection } from "./profile-section";

export default async function ConfiguracoesPage() {
  const session = await getSession();
  if (!session?.user.profile) return null;

  const { user } = session;
  const profile = user.profile!;

  const llmConfig = await prisma.llmConfig.findUnique({
    where: { profileId: profile.id },
    select: { provider: true, model: true, baseUrl: true },
  });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Configurações</h1>
        <p className="text-sm text-zinc-400">
          Gerencie sua conta e preferências da plataforma
        </p>
      </div>

      <ProfileSection
        userName={user.name || ""}
        userEmail={user.email}
        userNiche={profile.niche}
      />

      <Separator />

      {/* LLM config — client component */}
      <LlmConfigSection
        initialConfig={{
          provider: llmConfig?.provider ?? "groq",
          model: llmConfig?.model ?? "",
          baseUrl: llmConfig?.baseUrl ?? "",
        }}
      />

      <Separator />

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-zinc-400" />
            <CardTitle className="text-base">Notificações</CardTitle>
          </div>
          <CardDescription>Configure quando deseja ser alertado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Campanha pronta para escala", description: "Quando o Motor ESCALA detectar oportunidade" },
            { label: "Padrão narrativo detectado", description: "Quando a Entidade descobrir novo padrão que funciona" },
            { label: "Saturação detectada", description: "Quando uma campanha começar a saturar" },
            { label: "Resumo semanal", description: "Relatório de performance toda segunda-feira" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.description}</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          ))}
          <p className="text-xs text-zinc-500">
            Notificações reais (e-mail, push) disponíveis em produção.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* System info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações do sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Versão</span>
              <span className="text-zinc-300">0.2.0-narrative</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Banco de dados</span>
              <span className="text-zinc-300">SQLite (dev) → PostgreSQL (prod)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Narrative Engine</span>
              <Badge variant={llmConfig && llmConfig.provider !== "simulated" ? "success" : "warning"}>
                {llmConfig && llmConfig.provider !== "simulated" ? llmConfig.provider : "Modo simulado"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">ID da conta</span>
              <span className="text-zinc-500 font-mono text-xs">{user.id.slice(0, 16)}…</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
