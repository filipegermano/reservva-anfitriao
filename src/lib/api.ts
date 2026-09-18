import { NextResponse } from "next/server";
import type { z } from "zod";

import { getSessionAccount, type SessionAccount } from "@/lib/account";
import { getAccountProperty } from "@/lib/property-access";

type OwnedPropertyResult =
  | {
      property: NonNullable<Awaited<ReturnType<typeof getAccountProperty>>>;
      account: SessionAccount;
      error?: never;
    }
  | { error: NextResponse; property?: never; account?: never };

/** Autentica o membro e garante que o imóvel é da conta ativa dele. */
export async function requireOwnedProperty(propertyId: string): Promise<OwnedPropertyResult> {
  const account = await getSessionAccount();
  if (!account) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }

  const property = await getAccountProperty(propertyId, account.accountId);
  if (!property) {
    return { error: NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 }) };
  }

  return { property, account };
}

/** Ações restritas ao dono da conta (excluir guia, gerenciar a equipe). */
export function ownerOnly(account: SessionAccount): NextResponse | null {
  return account.isOwner
    ? null
    : NextResponse.json({ error: "Só o dono da conta pode fazer isso" }, { status: 403 });
}

export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T>; error?: never } | { error: NextResponse; data?: never }> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return {
      error: NextResponse.json(
        { error: message, issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { data: parsed.data };
}

/** URL pública configurada (NEXT_PUBLIC_APP_URL ou AUTH_URL), se houver. */
export function configuredAppOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL;
  if (!configured) return null;
  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

/** URL pública do app (links do guia, QR code, cartaz). */
export function appOrigin(request: Request): string {
  return configuredAppOrigin() ?? new URL(request.url).origin;
}

export function guideUrl(origin: string, slug: string): string {
  return `${origin}/g/${slug}`;
}
