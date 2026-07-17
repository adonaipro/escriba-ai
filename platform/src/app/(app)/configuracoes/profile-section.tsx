"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  userName: string;
  userEmail: string;
  userNiche: string;
}

export function ProfileSection({ userName, userEmail, userNiche }: Props) {
  const router = useRouter();
  const [name, setName] = useState(userName);
  const [niche, setNiche] = useState(userNiche);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedPw, setSavedPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorPw, setErrorPw] = useState<string | null>(null);

  async function handleSaveProfile() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), niche: niche.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao salvar."); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePassword() {
    setErrorPw(null);
    if (newPassword !== confirmPassword) { setErrorPw("As senhas não conferem."); return; }
    if (newPassword.length < 8) { setErrorPw("A nova senha precisa ter ao menos 8 caracteres."); return; }
    setSavingPw(true);
    setSavedPw(false);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorPw(data.error ?? "Erro ao alterar senha."); return; }
      setSavedPw(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => setSavedPw(false), 3000);
    } catch {
      setErrorPw("Erro de conexão.");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-zinc-400" />
          <CardTitle className="text-base">Perfil</CardTitle>
        </div>
        <CardDescription>Informações da sua conta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={userEmail} disabled className="opacity-50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="niche">Nicho</Label>
            <Input
              id="niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Ex: Moda e Beleza, Fitness..."
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={saving || (!name.trim() && !niche.trim())}
            >
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Salvando...</> : "Salvar perfil"}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Salvo
              </span>
            )}
          </div>
        </div>

        {/* Password change */}
        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <p className="text-sm font-medium text-zinc-300">Alterar senha</p>
          <Input
            type="password"
            placeholder="Senha atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Nova senha (mín. 8 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errorPw && <p className="text-xs text-red-400">{errorPw}</p>}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSavePassword}
              disabled={savingPw || !currentPassword || !newPassword || !confirmPassword}
            >
              {savingPw ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Salvando...</> : "Atualizar senha"}
            </Button>
            {savedPw && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Senha atualizada
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
