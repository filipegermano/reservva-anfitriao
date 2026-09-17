import Link from "next/link";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/app" className="text-lg font-semibold tracking-tight">
              Reservva <span className="text-primary">Anfitrião</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/app" className="text-muted-foreground hover:text-foreground">
                Guias
              </Link>
              <Link href="/app/calendario" className="text-muted-foreground hover:text-foreground">
                Calendário
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session?.user?.name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
