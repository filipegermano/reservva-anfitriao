import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";

import { auth } from "@/auth";
import { findInvite, inviteMessages } from "@/lib/invites";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AcceptInviteButton } from "@/components/team/accept-invite-button";

export const metadata: Metadata = { title: "Convite · Reservva Anfitrião" };

type PageProps = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const [{ status, invite }, session] = await Promise.all([findInvite(token), auth()]);

  const inviteUrl = `/convite/${encodeURIComponent(token)}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link href="/" className="mb-8 text-xl font-semibold tracking-tight">
        Reservva <span className="text-primary">Anfitrião</span>
      </Link>

      <Card className="w-full max-w-sm">
        {status !== "valido" || !invite ? (
          <>
            <CardHeader>
              <CardTitle>Convite indisponível</CardTitle>
              <CardDescription>{inviteMessages[status as keyof typeof inviteMessages]}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/app">Ir para o painel</Link>
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
                <Users className="size-5" />
              </div>
              <CardTitle>Você foi convidado</CardTitle>
              <CardDescription>
                Entre na conta <strong>{invite.account.name}</strong> para ver e editar os guias,
                cartazes e calendários de reservas junto com a equipe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {session?.user ? (
                <AcceptInviteButton token={token} accountName={invite.account.name} />
              ) : (
                <>
                  <Button asChild className="w-full">
                    <Link href={`/registrar?convite=${encodeURIComponent(token)}`}>
                      Criar minha conta
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/entrar?callbackUrl=${encodeURIComponent(inviteUrl)}`}>
                      Já tenho conta
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
