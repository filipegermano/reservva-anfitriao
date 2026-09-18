import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ACCOUNT_COOKIE, getSessionAccount } from "@/lib/account";
import { parseJsonBody } from "@/lib/api";
import { activeAccountSchema } from "@/lib/validations/account";

/** Troca a conta ativa de quem participa de mais de uma. */
export async function POST(request: Request) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data, error } = await parseJsonBody(request, activeAccountSchema);
  if (error) return error;

  const membership = await prisma.accountMember.findUnique({
    where: { accountId_userId: { accountId: data.accountId, userId: account.userId } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCOUNT_COOKIE, data.accountId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
