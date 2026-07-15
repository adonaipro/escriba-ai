import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Settings, User, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LlmConfigSection } from "./llm-config-section";

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

      {/* Profile section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-zinc-400" />
            <CardTitle className="text-base">Perfil</CardTitle>
          </div>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input defaultValue={user.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input defaultValue={user.email} disabled />
            </div>
          </div>
          {profile && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nicho</Label>
                <Input defaultValue={profile.niche} disabled />
              </div>
              <div className="space-y-2">
                <Label>Estado do perfil</Label>
                <div className="flex items-center gap-2 h-9">
                  <Badge variant="success">{profile.state}</Badge>
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-zinc-500">
            Edição de perfil estará disponível em breve.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* LLM config — client component */}
      <LlmConfigSection
        initialConfig={{
          provider: llmConfig?.provider ?? "simulated",
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

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-zinc-400" />
            <CardTitle className="text-base">Segurança</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Alterar senha</Label>
            <div className="space-y-2">
              <Input type="password" placeholder="Senha atual" disabled />
              <Input type="password" placeholder="Nova senha" disabled />
              <Input type="password" placeholder="Confirmar nova senha" disabled />
            </div>
          </div>
          <Button variant="outline" disabled>Atualizar senha</Button>
          <p className="text-xs text-zinc-500">
            Alteração de senha disponível em breve.
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
