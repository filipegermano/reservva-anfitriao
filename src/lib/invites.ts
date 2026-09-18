import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

/** Um convite vale por uma semana e serve para uma pessoa só. */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Se o prazo do convite já passou. */
export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Cria o convite e devolve o token em texto puro — ele só existe aqui, porque
 * o banco guarda apenas o hash. Quem perder o link gera outro.
 */
export async function createInvite(accountId: string, createdById: string, label: string | null) {
  const token = randomBytes(24).toString("base64url");

  const invite = await prisma.accountInvite.create({
    data: {
      accountId,
      createdById,
      label,
      tokenHash: hashInviteToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  return { invite, token };
}

export type InviteStatus = "valido" | "inexistente" | "expirado" | "usado";

/** Procura o convite pelo token e diz por que ele não serve, quando for o caso. */
export async function findInvite(token: string) {
  const invite = await prisma.accountInvite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    include: { account: { select: { id: true, name: true } } },
  });

  if (!invite) return { status: "inexistente" as InviteStatus, invite: null };
  if (invite.acceptedAt) return { status: "usado" as InviteStatus, invite };
  if (isExpired(invite.expiresAt)) {
    return { status: "expirado" as InviteStatus, invite };
  }
  return { status: "valido" as InviteStatus, invite };
}

export const inviteMessages: Record<Exclude<InviteStatus, "valido">, string> = {
  inexistente: "Convite inválido. Peça um link novo para o dono da conta.",
  expirado: "Este convite expirou. Peça um link novo para o dono da conta.",
  usado: "Este convite já foi usado. Peça um link novo para o dono da conta.",
};

/** Entra na conta do convite. Já ser membro conta como sucesso. */
export async function acceptInvite(token: string, userId: string) {
  const { status, invite } = await findInvite(token);
  if (status !== "valido" || !invite) {
    return { ok: false as const, message: inviteMessages[status as Exclude<InviteStatus, "valido">] };
  }

  const existing = await prisma.accountMember.findUnique({
    where: { accountId_userId: { accountId: invite.accountId, userId } },
  });

  if (existing) {
    await prisma.accountInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return { ok: true as const, accountId: invite.accountId, accountName: invite.account.name };
  }

  await prisma.$transaction([
    prisma.accountMember.create({
      data: { accountId: invite.accountId, userId, role: "MEMBER" },
    }),
    prisma.accountInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return { ok: true as const, accountId: invite.accountId, accountName: invite.account.name };
}
