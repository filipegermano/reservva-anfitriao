import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { getAccountProperty } from "@/lib/property-access";

// A regra central do acesso compartilhado: o guia é da conta, não da pessoa.
const PREFIX = `test-acesso-${Date.now()}`;

let accountId = "";
let otherAccountId = "";
let propertyId = "";

beforeAll(async () => {
  const [account, other] = await Promise.all([
    prisma.account.create({ data: { name: `${PREFIX}-a` } }),
    prisma.account.create({ data: { name: `${PREFIX}-b` } }),
  ]);
  const property = await prisma.property.create({
    data: { accountId: account.id, name: `${PREFIX} Casa`, slug: `${PREFIX}-casa` },
  });
  accountId = account.id;
  otherAccountId = other.id;
  propertyId = property.id;
});

afterAll(async () => {
  await prisma.account.deleteMany({ where: { name: { startsWith: PREFIX } } });
});

describe("getAccountProperty", () => {
  it("entrega o guia para a conta dona dele", async () => {
    await expect(getAccountProperty(propertyId, accountId)).resolves.toMatchObject({ id: propertyId });
  });

  it("não entrega o guia para outra conta", async () => {
    await expect(getAccountProperty(propertyId, otherAccountId)).resolves.toBeNull();
    await expect(getAccountProperty("nao-existe", accountId)).resolves.toBeNull();
  });
});
