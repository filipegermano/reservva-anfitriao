import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/account";
import { isExpired } from "@/lib/invites";
import { TeamPanel } from "@/components/team/team-panel";

export const metadata: Metadata = { title: "Equipe · Reservva Anfitrião" };

export default async function TeamPage() {
  const account = await requireSessionAccount();

  const [members, invites] = await Promise.all([
    prisma.accountMember.findMany({
      where: { accountId: account.accountId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      include: { user: { select: { name: true, email: true } } },
    }),
    // Convites já usados saem da lista: o membro aparece acima.
    prisma.accountInvite.findMany({
      where: { accountId: account.accountId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <TeamPanel
      accountName={account.accountName}
      isOwner={account.isOwner}
      currentUserId={account.userId}
      members={members.map((member) => ({
        id: member.id,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
      }))}
      invites={invites.map((invite) => ({
        id: invite.id,
        label: invite.label,
        expiresAt: invite.expiresAt.toISOString(),
        expired: isExpired(invite.expiresAt),
        createdAt: invite.createdAt.toISOString(),
      }))}
    />
  );
}
