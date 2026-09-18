import { cookies } from "next/headers";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Conta escolhida por quem participa de mais de uma (ver /api/accounts/active). */
export const ACCOUNT_COOKIE = "reservva_conta";

export type AccountOption = { id: string; name: string; role: "OWNER" | "MEMBER" };

export type SessionAccount = {
  userId: string;
  userName: string;
  accountId: string;
  accountName: string;
  role: "OWNER" | "MEMBER";
  isOwner: boolean;
  /** Todas as contas de que a pessoa participa, para o seletor no topo. */
  accounts: AccountOption[];
};

async function listMemberships(userId: string) {
  return prisma.accountMember.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { account: { select: { id: true, name: true } } },
  });
}

/**
 * Garante que a pessoa tenha ao menos uma conta. Usuários criados antes das
 * contas compartilhadas ganharam a sua na migração; isto cobre o resto (por
 * exemplo, quem foi removido da única conta de que participava).
 */
async function ensurePersonalAccount(userId: string, userName: string) {
  return prisma.account.create({
    data: {
      name: userName,
      members: { create: { userId, role: "OWNER" } },
    },
    select: { id: true, name: true },
  });
}

/** Sessão + conta ativa. Retorna null se ninguém estiver logado. */
export async function getSessionAccount(): Promise<SessionAccount | null> {
  const session = await auth();
  if (!session?.user) return null;

  const userId = session.user.id;
  const userName = session.user.name ?? "Anfitrião";
  let memberships = await listMemberships(userId);

  if (memberships.length === 0) {
    await ensurePersonalAccount(userId, userName);
    memberships = await listMemberships(userId);
  }

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACCOUNT_COOKIE)?.value;
  const current =
    memberships.find((membership) => membership.accountId === preferred) ?? memberships[0];

  return {
    userId,
    userName,
    accountId: current.accountId,
    accountName: current.account.name,
    role: current.role,
    isOwner: current.role === "OWNER",
    accounts: memberships.map((membership) => ({
      id: membership.accountId,
      name: membership.account.name,
      role: membership.role,
    })),
  };
}

/** Versão para páginas dentro de /app, onde o proxy já exigiu login. */
export async function requireSessionAccount(): Promise<SessionAccount> {
  const account = await getSessionAccount();
  if (!account) throw new Error("Sessão sem conta ativa");
  return account;
}

/** Contas de que o usuário participa — usado para checar acesso a um guia. */
export async function accountIdsOf(userId: string): Promise<string[]> {
  const memberships = await prisma.accountMember.findMany({
    where: { userId },
    select: { accountId: true },
  });
  return memberships.map((membership) => membership.accountId);
}
