import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedProperty } from "@/lib/property-access";
import { updatePropertySchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: { recommendations: { orderBy: { order: "asc" } } },
  });

  if (!property || property.userId !== session.user.id) {
    return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ property });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedProperty(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updatePropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const property = await prisma.property.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ property });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnedProperty(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
  }

  await prisma.property.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
