"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  BookOpen,
  Plug,
  CreditCard,
  Settings,
  Zap,
  CalendarDays,
  Library,
  Users,
  BarChart3,
  FlaskConical,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountSelector } from "./account-selector";

const navItems = [
  { label: "Workspace",            href: "/workspace",    icon: BarChart3 },
  { label: "Dashboard",            href: "/dashboard",    icon: LayoutDashboard },
  { label: "Campanhas",            href: "/campanhas",    icon: Megaphone },
  { label: "Produtos",             href: "/produtos",     icon: ShoppingBag },
  { label: "Narradores",           href: "/narradores",   icon: Users },
  { label: "Biblioteca Narrativa", href: "/narrativas",   icon: Library },
  { label: "Padrões Narrativos",   href: "/aprendizados", icon: BookOpen },
  { label: "Laboratório",          href: "/laboratorio",  icon: FlaskConical },
  { label: "Calendário",           href: "/calendario",   icon: CalendarDays },
  { label: "Integrações",          href: "/integracoes",  icon: Plug },
  { label: "Plano & Uso",          href: "/plano",        icon: CreditCard },
  { label: "Configurações",        href: "/configuracoes", icon: Settings },
];

interface SidebarProps {
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

export function Sidebar({ accounts, selectedAccountId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-zinc-800 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-zinc-100">Grok Platform</span>
      </div>

      {/* Account selector */}
      <div className="border-b border-zinc-800 px-3 py-2">
        <AccountSelector accounts={accounts} selectedAccountId={selectedAccountId} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && item.href !== "/workspace" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-violet-600/10 text-violet-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Simulated indicator */}
      <div className="border-t border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-amber-950/30 border border-amber-800/50 px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
          <span className="text-xs text-amber-400">Modo simulado</span>
        </div>
      </div>
    </aside>
  );
}
