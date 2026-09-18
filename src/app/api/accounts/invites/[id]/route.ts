import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionAccount } from "@/lib/account";

type RouteParams = { params: Promise<{ id: string }> };

/** Revoga um convite que ainda não foi usado. */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!account.isOwner) {
    return NextResponse.json({ error: "Só o dono da conta pode fazer isso" }, { status: 403 });
  }

  const { id } = await params;
  const invite = await prisma.accountInvite.findUnique({ where: { id } });
  if (!invite || invite.accountId !== account.accountId) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  await prisma.accountInvite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
