import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionAccount } from "@/lib/account";

type RouteParams = { params: Promise<{ id: string }> };

/** O dono remove qualquer membro; um membro pode sair sozinho da conta. */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const member = await prisma.accountMember.findUnique({ where: { id } });
  if (!member || member.accountId !== account.accountId) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  if (member.role === "OWNER") {
    return NextResponse.json(
      { error: "O dono não pode ser removido da conta" },
      { status: 400 },
    );
  }

  const isSelf = member.userId === account.userId;
  if (!account.isOwner && !isSelf) {
    return NextResponse.json({ error: "Só o dono da conta pode fazer isso" }, { status: 403 });
  }

  await prisma.accountMember.delete({ where: { id } });
  return NextResponse.json({ ok: true, left: isSelf });
}
