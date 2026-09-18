import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { createInvite } from "@/lib/invites";
import { POST } from "./route";

// Integração: cadastro com e sem convite, contra o banco de desenvolvimento.
const PREFIX = `test-registro-${Date.now()}`;

let accountId = "";
let ownerId = "";

const register = (body: Record<string, unknown>) =>
  POST(new Request("http://localhost/api/register", { method: "POST", body: JSON.stringify(body) }));

/** O cadastro público é fechado por padrão (REGISTRATION_ENABLED). */
const openRegistration = () => {
  process.env.REGISTRATION_ENABLED = "true";
};

afterEach(() => {
  delete process.env.REGISTRATION_ENABLED;
});

beforeAll(async () => {
  const owner = await prisma.user.create({
    data: { name: "Dona", email: `${PREFIX}-dona@example.com`, passwordHash: "x" },
  });
  const account = await prisma.account.create({
    data: { name: PREFIX, members: { create: { userId: owner.id, role: "OWNER" } } },
  });
  ownerId = owner.id;
  accountId = account.id;
});

afterAll(async () => {
  await prisma.account.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: PREFIX } } });
});

describe("POST /api/register", () => {
  it("com o cadastro aberto e sem convite, cria a conta própria da pessoa", async () => {
    openRegistration();
    const email = `${PREFIX}-sozinho@example.com`;
    const response = await register({ name: `${PREFIX} Sozinho`, email, password: "senha-de-teste" });
    expect(response.status).toBe(201);

    const membership = await prisma.accountMember.findFirst({
      where: { user: { email } },
      include: { account: { select: { name: true } } },
    });
    expect(membership?.role).toBe("OWNER");
    expect(membership?.account.name).toBe(`${PREFIX} Sozinho`);
  });

  it("com o cadastro fechado, recusa quem não tem convite", async () => {
    const email = `${PREFIX}-sem-convite@example.com`;
    const response = await register({ name: "Sem Convite", email, password: "senha-de-teste" });
    expect(response.status).toBe(403);

    const semConvite = await register({
      name: "Token Ruim",
      email,
      password: "senha-de-teste",
      inviteToken: "nao-existe",
    });
    expect(semConvite.status).toBe(403);
    expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
  });

  it("com o cadastro fechado, o convite ainda vale", async () => {
    const { token } = await createInvite(accountId, ownerId, null);
    const email = `${PREFIX}-convidado@example.com`;

    const response = await register({
      name: "Convidado",
      email,
      password: "senha-de-teste",
      inviteToken: token,
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ account: { name: PREFIX } });

    const memberships = await prisma.accountMember.findMany({ where: { user: { email } } });
    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({ accountId, role: "MEMBER" });
  });

  it("com o cadastro aberto e convite inválido, ainda assim cria a conta própria", async () => {
    openRegistration();
    const email = `${PREFIX}-token-ruim@example.com`;
    const response = await register({
      name: `${PREFIX} Token Ruim`,
      email,
      password: "senha-de-teste",
      inviteToken: "nao-existe",
    });
    expect(response.status).toBe(201);

    const membership = await prisma.accountMember.findFirst({ where: { user: { email } } });
    expect(membership?.role).toBe("OWNER");
  });
});
