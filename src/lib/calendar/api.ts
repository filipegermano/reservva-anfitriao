import { NextResponse } from "next/server";

import { getSessionAccount } from "@/lib/account";
import { getAccountProperty } from "@/lib/property-access";

/** Retorna o id da conta ativa de quem está logado, ou a resposta 401. */
export async function requireAccountId(): Promise<
  { accountId: string; error?: never } | { error: NextResponse; accountId?: never }
> {
  const account = await getSessionAccount();
  if (!account) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  return { accountId: account.accountId };
}

/** Um calendário só pode ser vinculado a um imóvel da mesma conta. */
export async function checkPropertyLink(propertyId: string | null | undefined, accountId: string) {
  if (!propertyId) return null;
  const property = await getAccountProperty(propertyId, accountId);
  return property ? null : NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
}
