import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireOwnedProperty } from "@/lib/api";
import { recommendationSchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ id: string; recommendationId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, recommendationId } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

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
  const { id, recommendationId } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const existing = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
  });
  if (!existing || existing.propertyId !== id) {
    return NextResponse.json({ error: "Recomendação não encontrada" }, { status: 404 });
  }

  await prisma.recommendation.delete({ where: { id: recommendationId } });

  return NextResponse.json({ ok: true });
}
