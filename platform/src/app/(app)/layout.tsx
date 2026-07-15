import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { AccountContextBar } from "@/components/layout/account-context-bar";
import { getProfileAccounts, getSelectedAccountId } from "@/lib/account";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const profileId = session.user.profile?.id;

  const [accounts, selectedAccountId] = profileId
    ? await Promise.all([
        getProfileAccounts(profileId),
        getSelectedAccountId(profileId),
      ])
    : [[], null];

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar accounts={accounts} selectedAccountId={selectedAccountId} />
      <TopNav
        userName={session.user.name || undefined}
        userEmail={session.user.email}
      />
      <main className="pl-60 pt-14">
        <AccountContextBar account={selectedAccount} />
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
