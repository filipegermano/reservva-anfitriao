import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { acceptInvite, createInvite, findInvite, hashInviteToken } from "@/lib/invites";

// Integração com o banco de desenvolvimento: cria conta e usuários próprios
// (prefixo "test-convite") e apaga tudo no final.
const PREFIX = `test-convite-${Date.now()}`;

let accountId = "";
let ownerId = "";
let guestId = "";

beforeAll(async () => {
  const owner = await prisma.user.create({
    data: { name: "Dono", email: `${PREFIX}-dono@example.com`, passwordHash: "x" },
  });
  const guest = await prisma.user.create({
    data: { name: "Convidado", email: `${PREFIX}-convidado@example.com`, passwordHash: "x" },
  });
  const account = await prisma.account.create({
    data: { name: PREFIX, members: { create: { userId: owner.id, role: "OWNER" } } },
  });
  ownerId = owner.id;
  guestId = guest.id;
  accountId = account.id;
});

afterAll(async () => {
  await prisma.account.deleteMany({ where: { name: PREFIX } });
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
});

describe("convites", () => {
  it("guarda só o hash do token", async () => {
    const { invite, token } = await createInvite(accountId, ownerId, "Ana");
    expect(invite.tokenHash).toBe(hashInviteToken(token));
    expect(invite.tokenHash).not.toContain(token);
    expect((await findInvite(token)).status).toBe("valido");
    expect((await findInvite("token-inventado")).status).toBe("inexistente");
  });

  it("aceitar adiciona a pessoa como membro e queima o convite", async () => {
    const { token } = await createInvite(accountId, ownerId, null);

    const result = await acceptInvite(token, guestId);
    expect(result).toMatchObject({ ok: true, accountId });

    const membership = await prisma.accountMember.findUnique({
      where: { accountId_userId: { accountId, userId: guestId } },
    });
    expect(membership?.role).toBe("MEMBER");

    // Uso único: o mesmo link não serve para mais ninguém.
    expect((await findInvite(token)).status).toBe("usado");
    const reuse = await acceptInvite(token, ownerId);
    expect(reuse.ok).toBe(false);
  });

  it("recusa convite expirado", async () => {
    const { invite, token } = await createInvite(accountId, ownerId, null);
    await prisma.accountInvite.update({
      where: { id: invite.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect((await findInvite(token)).status).toBe("expirado");
    const result = await acceptInvite(token, guestId);
    expect(result).toMatchObject({ ok: false });
    expect(result.ok ? "" : result.message).toContain("expirou");
  });

  it("quem já é membro não vira membro duas vezes", async () => {
    const { token } = await createInvite(accountId, ownerId, null);
    await acceptInvite(token, guestId);

    const members = await prisma.accountMember.count({ where: { accountId, userId: guestId } });
    expect(members).toBe(1);
  });
});
