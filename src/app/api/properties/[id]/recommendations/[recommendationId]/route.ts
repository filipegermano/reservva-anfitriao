import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedProperty } from "@/lib/property-access";
import { recommendationSchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ id: string; recommendationId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id, recommendationId } = await params;
  const property = await getOwnedProperty(id, session.user.id);
  if (!property) {
    return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recommendationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
  });
  if (!existing || existing.propertyId !== id) {
    return NextResponse.json({ error: "Recomendação não encontrada" }, { status: 404 });
  }

  const recommendation = await prisma.recommendation.update({
    where: { id: recommendationId },
    data: parsed.data,
  });

  return NextResponse.json({ recommendation });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id, recommendationId } = await params;
  const property = await getOwnedProperty(id, session.user.id);
  if (!property) {
    return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
  }

  const existing = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
  });
  if (!existing || existing.propertyId !== id) {
    return NextResponse.json({ error: "Recomendação não encontrada" }, { status: 404 });
  }

  await prisma.recommendation.delete({ where: { id: recommendationId } });

  return NextResponse.json({ ok: true });
}
