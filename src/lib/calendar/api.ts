import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getOwnedProperty } from "@/lib/property-access";

/** Retorna o id do anfitrião logado ou a resposta 401. */
export async function requireUserId(): Promise<{ userId: string; error?: never } | { error: NextResponse; userId?: never }> {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  return { userId: session.user.id };
}

/** Um calendário só pode ser vinculado a um imóvel do próprio anfitrião. */
export async function checkPropertyLink(propertyId: string | null | undefined, userId: string) {
  if (!propertyId) return null;
  const property = await getOwnedProperty(propertyId, userId);
  return property ? null : NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
}
