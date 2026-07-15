import { cookies } from "next/headers";
import { prisma } from "./db";

export const ACCOUNT_COOKIE = "act";
export const ACCOUNT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface ActiveAccount {
  id: string;
  network: string;
  username: string | null;
  displayName: string | null;
  status: string;
  isMock: boolean;
  activeNarrator?: { id: string; name: string } | null;
}

// ─────────────────────────────────────────────────────────────────
// Resolve selected account ID from cookie → DB fallback → first account
// ─────────────────────────────────────────────────────────────────

export async function getSelectedAccountId(profileId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(ACCOUNT_COOKIE)?.value;

  if (fromCookie) {
    const exists = await prisma.socialAccount.findFirst({
      where: { id: fromCookie, profileId, status: "active" },
      select: { id: true },
    });
    if (exists) return exists.id;
  }

  // Fallback: profile's saved preference
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { activeAccountId: true },
  });

  if (profile?.activeAccountId) {
    const exists = await prisma.socialAccount.findFirst({
      where: { id: profile.activeAccountId, profileId, status: "active" },
      select: { id: true },
    });
    if (exists) return exists.id;
  }

  // Final fallback: first available
  const first = await prisma.socialAccount.findFirst({
    where: { profileId, status: "active" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return first?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────
// Get full selected account with active narrator
// ─────────────────────────────────────────────────────────────────

export async function getSelectedAccount(profileId: string): Promise<ActiveAccount | null> {
  const id = await getSelectedAccountId(profileId);
  if (!id) return null;

  const account = await prisma.socialAccount.findFirst({
    where: { id, profileId },
    include: {
      accountNarrators: {
        where: { isActive: true },
        include: { narrator: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  });

  if (!account) return null;

  return {
    id: account.id,
    network: account.network,
    username: account.username,
    displayName: account.displayName,
    status: account.status,
    isMock: account.isMock,
    activeNarrator: account.accountNarrators[0]?.narrator ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────
// Get all accounts for a profile (for the selector)
// ─────────────────────────────────────────────────────────────────

export async function getProfileAccounts(profileId: string): Promise<ActiveAccount[]> {
  const accounts = await prisma.socialAccount.findMany({
    where: { profileId, status: "active" },
    include: {
      accountNarrators: {
        where: { isActive: true },
        include: { narrator: { select: { id: true, name: true } } },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return accounts.map((a) => ({
    id: a.id,
    network: a.network,
    username: a.username,
    displayName: a.displayName,
    status: a.status,
    isMock: a.isMock,
    activeNarrator: a.accountNarrators[0]?.narrator ?? null,
  }));
}

// ─────────────────────────────────────────────────────────────────
// Build Prisma campaign filter for the selected account
// Used by all operational API routes
// ─────────────────────────────────────────────────────────────────

export function accountCampaignFilter(accountId: string | null) {
  if (!accountId) return {};
  return { socialAccountId: accountId };
}
