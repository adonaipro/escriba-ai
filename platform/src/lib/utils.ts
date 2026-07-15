import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function isScoreState(score: number): string {
  if (score <= 20) return "anti_pattern";
  if (score <= 40) return "ineffective";
  if (score <= 60) return "inconclusive";
  if (score <= 80) return "promising";
  if (score <= 90) return "validated";
  return "high_confidence";
}

export function scoreStateLabel(state: string): string {
  const labels: Record<string, string> = {
    anti_pattern: "Anti-padrão",
    ineffective: "Ineficaz",
    inconclusive: "Inconclusivo",
    promising: "Promissor",
    validated: "Validado",
    high_confidence: "Alta confiança",
  };
  return labels[state] || state;
}

export function campaignStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    testing: "Testando",
    scale_eligible: "Pronto para escala",
    scaling: "Escalando",
    monitoring: "Monitorando",
    saturating: "Saturando",
    paused: "Pausado",
    ended: "Encerrado",
  };
  return labels[status] || status;
}
