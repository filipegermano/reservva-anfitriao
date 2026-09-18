import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ACCOUNT_COOKIE } from "@/lib/account";
import { acceptInvite } from "@/lib/invites";

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Entre na sua conta para aceitar o convite" }, { status: 401 });
  }

  const { token } = await params;
  const result = await acceptInvite(token, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  // Já entra com a conta compartilhada selecionada.
  const response = NextResponse.json({ ok: true, accountName: result.accountName });
  response.cookies.set(ACCOUNT_COOKIE, result.accountId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
