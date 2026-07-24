"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Plug,
  CreditCard,
  Settings,
  CalendarDays,
  Brain,
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
  { label: "Aprendizados",          href: "/narrativas",   icon: Brain },
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
    avatarUrl: string | null;
    status: string;
    isMock: boolean;
    activeNarrator?: { id: string; name: string } | null;
  }>;
  selectedAccountId: string | null;
}

export function Sidebar({ accounts, selectedAccountId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[var(--border-subtle)] bg-[var(--sidebar-bg)]">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-[var(--border-subtle)] px-5">
        <img src="/logo-horizontal.png" alt="Escriba IA" className="h-9 w-auto" />
      </div>

      {/* Account selector */}
      <div className="border-b border-[var(--border-subtle)] px-3 py-2">
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
                      ? "text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                  style={isActive ? { background: "var(--brand-gradient)" } : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

    </aside>
  );
}
