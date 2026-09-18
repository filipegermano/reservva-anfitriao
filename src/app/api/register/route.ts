import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { acceptInvite } from "@/lib/invites";
import { allowSignup } from "@/lib/registration";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password, inviteToken } = parsed.data;

  if (!(await allowSignup(inviteToken))) {
    return NextResponse.json(
      { error: "O cadastro está fechado. Peça um convite ao anfitrião responsável." },
      { status: 403 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma conta com este e-mail" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true },
  });

  // Com convite válido, a pessoa entra na conta de quem convidou; sem
  // convite, ganha a própria conta.
  const joined = inviteToken ? await acceptInvite(inviteToken, user.id) : null;
  if (!joined?.ok) {
    await prisma.account.create({
      data: { name, members: { create: { userId: user.id, role: "OWNER" } } },
    });
  }

  return NextResponse.json(
    { user, account: joined?.ok ? { name: joined.accountName } : null },
    { status: 201 },
  );
}
