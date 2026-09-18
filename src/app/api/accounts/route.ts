import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionAccount } from "@/lib/account";
import { parseJsonBody } from "@/lib/api";
import { accountNameSchema } from "@/lib/validations/account";

/** Renomeia a conta ativa. */
export async function PATCH(request: Request) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!account.isOwner) {
    return NextResponse.json({ error: "Só o dono da conta pode fazer isso" }, { status: 403 });
  }

  const { data, error } = await parseJsonBody(request, accountNameSchema);
  if (error) return error;

  await prisma.account.update({ where: { id: account.accountId }, data: { name: data.name } });
  return NextResponse.json({ ok: true });
}
