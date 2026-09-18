import Link from "next/link";

import { requireSessionAccount } from "@/lib/account";
import { SignOutButton } from "@/components/sign-out-button";
import { AccountSwitcher } from "@/components/team/account-switcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await requireSessionAccount();

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-lg font-semibold tracking-tight">
              Reservva <span className="text-primary">Anfitrião</span>
            </Link>
            {account.accounts.length > 1 ? (
              <AccountSwitcher accounts={account.accounts} currentId={account.accountId} />
            ) : (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {account.accountName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/app" className="text-muted-foreground hover:text-foreground">
                Guias
              </Link>
              <Link href="/app/calendario" className="text-muted-foreground hover:text-foreground">
                Calendário
              </Link>
              <Link href="/app/equipe" className="text-muted-foreground hover:text-foreground">
                Equipe
              </Link>
            </nav>
            <span className="hidden text-sm text-muted-foreground sm:inline">{account.userName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
