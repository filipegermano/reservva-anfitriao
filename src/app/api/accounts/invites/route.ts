import { NextResponse } from "next/server";

import { getSessionAccount } from "@/lib/account";
import { appOrigin, parseJsonBody } from "@/lib/api";
import { createInvite } from "@/lib/invites";
import { inviteSchema } from "@/lib/validations/account";

export async function POST(request: Request) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!account.isOwner) {
    return NextResponse.json({ error: "Só o dono da conta pode convidar" }, { status: 403 });
  }

  const { data, error } = await parseJsonBody(request, inviteSchema);
  if (error) return error;

  const { invite, token } = await createInvite(account.accountId, account.userId, data.label);

  // O link completo só existe nesta resposta: o banco guarda só o hash.
  return NextResponse.json(
    {
      invite: { id: invite.id, label: invite.label, expiresAt: invite.expiresAt },
      url: `${appOrigin(request)}/convite/${token}`,
    },
    { status: 201 },
  );
}
